import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { of } from 'rxjs'
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators'
import { MainUsersService } from '../../main-users.service'
import { UserRequests } from 'src/app/service/requests/user-requests'
import { ParticipantInsightsCacheStorageService } from 'src/app/service/participant-insights-cache-storage.service'
import { withStaleWhileRevalidate } from 'src/app/util/stale-while-revalidate'
import { ApiError, ensureApiError, serverMessage } from 'src/app/service/api-error'
import {
    CUSTOM_REPORT_ACCESS_DATA_ACTION,
    CUSTOM_REPORT_ACCESS_DATA_ACTION_SUCCESS,
    GET_BEHAVIRAL_BIASES_ACTION,
    GET_BEHAVIRAL_BIASES_ACTION2,
    GET_CAREERS_INSIGHTS_ACTION,
    GET_CAREERS_INSIGHTS_ACTION2,
    GET_COACGING_REPORT_ACTION,
    GET_COACHING_REPORT_ACTION_SUCCESS,
    GET_COMMUNICATION_INSIGHTS_ACTION,
    GET_COMMUNICATION_INSIGHTS_ACTION2,
    GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION,
    GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION2,
    GET_CUSTOM_REPORT_NAME_ACTION,
    GET_CUSTOM_REPORT_NAME_ACTION_SUCCESS,
    GET_DIGITAL_SCAN_SCORES,
    GET_DIGITAL_SCAN_SCORES_FAILURE,
    GET_DIGITAL_SCAN_SCORES_SUCCESS,
    GET_ENVIRONMENT_KEYS_ACTION,
    GET_ENVIRONMENT_KEYS_ACTION2,
    GET_FACTOR_RELATIONSHIP_ACTION,
    GET_FACTOR_RELATIONSHIP_ACTION_SUCCESS,
    GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION,
    GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION_SUCCESS,
    GET_FDNA_SCORE_ACTION,
    GET_FDNA_SCORE_ACTION2,
    GET_FINANCIAL_STYLE_MATCH_ACTION,
    GET_HIRING_DATA_ACTION,
    GET_HIRING_DATA_ACTION_SUCCESS,
    GET_MARKET_DATA_ACTION,
    GET_MARKET_DATA_ACTION_SUCCESS,
    GET_MARKET_MOOD_ARRAY_ACTION,
    GET_MARKET_MOOD_ARRAY_ACTION2,
    GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION,
    GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION2,
    GET_OLD_REPORTS_ACTION,
    GET_OLD_REPORTS_ACTION2,
    GET_OLD_REPORTS_ACTION_SUCCESS,
    GET_OLD_REPORTS_ACTION_SUCCESS2,
    GET_PARTICIPANTS_DETAIL_ACTION,
    GET_PARTICIPANTS_DETAIL_SUCCESS_ACTION,
    GET_PARTICIPANTS_DETAIL_FAILURE_ACTION,
    GET_RISK_ALLOCATIONS_ACTION,
    GET_RISK_ALLOCATIONS_ACTION_SUCCESS,
    GET_RISK_BEHAVIOR_ACTION,
    GET_RISK_BEHAVIOR_ACTION2,
    GET_SALES_INSIGHT_ACTION,
    GET_SALES_INSIGHT_ACTION_SUCCESS,
    GET_SORTING_ORDER_ACTION,
    GET_SORTING_ORDER_SUCCESS_ACTION,
    GET_STRONGEST_FACTOR_ACTION,
    GET_TRAITS_DESCRIPTION_ACTION,
    GET_TRAITS_DESCRIPTION_ACTION_SUCCESS,
    GET_TSCORE_ACTION,
    GET_TSCORE_ACTION2,
    GET_UNIQUE_STYLE_DESCRIPTION_ACTION,
    GET_UNIQUE_STYLE_DESCRIPTION_ACTION_SUCCESS,
    GET_UNIQUE_STYLE_DETAILS_ACTION,
    GET_UNIQUE_STYLE_DETAILS_ACTION_SUCCESS,
    GET_VIDEO_URL_ACTION,
    GET_VIDEO_URL_ACTION_SUCCESS,
    GET_WORK_RELATED_MONEY_INSIGHTS_ACTION,
    GET_WORK_RELATED_MONEY_INSIGHTS_ACTION_SUCCESS,
    GET_WORK_STYLE_MATCH_ACTION,
    GET_WORK_TALENTS_ACTION,
    GET_WORK_TALENTS_ACTION2,
    GET_WORKPLACE_INSIGHT_ACTION,
    GET_WORKPLACE_INSIGHT_ACTION2,
    SUCCESS_BEHAVIRAL_BIASES_ACTION,
    SUCCESS_BEHAVIRAL_BIASES_ACTION2,
    SUCCESS_CAREERS_INSIGHTS_ACTION,
    SUCCESS_CAREERS_INSIGHTS_ACTION2,
    SUCCESS_ENVIRONMENT_KEYS_ACTION,
    SUCCESS_ENVIRONMENT_KEYS_ACTION2,
    SUCCESS_FDNA_SCORE_ACTION,
    SUCCESS_FDNA_SCORE_ACTION2,
    SUCCESS_FINANCIAL_STYLE_MATCH_ACTION,
    SUCCESS_RISK_BEHAVIOR_ACTION,
    SUCCESS_RISK_BEHAVIOR_ACTION2,
    SUCCESS_STRONGEST_FACTOR_ACTION,
    SUCCESS_TSCORE_ACTION,
    SUCCESS_TSCORE_ACTION2,
    SUCCESS_WORK_STYLE_MATCH_ACTION,
    SUCCESS_WORK_TALENTS_ACTION,
    SUCCESS_WORK_TALENTS_ACTION2,
    SUCCESS_WORKPLACE_INSIGHT_ACTION,
    SUCCESS_WORKPLACE_INSIGHT_ACTION2,
    UPDATE_SORTING_ORDER_ACTION,
    UPDATE_SORTING_ORDER_SUCCESS_ACTION,
} from './main-users-actions-constants'

// Every effect below dispatches its own SUCCESS action type on error too (payload undefined /
// error object in place of real data) instead of catchError(() => EMPTY). EMPTY silently drops
// the error: the corresponding *Loading flag in main-users-reports.reducer.ts is only ever reset
// to false by that SUCCESS action, so a failed HTTP call left it stuck true forever with no error
// surfaced. Dispatching the SUCCESS action on failure (with an empty/error payload) resets the
// loading flag via the existing reducer case - no new action types or reducer cases needed. This
// mirrors the pattern already used below for getDigitalScanScores/getRiskAllocations/etc.
@Injectable()
export class MainUsersReportsEffects {
    // Shared across every widget migrated to withStaleWhileRevalidate - safe because cache keys
    // are already scoped per widget+personId (buildKey hashes the full request URL), so entries
    // from different widgets/participants never collide in these maps.
    private insightsInFlightRefreshes = new Set<string>()
    private insightsLastRefreshedAt = new Map<string, number>()

    constructor(
        private actions$: Actions,
        private mainUsersService: MainUsersService,
        private insightsCache: ParticipantInsightsCacheStorageService
    ) {}

    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // The component only checks `riskBehaviorPayload != undefined` (single-user-selection.component.ts:545)
    // - i.e. the raw response object itself, no body/data drill-down - so no extra validity gate
    // is added here beyond ParticipantInsightsCacheStorageService's own undefined/null refusal.
    riskBehaviorData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_RISK_BEHAVIOR_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getRiskBehavior(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getRiskBehaviorCall(personId),
                    (riskBehaviorPayload) => ({
                        type: SUCCESS_RISK_BEHAVIOR_ACTION,
                        riskBehaviorPayload,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_RISK_BEHAVIOR_ACTION,
                        riskBehaviorPayload: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component only checks `riskBehaviorPayload2 != undefined` (double-user-selection.component.ts:567)
    // - the raw response object itself - so no extra validity gate beyond the cache's own
    // undefined/null refusal, same as the base riskBehaviorData effect.
    riskBehaviorData2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_RISK_BEHAVIOR_ACTION2),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getRiskBehavior(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getRiskBehaviorCall(personId),
                    (riskBehaviorPayload2) => ({
                        type: SUCCESS_RISK_BEHAVIOR_ACTION2,
                        riskBehaviorPayload2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_RISK_BEHAVIOR_ACTION2,
                        riskBehaviorPayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component gates on `FDNAScorePayload?.body?.data != undefined` (single-user-selection.component.ts:384-386),
    // so a response without `.body.data` is thrown here to route through the same
    // undefined-payload path as a real HTTP error, instead of being cached as valid.
    // NOTE: this call is dispatched today with `this.accountId` in the `languageId` parameter
    // slot (a pre-existing bug, see SINGLE_USER_SELECTION_CACHING_PLAN.md constraint 4) - the
    // cache key below is built from whatever URL that produces, unchanged, so caching does not
    // alter this endpoint's existing (buggy) behavior.
    FDNAScoreData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_FDNA_SCORE_ACTION),
            switchMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getFDNAScore(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getFDNAScoreCall(personId, languageId).pipe(
                            map((response: any) => {
                                if (response?.body?.data == null) throw response
                                return response
                            })
                        ),
                    (FDNAScorePayload) => ({
                        type: SUCCESS_FDNA_SCORE_ACTION,
                        FDNAScorePayload,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_FDNA_SCORE_ACTION,
                        FDNAScorePayload: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache. Shared by both single- and double-user-selection:
    // - single-user-selection dispatches this once, conditionally, from inside
    //   handleParticipantDetailResponse() (only if the participant has a uniqueStyle) - itself
    //   potentially synchronous on a warm getParticipantsDetail() cache, so this effect's
    //   asapScheduler-deferred cache-hit dispatch (see stale-while-revalidate.ts) is required for
    //   correctness here, exactly as for every other NgRx-effect-based widget in this file.
    // - double-user-selection dispatches this SEQUENTIALLY (person 2 first, then person 1 chained
    //   from inside this action's own success handler, component.ts:525-536) rather than a
    //   parallel base+*2 pair - the single subscription registered once in ngOnInit safely
    //   catches both cache-hit and live emissions for either personId, since cache keys differ.
    // Both consumers check `response.status == 200` (a top-level HttpResponse property, always
    // true for a non-error HTTP response) - equivalent to "no extra gate", so none is added here
    // beyond the cache's own undefined/null refusal.
    getUniqueStyleDetails = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_UNIQUE_STYLE_DETAILS_ACTION),
            switchMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getUniqueStyleAndDescription(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getUniqueStyleAndDescriptionCall(personId, languageId),
                    (uniqueStyleAndDescription) => ({
                        type: GET_UNIQUE_STYLE_DETAILS_ACTION_SUCCESS,
                        uniqueStyleAndDescription,
                    }),
                    (error) => ({
                        type: GET_UNIQUE_STYLE_DETAILS_ACTION_SUCCESS,
                        uniqueStyleAndDescription: undefined,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component passes `response?.FDNAScorePayload2?.data` straight into buildFdnaScoresObject()
    // with no explicit `if` guard, relying on that builder's own null-safety
    // (double-user-selection.component.ts:671-672). Gating the cache write on `body.data` here
    // (mirroring the base FDNAScoreData effect) only affects what gets persisted, not how the
    // component consumes it - the builder already tolerates undefined. Same accountId-as-languageId
    // dispatch caveat as the base widget applies here too (component.ts:470), left unchanged.
    FDNAScoreData2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_FDNA_SCORE_ACTION2),
            switchMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getFDNAScore(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getFDNAScoreCall(personId, languageId).pipe(
                            map((response: any) => {
                                if (response?.body?.data == null) throw response
                                return response
                            })
                        ),
                    (FDNAScorePayload2) => ({
                        type: SUCCESS_FDNA_SCORE_ACTION2,
                        FDNAScorePayload2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_FDNA_SCORE_ACTION2,
                        FDNAScorePayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    getVideoUrl = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_VIDEO_URL_ACTION),
            mergeMap(({ personId }) =>
                this.mainUsersService.getVideoUrl(personId).pipe(
                    map((response) => ({
                        type: GET_VIDEO_URL_ACTION_SUCCESS,
                        response,
                    })),
                    catchError((error) =>
                        of({
                            type: GET_VIDEO_URL_ACTION_SUCCESS,
                            response: undefined,
                            error: ensureApiError(error),
                        })
                    )
                )
            )
        )
    )

    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component has no validity guard (single-user-selection.component.ts:627-628 delegates
    // null-safety to `buildWorkTalentsObject`) - preserved as-is, no new gate added.
    workTalentsData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_WORK_TALENTS_ACTION),
            switchMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getWorkTalents(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getWorkTalentsCall(personId, languageId),
                    (workTalentsPayload) => ({
                        type: SUCCESS_WORK_TALENTS_ACTION,
                        workTalentsPayload,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_WORK_TALENTS_ACTION,
                        workTalentsPayload: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component has no validity guard (double-user-selection.component.ts:680-681 delegates
    // null-safety to buildWorkTalentsObject) - preserved as-is, matching the base workTalentsData
    // effect's identical "no gate" treatment.
    workTalentsData2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_WORK_TALENTS_ACTION2),
            switchMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getWorkTalents(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getWorkTalentsCall(personId, languageId),
                    (workTalentsPayload2) => ({
                        type: SUCCESS_WORK_TALENTS_ACTION2,
                        workTalentsPayload2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_WORK_TALENTS_ACTION2,
                        workTalentsPayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Pilot migration to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md
    // §3 for why this one was chosen first. Cache key is the request URL (personId+languageId
    // baked in), not {accountId, personIds} - see the plan's constraint 3. A response without a
    // real payload is turned into an error (thrown inside the inner pipe) instead of being passed
    // through to cache.setIfChanged, so a business-level failure is never persisted for the TTL
    // window - see constraint 1 (no distinct failure action exists for this endpoint, so the
    // foreground-miss error path below reconstructs today's exact undefined-payload shape).
    environmentKeysData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ENVIRONMENT_KEYS_ACTION),
            mergeMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getEnvironmentKeys(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getEnvironmentKeysCall(personId, languageId).pipe(
                            map((response: any) => {
                                // This endpoint's response has no `statusCode` field - the
                                // component itself gates on `body.data` truthiness (see
                                // single-user-selection.component.ts:672), so mirror that check
                                // here rather than assuming a statusCode shape shared with other
                                // endpoints.
                                if (!response?.body?.data) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the environment keys. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (environmentKeysPayload) => ({
                        type: SUCCESS_ENVIRONMENT_KEYS_ACTION,
                        environmentKeysPayload,
                        personId,
                    }),
                    (error) => ({
                        type: SUCCESS_ENVIRONMENT_KEYS_ACTION,
                        environmentKeysPayload: undefined,
                        personId,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component checks `res?.environmentKeysPayload2?.data` truthy (double-user-selection.component.ts:788),
    // matching the base widget's gate exactly.
    environmentKeysData2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ENVIRONMENT_KEYS_ACTION2),
            switchMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getEnvironmentKeys(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getEnvironmentKeysCall(personId, languageId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) throw response
                                return response
                            })
                        ),
                    (environmentKeysPayload2) => ({
                        type: SUCCESS_ENVIRONMENT_KEYS_ACTION2,
                        environmentKeysPayload2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_ENVIRONMENT_KEYS_ACTION2,
                        environmentKeysPayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component only checks `financialStyleMatchPayload` truthy (single-user-selection.component.ts:640)
    // - the raw response object itself - so no extra validity gate beyond the cache's own
    // undefined/null refusal.
    financialStyleMatchData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_FINANCIAL_STYLE_MATCH_ACTION),
            switchMap(({ personId_1, personId_2 }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getFinancialStyleMatch(personId_1, personId_2).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getFinancialStyleMatchCall(personId_1, personId_2),
                    (financialStyleMatchPayload) => ({
                        type: SUCCESS_FINANCIAL_STYLE_MATCH_ACTION,
                        financialStyleMatchPayload,
                    }),
                    () => ({
                        type: SUCCESS_FINANCIAL_STYLE_MATCH_ACTION,
                        financialStyleMatchPayload: undefined,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    workStyleMatchData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_WORK_STYLE_MATCH_ACTION),
            switchMap(({ personId_1, personId_2 }) =>
                this.mainUsersService.getWorkStyleMatchCall(personId_1, personId_2).pipe(
                    map((response) => ({
                        type: SUCCESS_WORK_STYLE_MATCH_ACTION,
                        workStyleMatchPayload: response,
                    })),
                    catchError((error) =>
                        of({
                            type: SUCCESS_WORK_STYLE_MATCH_ACTION,
                            workStyleMatchPayload: undefined,
                            error: ensureApiError(error),
                        })
                    )
                )
            )
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component gates on `tScorePaylaod?.data != undefined` (single-user-selection.component.ts:579),
    // where `tScorePaylaod` is the reducer's already-unwrapped `response.body` - equivalent to
    // `response?.body?.data == null` on the raw response here, thrown to route through the same
    // undefined-payload path as a real HTTP error. Note the same response also feeds
    // `strongestFactorsPaylaod` in the reducer (main-users-reports.reducer.ts) - unaffected by
    // this change, since the reducer still receives the identical SUCCESS_TSCORE_ACTION shape
    // whether it came from cache or a live fetch.
    tScoreData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_TSCORE_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getTScore(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getTScoreCall(personId).pipe(
                            map((response: any) => {
                                if (response?.body?.data == null) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the t-score data. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (tScorePaylaod) => ({
                        type: SUCCESS_TSCORE_ACTION,
                        tScorePaylaod,
                        personId,
                    }),
                    (error) => ({
                        type: SUCCESS_TSCORE_ACTION,
                        tScorePaylaod: undefined,
                        personId,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component gates on `tScorePaylaod2?.data != undefined` (double-user-selection.component.ts:628),
    // matching the base widget's gate exactly. Same shared `strongestFactorsPaylaod2` reducer
    // side-effect as the base widget applies here too - unaffected by this change.
    tScoreData2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_TSCORE_ACTION2),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getTScore(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getTScoreCall(personId).pipe(
                            map((response: any) => {
                                if (response?.body?.data == null) throw response
                                return response
                            })
                        ),
                    (tScorePaylaod2) => ({
                        type: SUCCESS_TSCORE_ACTION2,
                        tScorePaylaod2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_TSCORE_ACTION2,
                        tScorePaylaod2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component has no validity guard at all for this one (single-user-selection.component.ts:374-379
    // unconditionally reads `.body.data...`) - preserved exactly as-is, no new gate added here.
    // Cache key includes the personId-less stockMarketId only (global market data, not
    // participant-scoped) - see the plan's constraint 3.
    marketData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_MARKET_DATA_ACTION),
            mergeMap(({ stockMarketId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getMaraketData(stockMarketId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getMarketDataCall(stockMarketId),
                    (marketDataResponse) => ({
                        type: GET_MARKET_DATA_ACTION_SUCCESS,
                        marketDataResponse,
                    }),
                    () => ({
                        type: GET_MARKET_DATA_ACTION_SUCCESS,
                        marketDataResponse: undefined,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    strongestFactorData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_STRONGEST_FACTOR_ACTION),
            mergeMap(({ personId }) =>
                this.mainUsersService.getStrongestFactoreCall(personId).pipe(
                    map((response) => ({
                        type: SUCCESS_STRONGEST_FACTOR_ACTION,
                        strongestFactorsPaylaod: response,
                    })),
                    catchError((error) =>
                        of({
                            type: SUCCESS_STRONGEST_FACTOR_ACTION,
                            strongestFactorsPaylaod: undefined,
                            error: ensureApiError(error),
                        })
                    )
                )
            )
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component has no validity guard at all (single-user-selection.component.ts:645-654 calls
    // `.data?.roles.forEach(...)` unconditionally - a pre-existing crash risk if `data` exists
    // but `roles` doesn't) - preserved exactly as-is, not fixed here since that's a pre-existing
    // behavior, not something this caching change should alter.
    careersInsights = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_CAREERS_INSIGHTS_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getCareersInsights(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getCareersInsightsCall(personId),
                    (careersInsightsPayload) => ({
                        type: SUCCESS_CAREERS_INSIGHTS_ACTION,
                        careersInsightsPayload,
                        personId,
                    }),
                    (error) => ({
                        type: SUCCESS_CAREERS_INSIGHTS_ACTION,
                        careersInsightsPayload: undefined,
                        error: ensureApiError(error),
                        notify: true,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component only checks `careersInsightsPayload2` truthy (double-user-selection.component.ts:714-718)
    // - the raw response object itself, then unconditionally does `.data?.roles.forEach(...)`
    // (a pre-existing crash risk if `data` exists but `roles` doesn't, matching the base widget's
    // documented identical risk) - preserved exactly as-is, no new gate added.
    careersInsights2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_CAREERS_INSIGHTS_ACTION2),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getCareersInsights(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getCareersInsightsCall(personId),
                    (careersInsightsPayload2) => ({
                        type: SUCCESS_CAREERS_INSIGHTS_ACTION2,
                        careersInsightsPayload2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_CAREERS_INSIGHTS_ACTION2,
                        careersInsightsPayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component only checks `behaviralBiasesPayload` truthy (single-user-selection.component.ts:458-459)
    // - the raw response object itself - so no extra validity gate beyond the cache's own
    // undefined/null refusal. Same accountId-as-languageId caveat as FDNAScoreData applies here
    // (see that effect's comment) - left unchanged, not fixed as part of caching.
    behaviralBiasesData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_BEHAVIRAL_BIASES_ACTION),
            mergeMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getBehaviralBiases(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getBehaviralBiasesCall(personId, languageId),
                    (behaviralBiasesPayload) => ({
                        type: SUCCESS_BEHAVIRAL_BIASES_ACTION,
                        behaviralBiasesPayload,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_BEHAVIRAL_BIASES_ACTION,
                        behaviralBiasesPayload: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component checks `response?.behaviralBiasesPayload2?.data` truthy
    // (double-user-selection.component.ts:745) - stricter than the base widget's whole-payload
    // truthy check, so gated on `.body.data` here to match. Same accountId-as-languageId dispatch
    // caveat as the base widget applies here too (component.ts:474), left unchanged.
    behaviralBiasesData2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_BEHAVIRAL_BIASES_ACTION2),
            mergeMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getBehaviralBiases(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getBehaviralBiasesCall(personId, languageId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) throw response
                                return response
                            })
                        ),
                    (behaviralBiasesPayload2) => ({
                        type: SUCCESS_BEHAVIRAL_BIASES_ACTION2,
                        behaviralBiasesPayload2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_BEHAVIRAL_BIASES_ACTION2,
                        behaviralBiasesPayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component checks reducer's `workPlaceInsightPayload` (= response.body) truthy
    // (single-user-selection.component.ts:605), then reads `.data?.insight` via optional
    // chaining - a real HTTP response body is essentially always truthy, so no extra gate is
    // added beyond the cache's own undefined/null refusal.
    workPlaceInsightData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_WORKPLACE_INSIGHT_ACTION),
            mergeMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getWorkPlaceInsight(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getWorkPlaceInsightCall(personId, languageId),
                    (workPlaceInsightPayload) => ({
                        type: SUCCESS_WORKPLACE_INSIGHT_ACTION,
                        workPlaceInsightPayload,
                        personId,
                    }),
                    (error) => ({
                        type: SUCCESS_WORKPLACE_INSIGHT_ACTION,
                        workPlaceInsightPayload: undefined,
                        personId,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // No subscription in double-user-selection.component.ts consumes `workPlaceInsightPayload2` at
    // all - `workPlaceObject_2`/`workPlaceInsightsLoading_2` are declared but never assigned
    // (dead/incomplete feature, pre-existing). Migrated anyway for consistency with every other
    // widget in this file and because a future fix to that dead code should get caching for free -
    // no validity gate needed since nothing currently reads the payload.
    workPlaceInsightData2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_WORKPLACE_INSIGHT_ACTION2),
            mergeMap(({ personId, languageId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getWorkPlaceInsight(personId, languageId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getWorkPlaceInsightCall(personId, languageId),
                    (workPlaceInsightPayload2) => ({
                        type: SUCCESS_WORKPLACE_INSIGHT_ACTION2,
                        workPlaceInsightPayload2,
                        personId,
                    }),
                    () => ({
                        type: SUCCESS_WORKPLACE_INSIGHT_ACTION2,
                        workPlaceInsightPayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    getParticipantsDetail = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_PARTICIPANTS_DETAIL_ACTION),
            switchMap((payload: any) =>
                this.mainUsersService.getParticipantsDetail(payload).pipe(
                    map((response) => {
                        let modifiedResponse: any = {}
                        if (response) {
                            modifiedResponse = { ...response }
                        }
                        modifiedResponse['isFidelityLogin'] = payload.isFidelityLogin
                        return {
                            type: GET_PARTICIPANTS_DETAIL_SUCCESS_ACTION,
                            response: modifiedResponse,
                        }
                    }),
                    catchError((error) =>
                        of({
                            type: GET_PARTICIPANTS_DETAIL_FAILURE_ACTION,
                            error: ensureApiError(error),
                        })
                    )
                )
            )
        )
    )

    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component has no validity guard for this one either (single-user-selection.component.ts:438-442
    // reads everything via optional chaining) - preserved as-is, no new gate added.
    getMarketMoodArray = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_MARKET_MOOD_ARRAY_ACTION),
            mergeMap(({ personId, portfolioValue, date }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getMarketMoodArray(personId, portfolioValue, date).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getMarketMoodArrayCall(personId, portfolioValue, date),
                    (response) => ({
                        type: GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION,
                        response,
                    }),
                    () => ({
                        type: GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION,
                        response: undefined,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Component has no validity guard (double-user-selection.component.ts:519-523 reads
    // everything via optional chaining off the raw action stream) - preserved as-is, matching the
    // base getMarketMoodArray effect's identical "no gate" treatment.
    getMarketMoodArray2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_MARKET_MOOD_ARRAY_ACTION2),
            mergeMap(({ personId, portfolioValue, date }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getMarketMoodArray(personId, portfolioValue, date).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () => this.mainUsersService.getMarketMoodArrayCall(personId, portfolioValue, date),
                    (response) => ({
                        type: GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION2,
                        response,
                    }),
                    () => ({
                        type: GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION2,
                        response: undefined,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Component reads reducer state (already unwrapped to `response.body.data`) and checks it
    // truthy (single-user-selection.component.ts:694) - so the gate here checks
    // `response?.body?.data` on the raw response, thrown to route through the undefined-payload
    // path if missing, matching what the component would otherwise treat as "no data".
    getCommunicationInsights = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_COMMUNICATION_INSIGHTS_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getCommunicationInsights(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getCommunicationInsightsCall(personId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) throw response
                                return response
                            })
                        ),
                    (communicationInsightPayload) => ({
                        type: GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION,
                        communicationInsightPayload,
                        personId,
                    }),
                    () => ({
                        type: GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION,
                        communicationInsightPayload: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // PRE-EXISTING BUG, left untouched: the component's consuming subscription
    // (double-user-selection.component.ts:854-855) gates `communicationInsightsData2` on
    // `response?.communicationInsightPayload` (the BASE/person-1 key, no `2` suffix) rather than
    // `communicationInsightPayload2` - person 2's card is effectively coupled to person 1's data
    // being present. This is a component-level defect independent of caching; only the cache
    // write's own validity (does THIS response have real data) is gated here, matching the base
    // widget's `.body.data` check - it does not change or mask the coupling bug.
    getCommunicationInsights2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_COMMUNICATION_INSIGHTS_ACTION2),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getCommunicationInsights(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getCommunicationInsightsCall(personId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) throw response
                                return response
                            })
                        ),
                    (communicationInsightPayload2) => ({
                        type: GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION2,
                        communicationInsightPayload2,
                        personId,
                    }),
                    () => ({
                        type: GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION2,
                        communicationInsightPayload2: undefined,
                        personId,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // Never dispatched directly from ngOnInit - only from inside the getSortingOrderActionSuccess
    // subscription below (component.ts ~498-505), well after ngOnInit has fully finished, so this
    // effect's cache-hit dispatch has no dispatch-before-subscribe timing risk regardless of the
    // asapScheduler fix (its own getOldReportsActionSuccess subscription, component.ts ~481, is
    // registered even earlier in ngOnInit than the sorting-order one that triggers this).
    // Whether the participant "has legacy reports" or "legitimately none" is decided by the
    // COMPONENT from `data?.url` presence (single-user-selection.component.ts ~482-489), not by a
    // status code - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D2. Resolved by audit: a
    // resolved response here is already a real success regardless of whether the backend signals
    // "no legacy reports" as a true HTTP 204 or as 200-with-empty-data, since ApiErrorInterceptor
    // already throws for any real transport failure before this `map` ever runs - so there was
    // never a genuine need to distinguish 200 from 204 here at all. The gate below only catches a
    // response with no `body` whatsoever (a truly malformed shape), attaching a real ApiError (D5)
    // instead of the old bare `response: undefined`.
    getOldReports = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_OLD_REPORTS_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getOldReports(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getOldReportsCall(personId).pipe(
                            map((response: any) => {
                                // `body: null` is a legitimate resolved state (a real HTTP 204,
                                // or 200-with-empty-body for "no legacy reports") - only a
                                // genuinely missing response is a problem here.
                                if (!response) {
                                    const gateError: ApiError = {
                                        status: 0,
                                        message: 'We could not load legacy reports. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (response) => ({
                        type: GET_OLD_REPORTS_ACTION_SUCCESS,
                        response,
                    }),
                    (error) => ({
                        type: GET_OLD_REPORTS_ACTION_SUCCESS,
                        response: undefined,
                        error: ensureApiError(error),
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    // Migrated to the persistent SWR cache - see SINGLE_USER_SELECTION_CACHING_PLAN.md §3/§6.
    // This is the pair that caused the original regression (see
    // SINGLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md §8): the component's
    // getSortingOrderActionSuccess subscription (component.ts ~498-505) unconditionally
    // dispatches getOldReportsAction on EVERY emission of this action type - cache hit,
    // background refresh, or foreground miss alike - which is what re-derives the permission-
    // filtered card order via getOldReportsActionSuccess. That chain lives entirely in the
    // component's own subscriptions, keyed off the action TYPE, not off how this effect produced
    // it - so it fires correctly regardless of caching, as long as this effect keeps dispatching
    // the same GET_SORTING_ORDER_SUCCESS_ACTION type on every emission (which withStaleWhileRevalidate
    // does: on both the cache-hit and any background-refresh-with-changed-data emission).
    // Component gates on `body.data` presence (component.ts ~499) - matched exactly here, not
    // `body.statusCode` (that field doesn't exist on any response anymore - see
    // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D1). A gate failure attaches a real ApiError
    // (D5) built from the backend's own message when it sent one, instead of the old bare
    // `sortingOrderResponse: undefined`.
    //
    // IMPORTANT: the component's getSortingOrderActionSuccess subscription dispatches
    // getOldReportsAction UNCONDITIONALLY on every emission of this action, success or failure -
    // that's load-bearing (see SINGLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md §8, referenced in
    // the comment above getOldReports). Do not make that dispatch conditional on `error` being
    // absent when fixing the component side of this pair.
    getSortingCards = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SORTING_ORDER_ACTION),
            mergeMap(({ accountId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getSortingOrder(accountId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getSortingOrderCall(accountId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the report card order. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (sortingOrderResponse) => ({
                        type: GET_SORTING_ORDER_SUCCESS_ACTION,
                        sortingOrderResponse,
                    }),
                    (error) => ({
                        type: GET_SORTING_ORDER_SUCCESS_ACTION,
                        sortingOrderResponse: undefined,
                        error: ensureApiError(error),
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )
    updateSortingOrder = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_SORTING_ORDER_ACTION),
            mergeMap((payload) =>
                this.mainUsersService.updateSortingOrderCall(payload).pipe(
                    map((response) => ({
                        type: UPDATE_SORTING_ORDER_SUCCESS_ACTION,
                        response,
                    })),
                    catchError((error) =>
                        of({
                            type: UPDATE_SORTING_ORDER_SUCCESS_ACTION,
                            response: undefined,
                            error: ensureApiError(error),
                        })
                    )
                )
            )
        )
    )
    // Migrated to the persistent SWR cache - see DOUBLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md.
    // Unlike the base getOldReportsAction, this one is dispatched directly and unconditionally
    // from ngOnInit (double-user-selection.component.ts:468), not nested inside another action's
    // success handler - no cross-action coupling/regression risk here. Component treats BOTH
    // Same fix and reasoning as the base getOldReports above - see D2's audit resolution in
    // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md: a resolved response is always a real success
    // here, regardless of whether "no legacy reports" arrives as a true 204 or 200-with-empty-data,
    // so there's nothing to gate on beyond the response having a body at all.
    getOldReports2 = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_OLD_REPORTS_ACTION2),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getOldReports(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getOldReportsCall(personId).pipe(
                            map((response: any) => {
                                // `body: null` is a legitimate resolved state (a real HTTP 204,
                                // or 200-with-empty-body for "no legacy reports") - only a
                                // genuinely missing response is a problem here.
                                if (!response) {
                                    const gateError: ApiError = {
                                        status: 0,
                                        message: 'We could not load legacy reports. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (response) => ({
                        type: GET_OLD_REPORTS_ACTION_SUCCESS2,
                        response,
                    }),
                    (error) => ({
                        type: GET_OLD_REPORTS_ACTION_SUCCESS2,
                        response: undefined,
                        error: ensureApiError(error),
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see REPORTS_INSIGHTS_CACHING_PLAN.md.
    // Keyed by {accountId, reportId}, not personId - the custom report name is an account-level
    // setting, not participant-scoped, so it's naturally shared across every participant in the
    // same account (a byte-budget win, not a bug: fewer distinct cache entries for the same data).
    // Four consumers (participant-financial-report.component.ts, participant-business-report.
    // component.ts, team-report.component.ts, comparison-report.component.ts) share the identical
    // response shape, so one validity gate below covers all four.
    //
    // Classifies by whether `body.data` is present (see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md
    // D1), not `body.statusCode` - that field doesn't exist on any response anymore. A gate failure
    // (a resolved response with no usable `data`) is turned into a real ApiError here, carrying the
    // backend's own message via `serverMessage()` when it sent one (D5) - the same message
    // `ensureApiError` would have extracted from a genuine HttpErrorResponse, so
    // ApiErrorNotificationEffects toasts it identically either way. A real transport failure never
    // reaches this `map` at all: ApiErrorInterceptor already converted it to an ApiError before
    // withStaleWhileRevalidate's own catchError sees it - `ensureApiError` below passes that through
    // unchanged via its `isApiError` short-circuit.
    getCustomReportName = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_CUSTOM_REPORT_NAME_ACTION),
            mergeMap(({ payload }: any) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getCustomReportName(payload.accountId, payload.reportId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getCustomReportNameCall(payload).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the report name. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (response) => ({
                        type: GET_CUSTOM_REPORT_NAME_ACTION_SUCCESS,
                        response,
                    }),
                    (error) => ({
                        type: GET_CUSTOM_REPORT_NAME_ACTION_SUCCESS,
                        response: undefined,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    getWorkRelatedMoneyInsights = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_WORK_RELATED_MONEY_INSIGHTS_ACTION),
            mergeMap(({ payload }) =>
                this.mainUsersService.getWorkRelatedMoneyInsights(payload).pipe(
                    map((response: any) => ({
                        type: GET_WORK_RELATED_MONEY_INSIGHTS_ACTION_SUCCESS,
                        response,
                    })),
                    catchError((error) =>
                        of({
                            type: GET_WORK_RELATED_MONEY_INSIGHTS_ACTION_SUCCESS,
                            response: undefined,
                            error: ensureApiError(error),
                        })
                    )
                )
            )
        )
    )

    getDigitalScanScores = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_DIGITAL_SCAN_SCORES),
            mergeMap(({ payload }) =>
                this.mainUsersService.getDigitalScanScores(payload).pipe(
                    map((response: any) => ({
                        type: GET_DIGITAL_SCAN_SCORES_SUCCESS,
                        response,
                    })),
                    // digital-scan-form.component.ts:295 already listens for this FAILURE action
                    // and shows its own msgService.errorMessage + mixpanel track - do not also
                    // attach `error:` here, that would double-toast via ApiErrorNotificationEffects
                    // on top of the component's own message. See the reducer's
                    // getDigitalScanScoresActionFailure case for the digitalScanLoading reset.
                    catchError((err) =>
                        of({
                            type: GET_DIGITAL_SCAN_SCORES_FAILURE,
                            response: err,
                        })
                    )
                )
            )
        )
    )

    // Migrated to the persistent SWR cache - see REPORTS_INSIGHTS_CACHING_PLAN.md.
    // mainUsersService.getRiskAllocations(personId) calls UserRequests.getRiskBehavior(personId)
    // under the hood (main-users.service.ts:372-374) - not a copy-paste accident: the backend URL
    // behind that name is literally 'NaturalBehavior/GetRiskAllocation' (network-constants.ts:74),
    // and both this effect's consumer (participant-financial-report.component.ts:332, reading
    // `response.body.data.riskGroup`) and riskBehaviorData's consumer (single-user-selection.
    // component.ts:558-562, reading `riskBehaviorPayload.data.riskGroup`) read the identical
    // `riskGroup` field from the same endpoint. This is one backend concept surfaced under two
    // frontend names, not two features that happen to collide - so the cache key here is built
    // from the SAME URL riskBehaviorData already uses, deliberately sharing that cache entry: a
    // participant's risk data fetched once (from either the selection screen or this report)
    // serves both, with no separate cache entry or extra network call for the other.
    // Consumer gates on `body.data` presence (participant-financial-report.component.ts:330), not
    // `response.body.statusCode` (D1 - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md - that field
    // doesn't exist on any response anymore). A gate failure attaches a real ApiError (D5).
    getRiskAllocations = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_RISK_ALLOCATIONS_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getRiskBehavior(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getRiskAllocations(personId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the risk group. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (response) => ({
                        type: GET_RISK_ALLOCATIONS_ACTION_SUCCESS,
                        response,
                    }),
                    (error) => ({
                        type: GET_RISK_ALLOCATIONS_ACTION_SUCCESS,
                        response: undefined,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see REPORTS_INSIGHTS_CACHING_PLAN.md.
    // Component gates on `body.data` presence (participant-financial-report.component.ts:344), not
    // `response.body.statusCode` (D1 - that field doesn't exist on any response anymore). A gate
    // failure attaches a real ApiError (D5) instead of a bare `response: undefined`, and now
    // includes the D6 fix for the destructure this comment used to flag as pre-existing:
    // `const { data } = response.body` throws on a genuinely absent response, which the D1 gate
    // above already turns into an error before `response` is ever missing `.body`.
    getFinancialPlanningInsights = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getFinancialPlanningInsights(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getFinancialPlanningInsights(personId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the financial planning insights. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (response) => ({
                        type: GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION_SUCCESS,
                        response,
                    }),
                    (error) => ({
                        type: GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION_SUCCESS,
                        response: undefined,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see REPORTS_INSIGHTS_CACHING_PLAN.md.
    // Two consumers (sales-report.component.ts, coaching-report.component.ts) share the identical
    // `response.body.data` entries shape, so one validity gate below covers both. Classified on
    // `body.data` presence, not `body.statusCode` (D1 - see
    // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md - that field doesn't exist on any response
    // anymore). A gate failure attaches a real ApiError (D5) instead of a bare `response: undefined`.
    getSalesInsights = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SALES_INSIGHT_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getSalesInsightData(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getSalesInsights(personId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the sales insights. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (response) => ({
                        type: GET_SALES_INSIGHT_ACTION_SUCCESS,
                        response,
                    }),
                    (error) => ({
                        type: GET_SALES_INSIGHT_ACTION_SUCCESS,
                        response: undefined,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    // Migrated to the persistent SWR cache - see REPORTS_INSIGHTS_CACHING_PLAN.md.
    // Two consumers (sales-report.component.ts, coaching-report.component.ts) share the identical
    // talents-rewards-roles shape, so one validity gate below covers both. Classified on
    // `body.data` presence, not `body.statusCode` (D1) - a gate failure attaches a real ApiError
    // (D5). Both consumers' success handlers previously pushed onto
    // hiringData.talents/rewards/roles without resetting first - harmless when the action could
    // only fire once per dispatch, but the SWR cache-hit + background-refresh pattern can now fire
    // it twice for one dispatch, so both handlers were fixed to reset those arrays before
    // repopulating (see their own comments) as a prerequisite for this migration.
    getHiringData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_HIRING_DATA_ACTION),
            mergeMap(({ personId }) => {
                const cacheKey = this.insightsCache.buildKey(UserRequests.getHiringData(personId).url)
                return withStaleWhileRevalidate(
                    cacheKey,
                    this.insightsCache,
                    this.insightsInFlightRefreshes,
                    () =>
                        this.mainUsersService.getHiringData(personId).pipe(
                            map((response: any) => {
                                if (!response?.body?.data) {
                                    const gateError: ApiError = {
                                        status: response?.status ?? 0,
                                        message:
                                            serverMessage(response?.body) ||
                                            'We could not load the hiring data. Please try again, or contact support if the issue persists.',
                                    }
                                    throw gateError
                                }
                                return response
                            })
                        ),
                    (response) => ({
                        type: GET_HIRING_DATA_ACTION_SUCCESS,
                        response,
                    }),
                    (error) => ({
                        type: GET_HIRING_DATA_ACTION_SUCCESS,
                        response: undefined,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.insightsLastRefreshedAt
                )
            })
        )
    )

    getCustomReportAccessData = createEffect(() =>
        this.actions$.pipe(
            ofType(CUSTOM_REPORT_ACCESS_DATA_ACTION),
            mergeMap(() =>
                this.mainUsersService.getCustomReportAccessData().pipe(
                    map((response: any) => ({
                        type: CUSTOM_REPORT_ACCESS_DATA_ACTION_SUCCESS,
                        response,
                    })),
                    catchError((err) =>
                        of({
                            type: CUSTOM_REPORT_ACCESS_DATA_ACTION_SUCCESS,
                            response: undefined,
                            error: ensureApiError(err),
                        })
                    )
                )
            )
        )
    )

    getTraitsDescription = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_TRAITS_DESCRIPTION_ACTION),
            mergeMap(() =>
                this.mainUsersService.getTraitsDescription().pipe(
                    map((response: any) => ({
                        type: GET_TRAITS_DESCRIPTION_ACTION_SUCCESS,
                        response,
                    })),
                    catchError((err) =>
                        of({
                            type: GET_TRAITS_DESCRIPTION_ACTION_SUCCESS,
                            response: undefined,
                            error: ensureApiError(err),
                            notify: true,
                        })
                    )
                )
            )
        )
    )

    getCoachingReportData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_COACGING_REPORT_ACTION),
            mergeMap(() =>
                this.mainUsersService.getCoachingReportData().pipe(
                    map((response: any) => ({
                        type: GET_COACHING_REPORT_ACTION_SUCCESS,
                        coachingReportTableData: response,
                    })),
                    catchError((err) =>
                        of({
                            type: GET_COACHING_REPORT_ACTION_SUCCESS,
                            coachingReportTableData: undefined,
                            error: ensureApiError(err),
                            notify: true,
                        })
                    )
                )
            )
        )
    )
    getFactorRelationship = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_FACTOR_RELATIONSHIP_ACTION),
            mergeMap(() =>
                this.mainUsersService.getFactorRelationship().pipe(
                    map((response: any) => ({
                        type: GET_FACTOR_RELATIONSHIP_ACTION_SUCCESS,
                        response,
                    })),
                    catchError((err) =>
                        of({
                            type: GET_FACTOR_RELATIONSHIP_ACTION_SUCCESS,
                            response: undefined,
                            error: ensureApiError(err),
                            notify: true,
                        })
                    )
                )
            )
        )
    )

    getUniqueStyleDescription = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_UNIQUE_STYLE_DESCRIPTION_ACTION),
            mergeMap(() =>
                this.mainUsersService.getUniqueStyleDescription().pipe(
                    map((response: any) => ({
                        type: GET_UNIQUE_STYLE_DESCRIPTION_ACTION_SUCCESS,
                        response,
                    })),
                    catchError((err) =>
                        of({
                            type: GET_UNIQUE_STYLE_DESCRIPTION_ACTION_SUCCESS,
                            response: undefined,
                            error: ensureApiError(err),
                            notify: true,
                        })
                    )
                )
            )
        )
    )
}
