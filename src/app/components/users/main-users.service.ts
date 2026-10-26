import { Injectable } from '@angular/core'
import csvDownload from 'json-to-csv-export'
import * as moment from 'moment'
import { catchError, EMPTY, filter, finalize, forkJoin, map, merge, Observable, of, shareReplay, throwError } from 'rxjs'
import K from 'src/app/constants/index'
import { NetworkService } from 'src/app/service/network.service'
import { ParticipantInsightsCacheStorageService } from 'src/app/service/participant-insights-cache-storage.service'
import { UserRequests } from 'src/app/service/requests/user-requests'

const USERS_CACHE_TTL_MS = 30_000

// Namespace segment for the OLD, group-keyed getParticipantsDetail() cache entries. Kept only for
// the USE_PER_PERSON_PARTICIPANT_CACHE=false fallback path - see
// PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md §6.11 (rollback plan).
const PARTICIPANTS_DETAIL_CACHE_NAMESPACE = 'participantsDetail:'

// GET_PARTICIPANTS_DETAIL is a POST, so the URL-keyed, GET-only CacheInterceptor can't
// dedupe it. single/double/three-user-selection and main-users.component.ts each call this
// independently (ngOnInit, ngOnChanges, store re-emissions, page refresh) for what is often
// the exact same {accountId, personIds} - without this, every one of those triggers fires its
// own network call even when an identical request already resolved moments ago.
const PARTICIPANTS_DETAIL_CACHE_TTL_MS = 30_000

// Namespace + primitives for the per-person participant-detail cache - see
// PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md. Replaces the group-keyed cache above: instead of
// one entry per distinct SET of selected participants (O(2^N) entries, no subset reuse - adding
// one person to a group of 3 refetched all 4), each participant's record is cached under its own
// {accountId, personId} key, so any already-seen participant in any combination loads instantly
// and only genuinely-unseen participants ever hit the network.
const PARTICIPANT_DETAIL_PERSON_NAMESPACE = 'participantDetailByPerson:'

// A participant confirmed absent from an account (the backend's response simply omits them) is
// tombstoned so repeated queries for that {accountId, personId} don't refetch forever - see plan
// §6.2. Shorter than the real-record fresh window (15 min) so a participant added to the account
// mid-session appears promptly, while still killing the repeated-refetch case.
const PARTICIPANT_TOMBSTONE_TTL_MS = 5 * 60 * 1000

// Kill switch for the per-person cache - see plan §6.11. Both the old (group-keyed) and new
// (per-person) code paths are kept side by side; the old namespace's entries expire via their own
// TTL regardless of which path is active, so flipping this back to false is a safe, low-risk way
// to back out in production without a git revert if an issue surfaces post-launch.
const USE_PER_PERSON_PARTICIPANT_CACHE = true

interface CachedParticipantsDetail {
    expiresAt: number
    response$: Observable<any>
}

// A tombstone marks a {accountId, personId} pair as confirmed absent (backend didn't return that
// person) rather than "never fetched" - contributes nothing to an assembled response but, unlike
// a plain cache miss, does not trigger a refetch until PARTICIPANT_TOMBSTONE_TTL_MS lapses.
interface PersonTombstone {
    __absent: true
    tombstonedAt: number
}

function isPersonTombstone(value: any): value is PersonTombstone {
    return !!value && value.__absent === true
}

@Injectable({
    providedIn: 'root',
})
export class MainUsersService {
    private participantsDetailCache = new Map<string, CachedParticipantsDetail>()
    // Guards against firing a second background revalidation for the same {accountId,
    // personIds} while one is already in flight - independent of the in-memory
    // participantsDetailCache above, which coalesces near-simultaneous foreground calls.
    // Only used by the OLD group-keyed path (USE_PER_PERSON_PARTICIPANT_CACHE=false).
    private participantsDetailInFlightRefreshes = new Set<string>()

    // Per-person in-flight dedup for the new path - keyed by {accountId}:{personId}, NOT by
    // request/group shape, specifically so two callers requesting the same group with different
    // pre-existing cache state (different `missing[]` subsets) still dedupe on any id they both
    // actually need. See plan §6.6 for why a group-shaped key doesn't work here.
    private personDetailInFlight = new Map<string, Observable<any | PersonTombstone>>()

    constructor(
        private networkService: NetworkService,
        private insightsCache: ParticipantInsightsCacheStorageService
    ) {
        // One-time cleanup of the old group-keyed namespace when the per-person path is active -
        // see plan §6.7. Harmless to run on every construction: once this path is live, nothing
        // ever writes to PARTICIPANTS_DETAIL_CACHE_NAMESPACE again, so there is never anything
        // valid to lose by clearing it repeatedly.
        if (USE_PER_PERSON_PARTICIPANT_CACHE) {
            this.insightsCache.clearByPrefix(PARTICIPANTS_DETAIL_CACHE_NAMESPACE)
        }
    }

    // Strips the modifiedOn column and triggers the CSV file download; returns the cleaned
    // list so the caller can still fire analytics tracking with the same exported data.
    downloadParticipantsCsv(rawData: any): any[] {
        const exportedUsersList = JSON.parse(JSON.stringify(rawData))
        exportedUsersList?.forEach((v: any) => {
            delete v?.modifiedOn
        })
        if (exportedUsersList.length) {
            csvDownload({
                data: exportedUsersList,
                filename: 'Participants',
                delimiter: ',',
            })
        }
        return exportedUsersList
    }

    getRiskBehaviorCall(personId: string) {
        return this.networkService.httpCall(UserRequests.getRiskBehavior(personId))
    }
    getBehaviralBiasesCall(personId: string, languageId: string) {
        return this.networkService.httpCall(UserRequests.getBehaviralBiases(personId, languageId))
    }
    getFDNAScoreCall(personId: string, languageId: string) {
        return this.networkService.httpCall(UserRequests.getFDNAScore(personId, languageId))
    }
    getUniqueStyleAndDescriptionCall(personId: string, languageId: string) {
        return this.networkService.httpCall(UserRequests.getUniqueStyleAndDescription(personId, languageId))
    }
    getVideoUrl(personId: string) {
        return this.networkService.httpCall(UserRequests.getVideoUrl(personId))
    }
    getWorkTalentsCall(personId: string, languageId: string) {
        return this.networkService.httpCall(UserRequests.getWorkTalents(personId, languageId))
    }
    getWorkPlaceInsightCall(personId: string, languageId: string) {
        return this.networkService.httpCall(UserRequests.getWorkPlaceInsight(personId, languageId))
    }
    getFinancialStyleMatchCall(personId_1: string, personId_2: string) {
        return this.networkService.httpCall(UserRequests.getFinancialStyleMatch(personId_1, personId_2))
    }
    getWorkStyleMatchCall(personId_1: string, personId_2: string) {
        return this.networkService.httpCall(UserRequests.getWorkStyleMatch(personId_1, personId_2))
    }
    getTScoreCall(personId: string) {
        return this.networkService.httpCall(UserRequests.getTScore(personId))
    }

    getMarketDataCall(stockMarketId: any) {
        return this.networkService.httpCall(UserRequests.getMaraketData(stockMarketId))
    }
    getStrongestFactoreCall(personId: string) {
        return this.networkService.httpCall(UserRequests.getStrongestFactore(personId))
    }

    getCareersInsightsCall(personId: string) {
        return this.networkService.httpCall(UserRequests.getCareersInsights(personId))
    }
    getUpdateColorCall(body: any) {
        return this.networkService.httpCall(UserRequests.getUpdateColor(body?.accountColorPayload))
    }
    getEnvironmentKeysCall(personId: string, languageId: string) {
        return this.networkService.httpCall(UserRequests.getEnvironmentKeys(personId, languageId))
    }

    getUsersListCall(body: any, silent = false) {
        return this.networkService.httpCall(UserRequests.getUsersList(body?.getUsersPayload), 0, silent)
    }

    exportUsersListCall(body: any) {
        return this.networkService.httpCall(UserRequests.exportUsersList(body?.exportUsersPayload))
    }

    searchMultipleAccountsCall(body: any) {
        return this.networkService.httpCall(UserRequests.searchMultipleAccounts(body?.searchUsersPayload))
    }

    getMarketMoodArrayCall(personId: string, portfolioValue: any, date: string) {
        return this.networkService.httpCall(UserRequests.getMarketMoodArray(personId, portfolioValue, date))
    }
    removeBoldTag(marketMoodDescriptions: any) {
        return marketMoodDescriptions?.map((description: any) => {
            return {
                heading: description.heading.replace(/<b>|<\/b>/g, ''),
                description: description.description,
            }
        })
    }
    getTagsCall(body: any) {
        return this.networkService.httpCall(UserRequests.getTags(body?.accountId))
    }
    // A successful response has shape {body: {statusCode: 200, data: [...]}, ...} - see
    // handleParticipantDetailResponse() in the selection components. Anything else (network
    // error, malformed body) must never be written into the persistent SWR cache below.
    // Gates only whether a response is cacheable, not whether it's an error - a resolved response
    // is already a real success. See fetchMissingPersonDetails above for the same fix and the full
    // explanation: `body.statusCode` no longer exists in the backend's response.
    private isValidParticipantsDetailResponse(response: any): boolean {
        return Array.isArray(response?.body?.data)
    }

    // The existing 30s in-memory dedup - unchanged. Coalesces near-simultaneous callers (the
    // same component's ngOnInit/ngOnChanges, store re-emissions, a page refresh) onto one
    // in-flight network call for an identical {accountId, personIds}. This is a different concern
    // from the persistent cache below: this one dedupes concurrent requests within a ~30s window;
    // the persistent one survives navigation away and back, at a much longer (30 min) TTL.
    private fetchParticipantsDetailLive(key: string, data: any): Observable<any> {
        const cached = this.participantsDetailCache.get(key)
        const now = Date.now()
        if (cached && cached.expiresAt > now) {
            return cached.response$
        }

        const response$ = this.networkService.httpCall(UserRequests.getParticipantsDetail(data)).pipe(
            // A failed request must not be replayed to every caller for the rest of the TTL -
            // drop the cache entry so the next call actually retries against the network.
            catchError((error) => {
                if (this.participantsDetailCache.get(key)?.response$ === response$) {
                    this.participantsDetailCache.delete(key)
                }
                return throwError(() => error)
            }),
            shareReplay({ bufferSize: 1, refCount: false })
        )
        this.participantsDetailCache.set(key, { expiresAt: now + PARTICIPANTS_DETAIL_CACHE_TTL_MS, response$ })
        return response$
    }

    private personDetailKey(accountId: any, personId: string): string {
        return this.insightsCache.buildKey(`${accountId}:${personId}`, PARTICIPANT_DETAIL_PERSON_NAMESPACE)
    }

    // Fetches only the ids not already being fetched by someone else, and reuses in-flight
    // observables (per personId, not per caller's request shape) for the rest - see plan §6.6.
    // A single caller's own uncovered ids still collapse into exactly ONE HTTP request; only ids
    // genuinely not covered by any existing in-flight fetch trigger a new one.
    private fetchMissingPersonDetails(accountId: any, missingIds: string[]): Observable<Map<string, any | PersonTombstone>> {
        const toBatch = missingIds.filter((id) => !this.personDetailInFlight.has(this.personDetailKey(accountId, id)))

        if (toBatch.length) {
            const participants = toBatch.map((personId) => ({ personId }))
            const batch$ = this.networkService.httpCall(UserRequests.getParticipantsDetail({ accountId, participants })).pipe(
                map((response: any) => {
                    const now = Date.now()
                    const byId = new Map<string, any | PersonTombstone>()
                    const cacheWrites: { key: string; data: any }[] = []

                    // Classified by the shape of `data` alone, not `body.statusCode` - the backend
                    // stopped sending that field (see the "Backend response contract" README
                    // section), and a resolved response here is already a real HTTP success:
                    // ApiErrorInterceptor throws for anything else, caught by this pipe's own
                    // catchError below. Checking a field that never arrives meant every successful
                    // response fell into the `throw` branch - the exact bug that made a real,
                    // valid login response surface as "We could not load your account information."
                    if (Array.isArray(response?.body?.data)) {
                        const found = new Set<string>()
                        response.body.data.forEach((record: any) => {
                            if (record?.personId) {
                                byId.set(record.personId, record)
                                found.add(record.personId)
                            }
                        })
                        toBatch.forEach((personId) => {
                            const key = this.personDetailKey(accountId, personId)
                            if (found.has(personId)) {
                                cacheWrites.push({ key, data: byId.get(personId) })
                            } else {
                                const tombstone: PersonTombstone = { __absent: true, tombstonedAt: now }
                                byId.set(personId, tombstone)
                                cacheWrites.push({ key, data: tombstone })
                            }
                        })
                    } else if (response?.body?.data === 'Data not found for selected Persons') {
                        // The whole batch is absent from this account - tombstone every id, not
                        // an error. See plan §6.2a: this is a normal negative result, distinct
                        // from a genuine HTTP/backend failure below.
                        toBatch.forEach((personId) => {
                            const tombstone: PersonTombstone = { __absent: true, tombstonedAt: now }
                            byId.set(personId, tombstone)
                            cacheWrites.push({ key: this.personDetailKey(accountId, personId), data: tombstone })
                        })
                    } else {
                        // Genuinely unrecognized shape on a resolved response - never cached, never
                        // tombstoned. See §6.2a: the whole call errors, matching today's all-or-nothing
                        // group-keyed contract.
                        throw response
                    }

                    this.insightsCache.setMany(cacheWrites)
                    return byId
                }),
                catchError((error) => {
                    // Clear the in-flight entries THIS call registered so a retry actually hits
                    // the network again instead of replaying a poisoned observable. See §6.2a.
                    toBatch.forEach((id) => this.personDetailInFlight.delete(this.personDetailKey(accountId, id)))
                    return throwError(() => error)
                }),
                // finalize BEFORE shareReplay: it hooks the single underlying HTTP subscription
                // (which shareReplay with refCount:false makes exactly once, ever), so this fires
                // exactly once total regardless of how many personDetailInFlight entries/derived
                // subscribers end up reading from this same batch$.
                finalize(() => {
                    toBatch.forEach((id) => this.personDetailInFlight.delete(this.personDetailKey(accountId, id)))
                }),
                shareReplay({ bufferSize: 1, refCount: false })
            )
            toBatch.forEach((id) => {
                this.personDetailInFlight.set(this.personDetailKey(accountId, id), batch$.pipe(map((byId) => byId.get(id))))
            })
        }

        const alreadyInFlight = missingIds.filter((id) => !toBatch.includes(id))
        const allIds = [...toBatch, ...alreadyInFlight]
        const observables = allIds.map((id) => this.personDetailInFlight.get(this.personDetailKey(accountId, id))!)

        return forkJoin(observables).pipe(
            map((values) => {
                const result = new Map<string, any | PersonTombstone>()
                allIds.forEach((id, i) => result.set(id, values[i]))
                return result
            })
        )
    }

    // Per-person participant-detail cache - see PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md.
    // Each participant is cached/fetched independently under {accountId, personId}, so any
    // already-seen participant is instant in ANY combination, and only genuinely-unseen
    // participants ever hit the network. Response shape is kept byte-compatible with the old
    // group-keyed implementation ({body: {statusCode: 200, data: [...] | sentinel string}}) so
    // every consumer (single/double/three-user-selection, main-users)
    // works unchanged.
    private getParticipantsDetailPerPerson(payload: any): Observable<any> {
        const accountId = payload.accountId
        const requestedIds: string[] = (payload.participants ?? []).map((p: any) => p.personId).filter(Boolean)

        if (!requestedIds.length) {
            return of({ body: { statusCode: 200, data: [] } })
        }

        const now = Date.now()
        const resolved = new Map<string, any>()
        const missing: string[] = []

        requestedIds.forEach((personId) => {
            const cached = this.insightsCache.get<any | PersonTombstone>(this.personDetailKey(accountId, personId))
            if (cached.status === 'miss') {
                missing.push(personId)
                return
            }
            if (isPersonTombstone(cached.data)) {
                if (now - cached.data.tombstonedAt > PARTICIPANT_TOMBSTONE_TTL_MS) {
                    missing.push(personId)
                }
                // else: known absent for now - contributes nothing, is not a miss.
                return
            }
            resolved.set(personId, cached.data)
        })

        // Preserves the requested order in the assembled response (constraint 2) - this is what
        // fixes the name/photo-vs-data ordering bug family at the source (plan §3), rather than
        // relying on every consumer to match by personId defensively.
        const assemble = (): any => {
            const data = requestedIds.map((id) => resolved.get(id)).filter(Boolean)
            if (!data.length) {
                // Every requested id resolved to "absent" - preserve the backend's own sentinel
                // shape instead of synthesising an empty 200 array. See §6.9.
                return { body: { statusCode: 200, data: 'Data not found for selected Persons' } }
            }
            return { body: { statusCode: 200, data } }
        }

        if (!missing.length) {
            return of(assemble())
        }

        return this.fetchMissingPersonDetails(accountId, missing).pipe(
            map((fetchedById) => {
                fetchedById.forEach((value, id) => {
                    if (!isPersonTombstone(value)) resolved.set(id, value)
                })
                return assemble()
            })
        )
    }

    // Stale-while-revalidate on top of the in-memory dedup above, persisted to localStorage so
    // it survives navigating away (e.g. to a report page) and back - see
    // SINGLE_USER_SELECTION_CACHING_PLAN.md §6. A cache hit resolves synchronously with no
    // loader, then silently revalidates in the background and only pushes a second emission if
    // the data actually changed. Safe to emit synchronously here (unlike the NgRx-effect-based
    // widgets, which needed an asapScheduler defer) because every caller subscribes directly on
    // the returned Observable in the same statement - there is no later, separately-registered
    // subscriber that could miss a same-tick emission the way an NgRx `ofType()` listener could.
    //
    // Routes to the per-person cache (PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md) unless the
    // USE_PER_PERSON_PARTICIPANT_CACHE kill switch (§6.11) has been flipped off, in which case
    // this falls back to the original group-keyed implementation below, unmodified.
    getParticipantsDetail(payload: any): Observable<any> {
        if (USE_PER_PERSON_PARTICIPANT_CACHE) {
            return this.getParticipantsDetailPerPerson(payload)
        }
        return this.getParticipantsDetailGroupKeyed(payload)
    }

    private getParticipantsDetailGroupKeyed(payload: any): Observable<any> {
        const data = {
            accountId: payload.accountId,
            participants: payload.participants,
        }

        const personIds = (data.participants ?? []).map((p: any) => p.personId).sort()
        const key = JSON.stringify({ accountId: data.accountId, personIds })
        const cacheKey = this.insightsCache.buildKey(key, PARTICIPANTS_DETAIL_CACHE_NAMESPACE)

        const cached = this.insightsCache.get<any>(cacheKey)

        if (cached.status === 'miss') {
            return this.fetchParticipantsDetailLive(key, data).pipe(
                map((response) => {
                    if (this.isValidParticipantsDetailResponse(response)) {
                        this.insightsCache.set(cacheKey, response)
                    }
                    return response
                })
            )
        }

        const cachedResponse$ = of(cached.data)

        if (this.participantsDetailInFlightRefreshes.has(cacheKey)) {
            return cachedResponse$
        }

        this.participantsDetailInFlightRefreshes.add(cacheKey)
        const backgroundRefresh$ = this.fetchParticipantsDetailLive(key, data).pipe(
            map((response) => ({
                response,
                changed: this.isValidParticipantsDetailResponse(response) && this.insightsCache.setIfChanged(cacheKey, response),
            })),
            filter(({ changed }) => changed),
            map(({ response }) => response),
            catchError(() => EMPTY),
            finalize(() => this.participantsDetailInFlightRefreshes.delete(cacheKey))
        )

        return merge(cachedResponse$, backgroundRefresh$)
    }

    // Called after an edit that actually changes participant data (profile, tags, facilitator,
    // photo) so the next getParticipantsDetail() call re-hits the network instead of replaying
    // the now-stale cached response for the remainder of its TTL window.
    clearParticipantsDetailCache() {
        this.participantsDetailCache.clear()
        this.insightsCache.clearByPrefix(PARTICIPANTS_DETAIL_CACHE_NAMESPACE)
        this.insightsCache.clearByPrefix(PARTICIPANT_DETAIL_PERSON_NAMESPACE)
    }

    getFacilitators(payload: any) {
        // forceRefresh: true - no call site ever requests a silent/cached read (getFacilitatorAction
        // doesn't carry a silent flag), so always bypass NetworkService's own HTTP cache; otherwise a
        // refetch right after editing a participant's facilitator can replay a stale advisor list.
        return this.networkService.httpCall(UserRequests.getFacilitators(payload?.accountId), USERS_CACHE_TTL_MS, false, true)
    }

    editParticipantProfile(payload: any) {
        return this.networkService.httpCall(UserRequests.editParticipantProfile(payload.data))
    }

    editParticipantProfilePicture(payload: any) {
        return this.networkService.httpCall(UserRequests.editParticipantProfilePicture(payload.data))
    }

    editParticipantTags(payload: any) {
        return this.networkService.httpCall(UserRequests.editParticipantTags(payload.data))
    }

    editParticipantFacilitator(payload: any) {
        return this.networkService.httpCall(UserRequests.editParticipantFacilitator(payload.data))
    }

    getWorkRelatedMoneyInsights(payload: any) {
        return this.networkService.httpCall(UserRequests.getWorkRelatedMoneyInsights(payload))
    }

    getDigitalScanScores(payload: any) {
        return this.networkService.httpCall(UserRequests.getDigitalScanScores(payload))
    }

    parseMarketData(marketData: any) {
        const data = { ...marketData }
        data['marketMoodLabels'] = data?.marketMoodLabels?.map((label: string) => moment(label).format('MMM DD, YYYY'))
        // console.log('data format', data)
        return data
    }

    getParticipantsDetailRequest(selectedParticipants: any[], accountId: any) {
        const participantsList = selectedParticipants.map((person: any) => {
            return {
                personId: person.id,
            }
        })

        const data = {
            accountId: accountId,
            participants: participantsList,
        }
        return this.getParticipantsDetail(data)
    }

    getTScoreRequests(selectedParticipants: any[]) {
        const tScoreRequests: any[] = []
        selectedParticipants.forEach((person: any) => {
            tScoreRequests.push(this.getTScoreCall(person.id))
        })
        return tScoreRequests
    }

    getWorkplaceInsightRequests(selectedParticipants: any[]) {
        const workplaceRequests: any[] = []
        selectedParticipants.forEach((person: any) => {
            workplaceRequests.push(this.getWorkPlaceInsightCall(person.id, K.APP.LANGUAGE_ID))
        })
        return workplaceRequests
    }

    getStyleMatchRequest(selectedParticipants: any[]) {
        return this.getWorkStyleMatchCall(selectedParticipants[0].id, selectedParticipants[1].id)
    }

    getPerformanceGuideRequests(selectedParticipants: any[]) {
        const performanceRequests: any[] = []
        selectedParticipants.forEach((person: any) => {
            performanceRequests.push(this.getEnvironmentKeysCall(person.id, K.APP.LANGUAGE_ID))
        })
        return performanceRequests
    }

    getWorkTalentsRequests(selectedParticipants: any[]) {
        const workTalentsRequests: any[] = []
        selectedParticipants.forEach((person: any) => {
            workTalentsRequests.push(this.getWorkTalentsCall(person.id, K.APP.LANGUAGE_ID))
        })
        return workTalentsRequests
    }

    getCommunicationInsightsCall(personId: string) {
        return this.networkService.httpCall(UserRequests.getCommunicationInsights(personId))
    }
    getOldReportsCall(personId: string) {
        return this.networkService.httpCall(UserRequests.getOldReports(personId))
    }
    getSortingOrderCall(accountId: number) {
        return this.networkService.httpCall(UserRequests.getSortingOrder(accountId))
    }
    updateSortingOrderCall(payload: any) {
        return this.networkService.httpCall(UserRequests.updateSortingOrder(payload))
    }
    getSelfRegistrationId(personId: string) {
        return this.networkService.httpCall(UserRequests.getSelfRegistrationId(personId), USERS_CACHE_TTL_MS)
    }
    getSelfRegistrationDetail(payload: any) {
        return this.networkService.httpCall(UserRequests.getSelfRegistrationDetail(payload?.linkId, payload?.accountId), USERS_CACHE_TTL_MS)
    }
    getCustomReportNameCall(payload: any) {
        return this.networkService.httpCall(UserRequests.getCustomReportName(payload.accountId, payload.reportId))
    }

    getCreditIdCall(payload: any) {
        return this.networkService.httpCall(UserRequests.getCreditId(payload.personId), USERS_CACHE_TTL_MS)
    }

    getDiscoveryStatusCall(payload: any) {
        return this.networkService.httpCall(UserRequests.getDiscoveryStatus(payload.creditId))
    }

    getUniqueStyleCall(payload: any) {
        return this.networkService.httpCall(UserRequests.getUniqueStyle(payload.personId), USERS_CACHE_TTL_MS)
    }

    saveUserToAccountCall(body: any) {
        return this.networkService.httpCall(UserRequests.saveUserToAccount(body.data))
    }

    getRiskAllocations(personId: string) {
        return this.networkService.httpCall(UserRequests.getRiskBehavior(personId))
    }

    getFinancialPlanningInsights(personId: string) {
        return this.networkService.httpCall(UserRequests.getFinancialPlanningInsights(personId))
    }

    getSalesInsights(personId: string) {
        return this.networkService.httpCall(UserRequests.getSalesInsightData(personId))
    }

    getHiringData(personId: string) {
        return this.networkService.httpCall(UserRequests.getHiringData(personId))
    }

    getCustomReportAccessData() {
        return this.networkService.httpCall(UserRequests.salesReportAccess())
    }
    getDigitalScanAccessData() {
        return this.networkService.httpCall(UserRequests.digitalScanAccess(), USERS_CACHE_TTL_MS)
    }

    getTraitsDescription() {
        return this.networkService.httpCall(UserRequests.getTraitsDescription())
    }

    getCoachingReportData() {
        return this.networkService.httpCall(UserRequests.getCoachingReportData())
    }
    getCoachingReportTraitsData() {
        return this.networkService.httpCall(UserRequests.getCoachingReportTraitsData())
    }

    getCoachingReportAccess() {
        return this.networkService.httpCall(UserRequests.coachingReportAccess())
    }

    getUniqueStyleDescription() {
        return this.networkService.httpCall(UserRequests.getUniqueStyleDesc())
    }
    getFactorRelationship() {
        return this.networkService.httpCall(UserRequests.getFactorRelationship())
    }

    getBDNAUniqueStyleVideoLinks() {
        return this.networkService.httpCall(UserRequests.getBDNAUniqueStyleVideoLinks())
    }

    getFDNAUniqueStyleVideoLinks() {
        return this.networkService.httpCall(UserRequests.getFDNAUniqueStyleVideoLinks())
    }

    toDataURL(url: any, callback: any) {
        const xhr = new XMLHttpRequest()
        xhr.onload = function () {
            const reader = new FileReader()
            reader.onloadend = function () {
                const base64Image = reader.result?.toString().replace('application/octet-stream', 'image/jpeg')
                callback(base64Image)
            }
            reader.readAsDataURL(xhr.response)
        }
        xhr.open('GET', url)
        xhr.responseType = 'blob'
        xhr.send()
    }

    getFinancialBehaviorTabSorter(permissionObject: any, showLegacyReports: boolean, financialBehaviorTabSorter: any) {
        const sorter: any[] = []

        financialBehaviorTabSorter.forEach((element: any) => {
            switch (element.cardName) {
                case 'Financial DNA Score':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-FinancialDNA5scores'],
                    })
                    break
                case 'Risk Behavior':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-RiskBehavior'],
                    })
                    break
                case 'Style Match':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-StyleMatch'],
                    })
                    break
                case 'Market Mood':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-MarketMood'],
                    })
                    break
                case 'Behavioral Biases':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-BehavioralBiases'],
                    })
                    break
                case 'T-Scores':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-T-Scores'],
                    })
                    break
                case 'Strengths':
                case 'Struggles':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: true,
                    })
                    break
                case 'Communication Keys':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-EnvironmentKeys'],
                    })
                    break

                case 'Preferred Contact Methods':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-Communication'],
                    })
                    break
                case 'Legacy Reports':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: showLegacyReports,
                    })
                    break
                default:
                    break
            }
        })
        return sorter
    }

    getWorkTalentsTabSorter(permissionObject: any, showLegacyReports: boolean, workTalentsTabSorter: any) {
        const sorter: any[] = []
        workTalentsTabSorter.forEach((element: any) => {
            switch (element.cardName) {
                case 'Work Talents':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Business-User-Card-BusinessDNA5Scores'] ? true : false,
                    })
                    break
                case 'Strongest Traits':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Business-User-Card-TheStrongestFactors'],
                    })
                    break
                case 'Style Match':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Business-User-Card-StyleMatch'],
                    })
                    break
                case 'T-Scores':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-T-Scores'],
                    })
                    break

                case 'Workplace Insights':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Business-User-Card-WorkplaceInsights'],
                    })
                    break
                case 'Career Insights':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Business-User-CareerInsights'],
                    })
                    break
                case 'Strengths':
                case 'Struggles':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: true,
                    })
                    break
                case 'Communication Keys':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Business-User-Card-EnvironmentKeys'],
                    })
                    break
                case 'Preferred Contact Methods':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: permissionObject['Financial-User-Card-Communication'],
                    })
                    break
                case 'Legacy Reports':
                    sorter.push({
                        cardName: element.cardName,
                        id: element.id,
                        showStatus: showLegacyReports,
                    })
                    break
                default:
                    break
            }
        })
        return sorter
    }

    getUniqueStyleAndDescriptionRequests(selectedParticipants: any[]) {
        const requests: any[] = []
        selectedParticipants.forEach((participant) => {
            requests.push(this.getUniqueStyleAndDescriptionCall(participant.id, K.APP.LANGUAGE_ID))
        })
        return requests
    }
}
