import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { Observable, ReplaySubject, of, throwError } from 'rxjs'
import { delay } from 'rxjs/operators'
import { MainUsersService } from '../../main-users.service'
import { ParticipantInsightsCacheStorageService } from 'src/app/service/participant-insights-cache-storage.service'
import { MainUsersReportsEffects } from './main-users-reports.effects'
import {
    getFDNAFinancialPlanningInsightsAction,
    getCustomReportNameAction,
    getSalesInsightsAction,
    getHiringDataAction,
    getOldReportsAction,
    getOldReportsAction2,
    getSortingOrderAction,
    getRiskAllocation,
} from './main-users-reports.actions'

// Covers the 4 report-page widgets migrated to the persistent SWR cache in this session (see
// REPORTS_INSIGHTS_CACHING_PLAN.md) - not a full-file spec, this file previously had no coverage
// at all. Mirrors dashboard.effect.spec.ts's pattern for the same withStaleWhileRevalidate shape;
// the one difference is that this file's cache-hit dispatch is deferred via asapScheduler (see
// stale-while-revalidate.ts's own comment on why), so every warm-cache assertion here needs
// fakeAsync + flushMicrotasks() to observe it, unlike the dashboard effect's synchronous dispatch.
describe('MainUsersReportsEffects - report-page widgets migrated to the SWR cache', () => {
    let actions$: ReplaySubject<any>
    let effect: MainUsersReportsEffects
    let cache: jasmine.SpyObj<ParticipantInsightsCacheStorageService>
    let mainUsersService: jasmine.SpyObj<MainUsersService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        cache = jasmine.createSpyObj('ParticipantInsightsCacheStorageService', ['buildKey', 'get', 'set', 'setIfChanged'])
        mainUsersService = jasmine.createSpyObj('MainUsersService', [
            'getFinancialPlanningInsights',
            'getCustomReportNameCall',
            'getSalesInsights',
            'getHiringData',
            'getOldReportsCall',
            'getSortingOrderCall',
            'getRiskAllocations',
        ])
        cache.buildKey.and.callFake((url: string, namespace = '') => `insights:test-user:${namespace}${url}`)

        TestBed.configureTestingModule({
            providers: [
                MainUsersReportsEffects,
                provideMockActions(() => actions$),
                { provide: MainUsersService, useValue: mainUsersService },
                { provide: ParticipantInsightsCacheStorageService, useValue: cache },
            ],
        })

        effect = TestBed.inject(MainUsersReportsEffects)
    })

    // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D1: classified on `body.data` presence, not
    // `body.statusCode` - that field doesn't exist on any response anymore. This is the exact
    // effect behind the "Financial Planning Insights" report page rendering an empty table
    // despite a real 200 response, caught live and traced back to this gate.
    describe('getFinancialPlanningInsights', () => {
        it('cold cache: fetches live, caches a real response with usable data, and dispatches success', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getFinancialPlanningInsights.and.returnValue(of({ status: 200, body: { message: 'Success', data: { insight1: 'a' } } }) as any)

            const results = collect(effect.getFinancialPlanningInsights)
            actions$.next(getFDNAFinancialPlanningInsightsAction('person-1'))

            expect(mainUsersService.getFinancialPlanningInsights).toHaveBeenCalledWith('person-1')
            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results[0].response.body.data.insight1).toBe('a')
            expect(results[0].error).toBeUndefined()
        })

        it('a resolved response with no usable data is never cached, and attaches an ApiError instead of the old bare `response: undefined`', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getFinancialPlanningInsights.and.returnValue(
                of({ status: 200, body: { errors: { collections: { error: 'No insights available' } } } }) as any
            )

            const results = collect(effect.getFinancialPlanningInsights)
            actions$.next(getFDNAFinancialPlanningInsightsAction('person-1'))

            expect(cache.setIfChanged).not.toHaveBeenCalled()
            expect(results[0].response).toBeUndefined()
            expect(results[0].error.message).toBe('No insights available')
        })

        it('warm cache: dispatches the cached value without calling the live API on the visible path', fakeAsync(() => {
            const cached = { status: 200, body: { message: 'Success', data: { insight1: 'cached' } } }
            cache.get.and.returnValue({ status: 'fresh', data: cached })
            cache.setIfChanged.and.returnValue(false)
            mainUsersService.getFinancialPlanningInsights.and.returnValue(of(cached) as any)

            const results = collect(effect.getFinancialPlanningInsights)
            actions$.next(getFDNAFinancialPlanningInsightsAction('person-1'))
            flushMicrotasks()

            expect(results[0].response).toEqual(cached as any)
        }))
    })

    // No coverage existed for this effect before this fix. Same D1 pattern as
    // getFinancialPlanningInsights - this is the effect behind "Portfolio Risk Group" rendering
    // blank ("Group .", no number) despite a real 200 response.
    describe('getRiskAllocations', () => {
        it('caches a real response with a risk group value', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getRiskAllocations.and.returnValue(of({ status: 200, body: { message: 'Success', data: { riskGroup: 5 } } }) as any)

            const results = collect(effect.getRiskAllocations)
            actions$.next(getRiskAllocation('person-1'))

            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results[0].response.body.data.riskGroup).toBe(5)
            expect(results[0].error).toBeUndefined()
        })

        it('a resolved response with no usable data attaches an ApiError instead of the old bare `response: undefined`', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getRiskAllocations.and.returnValue(of({ status: 200, body: { message: 'Success' } }) as any)

            const results = collect(effect.getRiskAllocations)
            actions$.next(getRiskAllocation('person-1'))

            expect(results[0].response).toBeUndefined()
            expect(results[0].error).toBeTruthy()
        })

        it('a genuine transport failure attaches an ApiError', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getRiskAllocations.and.returnValue(throwError(() => new Error('network down')))

            const results = collect(effect.getRiskAllocations)
            actions$.next(getRiskAllocation('person-1'))

            expect(results[0].response).toBeUndefined()
            expect(results[0].error).toBeTruthy()
        })
    })

    describe('getCustomReportName', () => {
        it('cold cache: builds its key from {accountId, reportId}, not personId, and caches a real response with usable data', () => {
            // No `statusCode` field - this is the real backend shape (see REPORT_WIDGETS_STATUSCODE_
            // MIGRATION_PLAN.md D1). Asserting against the old `statusCode: 200` shape would pass
            // today even with the pre-fix `body.statusCode !== 200` gate broken (it always threw),
            // masking the exact bug this migration fixes - so this test intentionally omits it.
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getCustomReportNameCall.and.returnValue(
                of({ status: 200, body: { message: 'Success', data: { customReports: [{ customReportName: 'Financial DNA' }] } } }) as any
            )

            const results = collect(effect.getCustomReportName)
            actions$.next(getCustomReportNameAction({ accountId: 'acc-1', reportId: 42 }))

            expect(mainUsersService.getCustomReportNameCall).toHaveBeenCalledWith({ accountId: 'acc-1', reportId: 42 })
            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results.length).toBe(1)
            expect(results[0].type).toBe('getCustomReportNameActionSuccess')
            expect(results[0].response.body.data.customReports[0].customReportName).toBe('Financial DNA')
            expect(results[0].error).toBeUndefined()
        })

        it('a resolved response with no usable data is never cached, and attaches the backend message as an ApiError (D5)', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getCustomReportNameCall.and.returnValue(
                of({ status: 200, body: { errors: { collections: { error: 'No report configured for this account' } } } }) as any
            )

            const results = collect(effect.getCustomReportName)
            actions$.next(getCustomReportNameAction({ accountId: 'acc-1', reportId: 42 }))

            expect(cache.setIfChanged).not.toHaveBeenCalled()
            expect(results[0].response).toBeUndefined()
            expect(results[0].error.message).toBe('No report configured for this account')
        })

        it('a genuine transport failure attaches an ApiError too, instead of the old silent `response: undefined`', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getCustomReportNameCall.and.returnValue(throwError(() => new Error('network down')))

            const results = collect(effect.getCustomReportName)
            actions$.next(getCustomReportNameAction({ accountId: 'acc-1', reportId: 42 }))

            expect(results[0].response).toBeUndefined()
            expect(results[0].error).toBeTruthy()
        })
    })

    // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D2's audit resolution: a resolved response is
    // always a real success here, regardless of whether the backend signals "no legacy reports"
    // as a true HTTP 204 or as 200-with-empty-data - so the gate only needs to catch a response
    // with no `body` at all. No coverage existed for this effect before this fix.
    describe('getOldReports', () => {
        it('caches a real response with a legacy-reports url (the "has reports" case)', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getOldReportsCall.and.returnValue(of({ status: 200, body: { message: 'Success', data: { url: 'https://blob/reportId/x' } } }) as any)

            const results = collect(effect.getOldReports)
            actions$.next(getOldReportsAction('person-1'))

            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results[0].response.body.data.url).toBe('https://blob/reportId/x')
            expect(results[0].error).toBeUndefined()
        })

        it('caches a real response with no url (the legitimate "no legacy reports" case) - never treated as an error', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getOldReportsCall.and.returnValue(of({ status: 204, body: null }) as any)

            const results = collect(effect.getOldReports)
            actions$.next(getOldReportsAction('person-1'))

            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results[0].response).toEqual({ status: 204, body: null } as any)
            expect(results[0].error).toBeUndefined()
        })

        it('an undefined body is treated as success, not an error - it is a legitimate resolved state (204 or 200-empty), not a malformed response', () => {
            // Regression coverage for a bug caught by this test suite during implementation: the
            // gate originally checked `!response?.body`, which also rejected a *legitimate*
            // `body: null`/`body: undefined` response (the "no legacy reports" case) as an error.
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getOldReportsCall.and.returnValue(of({ status: 200, body: undefined }) as any)

            const results = collect(effect.getOldReports)
            actions$.next(getOldReportsAction('person-1'))

            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results[0].error).toBeUndefined()
        })

        it('a genuine transport failure attaches an ApiError', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getOldReportsCall.and.returnValue(throwError(() => new Error('network down')))

            const results = collect(effect.getOldReports)
            actions$.next(getOldReportsAction('person-1'))

            expect(results[0].response).toBeUndefined()
            expect(results[0].error).toBeTruthy()
        })
    })

    describe('getOldReports2 (double-selection variant)', () => {
        it('mirrors getOldReports: a real response with no url is a success, not an error', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getOldReportsCall.and.returnValue(of({ status: 204, body: null }) as any)

            const results = collect(effect.getOldReports2)
            actions$.next(getOldReportsAction2('person-2'))

            expect(results[0].error).toBeUndefined()
        })
    })

    describe('getSortingCards', () => {
        it('classifies by `body.data` presence, not `body.statusCode`', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getSortingOrderCall.and.returnValue(
                of({ status: 200, body: { message: 'Success', data: { financialBehaviorCardOrder: ['a'], workTalentsCardOrder: ['b'] } } }) as any
            )

            const results = collect(effect.getSortingCards)
            actions$.next(getSortingOrderAction('acc-1'))

            expect(results[0].sortingOrderResponse.body.data.financialBehaviorCardOrder).toEqual(['a'])
            expect(results[0].error).toBeUndefined()
        })

        it('a resolved response with no `data` attaches an ApiError instead of the old bare `sortingOrderResponse: undefined`', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getSortingOrderCall.and.returnValue(of({ status: 200, body: { message: 'Success' } }) as any)

            const results = collect(effect.getSortingCards)
            actions$.next(getSortingOrderAction('acc-1'))

            expect(results[0].sortingOrderResponse).toBeUndefined()
            expect(results[0].error).toBeTruthy()
        })
    })

    // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D1: classified on `body.data` presence, not
    // `body.statusCode` - that field doesn't exist on any response anymore. This effect feeds
    // both sales-report.component.ts and coaching-report.component.ts.
    describe('getSalesInsights', () => {
        it('cold cache: caches a real response with usable data and dispatches success', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getSalesInsights.and.returnValue(of({ status: 200, body: { message: 'Success', data: { insightA: 5 } } }) as any)

            const results = collect(effect.getSalesInsights)
            actions$.next(getSalesInsightsAction('person-1'))

            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results[0].response.body.data.insightA).toBe(5)
            expect(results[0].error).toBeUndefined()
        })

        it('a resolved response with no usable data is never cached, and attaches an ApiError instead of the old bare `response: undefined`', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getSalesInsights.and.returnValue(of({ status: 200, body: { errors: { collections: { error: 'No insights found' } } } }) as any)

            const results = collect(effect.getSalesInsights)
            actions$.next(getSalesInsightsAction('person-1'))

            expect(cache.setIfChanged).not.toHaveBeenCalled()
            expect(results[0].response).toBeUndefined()
            expect(results[0].error.message).toBe('No insights found')
        })
    })

    // Same D1 pattern as getSalesInsights above. This effect feeds both
    // sales-report.component.ts and coaching-report.component.ts.
    describe('getHiringData', () => {
        it('cold cache: caches a real response with usable data and dispatches success', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getHiringData.and.returnValue(
                of({ status: 200, body: { message: 'Success', data: { talents: [], rewards: [], roles: [] } } }) as any
            )

            const results = collect(effect.getHiringData)
            actions$.next(getHiringDataAction('person-1'))

            expect(cache.setIfChanged).toHaveBeenCalled()
            expect(results.length).toBe(1)
            expect(results[0].type).toBe('getHiringDataActionSuccess')
            expect(results[0].error).toBeUndefined()
        })

        it('warm cache with a changed background refresh: dispatches the cached value, then the revalidated value - the consumer relies on this firing at most once per emission to avoid duplicating its talents/rewards/roles arrays', fakeAsync(() => {
            const cachedData = { status: 200, body: { message: 'Success', data: { talents: [{ id: 1, name: 'a' }], rewards: [], roles: [] } } }
            const liveData = {
                status: 200,
                body: { message: 'Success', data: { talents: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }], rewards: [], roles: [] } },
            }
            cache.get.and.returnValue({ status: 'stale', data: cachedData })
            cache.setIfChanged.and.returnValue(true)
            // A real HTTP call is always asynchronous (never resolves in the same tick it's
            // subscribed), which is what lets the asapScheduler-deferred cached dispatch win the
            // race and arrive first. A synchronous `of(...)` mock would resolve inside the same
            // call stack as the effect's synchronous subscribe - before the asap microtask even
            // gets queued - which inverts the order this test exists to verify. `delay(1)`
            // reproduces the real "always-async" property a live network call has.
            mainUsersService.getHiringData.and.returnValue(of(liveData).pipe(delay(1)) as any)

            const results = collect(effect.getHiringData)
            actions$.next(getHiringDataAction('person-1'))
            tick(1)

            expect(results).toEqual([
                { type: 'getHiringDataActionSuccess', response: cachedData },
                { type: 'getHiringDataActionSuccess', response: liveData },
            ])
        }))

        it('cold cache: a network failure attaches an ApiError instead of the old bare `response: undefined`', () => {
            cache.get.and.returnValue({ status: 'miss' })
            mainUsersService.getHiringData.and.returnValue(throwError(() => new Error('network down')))

            const results = collect(effect.getHiringData)
            actions$.next(getHiringDataAction('person-1'))

            expect(results[0].response).toBeUndefined()
            expect(results[0].error).toBeTruthy()
        })
    })
})
