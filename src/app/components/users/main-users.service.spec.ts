import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { of, throwError, Subject } from 'rxjs'

import { MainUsersService } from './main-users.service'
import { NetworkService } from 'src/app/service/network.service'
import { ParticipantInsightsCacheStorageService } from 'src/app/service/participant-insights-cache-storage.service'

function makeSpies() {
    const networkService: jasmine.SpyObj<NetworkService> = jasmine.createSpyObj('NetworkService', ['httpCall'])
    const insightsCache: jasmine.SpyObj<ParticipantInsightsCacheStorageService> = jasmine.createSpyObj('ParticipantInsightsCacheStorageService', [
        'buildKey',
        'get',
        'set',
        'setMany',
        'setIfChanged',
        'clearByPrefix',
    ])
    insightsCache.buildKey.and.callFake((key: string, namespace = '') => `insights:test-user:${namespace}${key}`)
    insightsCache.get.and.returnValue({ status: 'miss' })
    return { networkService, insightsCache }
}

function createService(networkService: NetworkService, insightsCache: ParticipantInsightsCacheStorageService): MainUsersService {
    TestBed.configureTestingModule({
        providers: [
            MainUsersService,
            { provide: NetworkService, useValue: networkService },
            { provide: ParticipantInsightsCacheStorageService, useValue: insightsCache },
        ],
    })
    return TestBed.inject(MainUsersService)
}

function personKeyFor(insightsCache: jasmine.SpyObj<ParticipantInsightsCacheStorageService>, accountId: string, personId: string): string {
    return insightsCache.buildKey(`${accountId}:${personId}`, 'participantDetailByPerson:')
}

// A cache-lookup fake that returns `data` for `key`, 'miss' for everything else. Cast as `any`
// to sidestep jasmine's generic `get<T>()` spy typing (T can't be inferred from a plain object
// literal here, and these specs don't need it to be).
function cacheReturning(key: string, data: any): any {
    return (lookupKey: string) => (lookupKey === key ? { status: 'fresh', data } : { status: 'miss' })
}

// PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md Phase 3 - getParticipantsDetail() now defaults to
// the per-person cache (USE_PER_PERSON_PARTICIPANT_CACHE = true in main-users.service.ts). These
// specs are the regression contract for THAT default path going forward.
describe('MainUsersService.getParticipantsDetail - per-person cache (current default)', () => {
    let service: MainUsersService
    let networkService: jasmine.SpyObj<NetworkService>
    let insightsCache: jasmine.SpyObj<ParticipantInsightsCacheStorageService>

    const accountId = 'acct-1'
    const recordA = { personId: 'A', firstName: 'Nora' }
    const recordB = { personId: 'B', firstName: 'Robert' }

    beforeEach(() => {
        ;({ networkService, insightsCache } = makeSpies())
        service = createService(networkService, insightsCache)
    })

    it('cold miss: fetches only the requested (missing) participant and caches the record under its own key', () => {
        networkService.httpCall.and.returnValue(of({ body: { statusCode: 200, data: [recordA] } }) as any)

        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe((r) => (emitted = r))

        expect(emitted).toEqual({ body: { statusCode: 200, data: [recordA] } })
        const request = networkService.httpCall.calls.mostRecent().args[0] as any
        expect(request.body.participants).toEqual([{ personId: 'A' }])

        const writes = insightsCache.setMany.calls.mostRecent().args[0]
        expect(writes).toEqual([{ key: personKeyFor(insightsCache, accountId, 'A'), data: recordA }])
    })

    it('classifies success by the shape of `data` alone, not `body.statusCode` - the real backend contract sends no such field', () => {
        // Regression coverage for the actual outage: a resolved response with a real array in
        // `data` and no `statusCode` at all (exactly what the backend sends post-.NET-upgrade) used
        // to fall into the `throw response` branch, turning a successful login response into
        // "We could not load your account information." See the "Backend response contract" README
        // section - `body.statusCode` no longer exists on any response.
        networkService.httpCall.and.returnValue(of({ body: { message: 'Success', data: [recordA] } }) as any)

        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe((r) => (emitted = r))

        expect(emitted.body.data).toEqual([recordA])
        const writes = insightsCache.setMany.calls.mostRecent().args[0]
        expect(writes).toEqual([{ key: personKeyFor(insightsCache, accountId, 'A'), data: recordA }])
    })

    it('tombstones a `statusCode`-less "not found" sentinel the same as one carrying the old field', () => {
        networkService.httpCall.and.returnValue(of({ body: { message: 'Success', data: 'Data not found for selected Persons' } }) as any)

        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe((r) => (emitted = r))

        expect(emitted.body.data).toBe('Data not found for selected Persons')
        const writes = insightsCache.setMany.calls.mostRecent().args[0] as any
        expect(writes[0].data.__absent).toBe(true)
    })

    it('warm hit: a cached participant is served with NO network call', () => {
        insightsCache.get.and.callFake(cacheReturning(personKeyFor(insightsCache, accountId, 'A'), recordA))

        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe((r) => (emitted = r))

        expect(emitted).toEqual({ body: { statusCode: 200, data: [recordA] } })
        expect(networkService.httpCall).not.toHaveBeenCalled()
    })

    it('partial hit: fetches ONLY the missing participant, not the whole requested group', () => {
        insightsCache.get.and.callFake(cacheReturning(personKeyFor(insightsCache, accountId, 'A'), recordA))
        networkService.httpCall.and.returnValue(of({ body: { statusCode: 200, data: [recordB] } }) as any)

        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }, { personId: 'B' }] }).subscribe((r) => (emitted = r))

        expect(networkService.httpCall).toHaveBeenCalledTimes(1)
        const request = networkService.httpCall.calls.mostRecent().args[0] as any
        expect(request.body.participants).toEqual([{ personId: 'B' }])
        expect(emitted).toEqual({ body: { statusCode: 200, data: [recordA, recordB] } })
    })

    it('assembles the response in the REQUESTED order regardless of which ids were cached vs fetched, or what order the network returned them in', () => {
        insightsCache.get.and.callFake(cacheReturning(personKeyFor(insightsCache, accountId, 'B'), recordB))
        // Network returns C before A, and B is not in this response at all (already cached).
        const recordC = { personId: 'C', firstName: 'Alicia' }
        networkService.httpCall.and.returnValue(of({ body: { statusCode: 200, data: [recordC, recordA] } }) as any)

        let emitted: any
        service
            .getParticipantsDetail({ accountId, participants: [{ personId: 'A' }, { personId: 'B' }, { personId: 'C' }] })
            .subscribe((r) => (emitted = r))

        // Requested order was A, B, C - the assembled data must follow THAT order, not cache-hit
        // order or network-response order. This is the fix for the name/data ordering bug family
        // documented in PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md §3.
        expect(emitted.body.data.map((r: any) => r.personId)).toEqual(['A', 'B', 'C'])
    })

    it('tombstones a participant confirmed absent from the account, and does not refetch it on a later call within the tombstone TTL', () => {
        networkService.httpCall.and.returnValue(of({ body: { statusCode: 200, data: [] } }) as any)

        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe()

        const writes = insightsCache.setMany.calls.mostRecent().args[0] as any[]
        expect(writes.length).toBe(1)
        expect(writes[0].key).toBe(personKeyFor(insightsCache, accountId, 'A'))
        expect(writes[0].data.__absent).toBe(true)

        // Simulate the tombstone now being served back from cache on the next call.
        insightsCache.get.and.callFake(cacheReturning(personKeyFor(insightsCache, accountId, 'A'), writes[0].data))
        networkService.httpCall.calls.reset()

        let secondEmission: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe((r) => (secondEmission = r))

        expect(networkService.httpCall).not.toHaveBeenCalled()
        expect(secondEmission).toEqual({ body: { statusCode: 200, data: 'Data not found for selected Persons' } })
    })

    it('re-fetches a participant once their tombstone is older than the tombstone TTL', () => {
        const expiredTombstone = { __absent: true, tombstonedAt: Date.now() - 6 * 60 * 1000 } // > 5 min TTL
        insightsCache.get.and.callFake(cacheReturning(personKeyFor(insightsCache, accountId, 'A'), expiredTombstone))
        networkService.httpCall.and.returnValue(of({ body: { statusCode: 200, data: [recordA] } }) as any)

        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe((r) => (emitted = r))

        expect(networkService.httpCall).toHaveBeenCalledTimes(1)
        expect(emitted).toEqual({ body: { statusCode: 200, data: [recordA] } })
    })

    it('returns the "Data not found" sentinel (not an empty 200 array) when every requested id is absent', () => {
        networkService.httpCall.and.returnValue(of({ body: { statusCode: 200, data: 'Data not found for selected Persons' } }) as any)

        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }, { personId: 'B' }] }).subscribe((r) => (emitted = r))

        expect(emitted).toEqual({ body: { statusCode: 200, data: 'Data not found for selected Persons' } })
        // Both ids tombstoned from one sentinel response, not treated as an error.
        const writes = insightsCache.setMany.calls.mostRecent().args[0]
        expect(writes.length).toBe(2)
        expect(writes.every((w: any) => w.data.__absent)).toBe(true)
    })

    it('propagates a genuine batch failure as an error and does not cache/tombstone anything', () => {
        networkService.httpCall.and.returnValue(throwError(() => new Error('network down')) as any)

        let error: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe({ error: (e) => (error = e) })

        expect(error).toBeTruthy()
        expect(insightsCache.setMany).not.toHaveBeenCalled()
    })

    it('a batch failure clears its in-flight entries so the very next call retries against the network', () => {
        networkService.httpCall.and.returnValues(throwError(() => new Error('network down')) as any, of({ body: { statusCode: 200, data: [recordA] } }) as any)

        let firstError: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe({ error: (e) => (firstError = e) })
        expect(firstError).toBeTruthy()

        let secondEmission: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }] }).subscribe((r) => (secondEmission = r))

        expect(networkService.httpCall).toHaveBeenCalledTimes(2)
        expect(secondEmission).toEqual({ body: { statusCode: 200, data: [recordA] } })
    })

    it('per-person dedup: two callers with overlapping-but-different missing sets share the fetch for the overlapping id and issue only ONE call each for their own uncovered ids', fakeAsync(() => {
        const live$ = new Subject<any>()
        networkService.httpCall.and.returnValue(live$ as any)

        // Caller 1 needs [A, B]; caller 2 needs [B, C] - B overlaps, A and C don't.
        let firstEmission: any
        let secondEmission: any
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'A' }, { personId: 'B' }] }).subscribe((r) => (firstEmission = r))
        service.getParticipantsDetail({ accountId, participants: [{ personId: 'B' }, { personId: 'C' }] }).subscribe((r) => (secondEmission = r))

        // Exactly two network calls: one covering caller 1's uncovered ids (A, B), one covering
        // caller 2's remaining uncovered id (C) - B is NOT refetched a second time.
        expect(networkService.httpCall).toHaveBeenCalledTimes(2)
        const requestedIdSets = networkService.httpCall.calls.allArgs().map((args) => (args[0] as any).body.participants.map((p: any) => p.personId).sort())
        expect(requestedIdSets).toContain(['A', 'B'])
        expect(requestedIdSets).toContain(['C'])

        live$.next({ body: { statusCode: 200, data: [{ personId: 'A' }, { personId: 'B' }, { personId: 'C' }] } })
        live$.complete()
        tick()

        expect(firstEmission.body.data.map((r: any) => r.personId)).toEqual(['A', 'B'])
        expect(secondEmission.body.data.map((r: any) => r.personId)).toEqual(['B', 'C'])
    }))

    it('empty participants list resolves to an empty result with no network call', () => {
        let emitted: any
        service.getParticipantsDetail({ accountId, participants: [] }).subscribe((r) => (emitted = r))

        expect(emitted).toEqual({ body: { statusCode: 200, data: [] } })
        expect(networkService.httpCall).not.toHaveBeenCalled()
    })
})

// Legacy fallback path - only reachable if USE_PER_PERSON_PARTICIPANT_CACHE is flipped back to
// false (see PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md §6.11, the kill switch). Kept as its
// own regression contract for the group-keyed implementation, called directly via the private
// method since the public getParticipantsDetail() no longer routes here by default.
describe('MainUsersService - legacy group-keyed getParticipantsDetail (kill-switch fallback, called directly)', () => {
    let service: MainUsersService
    let networkService: jasmine.SpyObj<NetworkService>
    let insightsCache: jasmine.SpyObj<ParticipantInsightsCacheStorageService>

    const accountId = 'acct-1'
    const payload = {
        accountId,
        participants: [{ personId: 'A' }, { personId: 'B' }],
    }
    const successResponse = {
        body: {
            statusCode: 200,
            data: [
                { personId: 'A', firstName: 'Nora' },
                { personId: 'B', firstName: 'Robert' },
            ],
        },
    }

    function callLegacy(p: any) {
        return (service as any).getParticipantsDetailGroupKeyed(p)
    }

    beforeEach(() => {
        ;({ networkService, insightsCache } = makeSpies())
        service = createService(networkService, insightsCache)
    })

    describe('cold miss', () => {
        it('fetches over the network and writes the response into the persistent cache', () => {
            networkService.httpCall.and.returnValue(of(successResponse) as any)

            let emitted: any
            callLegacy(payload).subscribe((response: any) => (emitted = response))

            expect(networkService.httpCall).toHaveBeenCalledTimes(1)
            expect(emitted).toEqual(successResponse)
            expect(insightsCache.set).toHaveBeenCalledTimes(1)
            expect(insightsCache.set.calls.mostRecent().args[1]).toEqual(successResponse)
        })

        it('does NOT write an invalid response (missing statusCode 200 / non-array data) into the persistent cache', () => {
            const invalidResponse = { body: { statusCode: 200, data: 'Data not found for selected Persons' } }
            networkService.httpCall.and.returnValue(of(invalidResponse) as any)

            let emitted: any
            callLegacy(payload).subscribe((response: any) => (emitted = response))

            expect(emitted).toEqual(invalidResponse)
            expect(insightsCache.set).not.toHaveBeenCalled()
        })
    })

    describe('cache hit (fresh or stale alike)', () => {
        // getParticipantsDetailGroupKeyed does NOT special-case 'fresh' vs 'stale' - any non-miss
        // hit emits the cached value synchronously AND still triggers a background revalidation
        // (unless one is already in flight for that key); only setIfChanged decides whether a
        // 2nd emission follows.
        it('emits the cached value synchronously first, regardless of freshness', () => {
            insightsCache.get.and.returnValue({ status: 'fresh', data: successResponse })
            networkService.httpCall.and.returnValue(of(successResponse) as any)
            insightsCache.setIfChanged.and.returnValue(false)

            let firstEmission: any
            callLegacy(payload).subscribe((response: any) => {
                if (firstEmission === undefined) firstEmission = response
            })

            expect(firstEmission).toEqual(successResponse)
        })

        it('emits the cached value immediately, then again only if the background refresh actually changed', fakeAsync(() => {
            insightsCache.get.and.returnValue({ status: 'stale', data: successResponse })
            const refreshedResponse = {
                body: { statusCode: 200, data: [{ personId: 'A', firstName: 'Nora-Updated' }, { personId: 'B', firstName: 'Robert' }] },
            }
            networkService.httpCall.and.returnValue(of(refreshedResponse) as any)
            insightsCache.setIfChanged.and.returnValue(true)

            const emissions: any[] = []
            callLegacy(payload).subscribe((response: any) => emissions.push(response))
            tick()

            expect(emissions.length).toBe(2)
            expect(emissions[0]).toEqual(successResponse)
            expect(emissions[1]).toEqual(refreshedResponse)
        }))

        it('does not emit a second time when the background refresh returns unchanged data', fakeAsync(() => {
            insightsCache.get.and.returnValue({ status: 'stale', data: successResponse })
            networkService.httpCall.and.returnValue(of(successResponse) as any)
            insightsCache.setIfChanged.and.returnValue(false)

            const emissions: any[] = []
            callLegacy(payload).subscribe((response: any) => emissions.push(response))
            tick()

            expect(emissions.length).toBe(1)
        }))

        it('does not fire a second background refresh for the same key while one is already in flight', fakeAsync(() => {
            insightsCache.get.and.returnValue({ status: 'stale', data: successResponse })
            const live$ = new Subject<any>()
            networkService.httpCall.and.returnValue(live$ as any)
            insightsCache.setIfChanged.and.returnValue(true)

            callLegacy(payload).subscribe()
            callLegacy(payload).subscribe()

            expect(networkService.httpCall).toHaveBeenCalledTimes(1)

            live$.next(successResponse)
            live$.complete()
            tick()
        }))
    })

    describe('30s in-memory dedup + error handling', () => {
        it('coalesces two calls for the same {accountId, personIds} within the dedup window onto one network call', () => {
            networkService.httpCall.and.returnValue(of(successResponse) as any)

            callLegacy(payload).subscribe()
            callLegacy(payload).subscribe()

            expect(networkService.httpCall).toHaveBeenCalledTimes(1)
        })

        it('does NOT poison the dedup cache on error - the next call retries against the network', () => {
            networkService.httpCall.and.returnValues(throwError(() => new Error('network down')) as any, of(successResponse) as any)

            let firstError: any
            callLegacy(payload).subscribe({ error: (e: any) => (firstError = e) })
            expect(firstError).toBeTruthy()

            let secondEmission: any
            callLegacy(payload).subscribe((response: any) => (secondEmission = response))

            expect(networkService.httpCall).toHaveBeenCalledTimes(2)
            expect(secondEmission).toEqual(successResponse)
        })

        it('propagates a network error to the caller instead of swallowing it', () => {
            networkService.httpCall.and.returnValue(throwError(() => new Error('network down')) as any)

            let error: any
            callLegacy(payload).subscribe({ error: (e: any) => (error = e) })

            expect(error).toBeTruthy()
            expect(insightsCache.set).not.toHaveBeenCalled()
        })
    })

    describe('cache key order-insensitivity (documents the LEGACY behaviour the per-person cache replaces)', () => {
        it('treats [A,B] and [B,A] as the SAME cache entry (sorted personIds) - the source of the ordering bug the default path fixes', () => {
            networkService.httpCall.and.returnValue(of(successResponse) as any)

            callLegacy({ accountId, participants: [{ personId: 'A' }, { personId: 'B' }] }).subscribe()
            callLegacy({ accountId, participants: [{ personId: 'B' }, { personId: 'A' }] }).subscribe()

            const keysUsed = insightsCache.get.calls.allArgs().map((args) => args[0])
            expect(keysUsed[0]).toEqual(keysUsed[1])
        })
    })
})
