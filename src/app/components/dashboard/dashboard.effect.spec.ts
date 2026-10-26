import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { Observable, ReplaySubject, of, throwError } from 'rxjs'
import { DashboardCacheStorageService } from 'src/app/service/dashboard-cache-storage.service'
import { getMarketMoodAction, getRecentActivitiesAction, getRecentActivitiesActionFailure, getRecentActivitiesActionSuccess } from './dashboard.actions'
import { DashboardEffect } from './dashboard.effect'
import { DashboardServiceService } from './dashboard-service.service'

describe('DashboardEffect - market mood (representative of the SWR pattern shared by all 4 widgets)', () => {
    let actions$: ReplaySubject<any>
    let effect: DashboardEffect
    let cache: jasmine.SpyObj<DashboardCacheStorageService>
    let dashboardService: jasmine.SpyObj<DashboardServiceService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        cache = jasmine.createSpyObj('DashboardCacheStorageService', ['get', 'set', 'setIfChanged'])
        dashboardService = jasmine.createSpyObj('DashboardServiceService', ['getMarketMoodCall'])

        TestBed.configureTestingModule({
            providers: [
                DashboardEffect,
                provideMockActions(() => actions$),
                { provide: DashboardServiceService, useValue: dashboardService },
                { provide: DashboardCacheStorageService, useValue: cache },
            ],
        })

        effect = TestBed.inject(DashboardEffect)
    })

    it('cold cache: fetches live (non-silent), dispatches success, and writes the cache', () => {
        cache.get.and.returnValue({ status: 'miss' })
        dashboardService.getMarketMoodCall.and.returnValue(of({ body: { data: 'fresh' } }) as any)

        const results = collect(effect.getMarketMoodData)
        actions$.next(getMarketMoodAction('acc-1'))

        expect(dashboardService.getMarketMoodCall).toHaveBeenCalledWith('acc-1', false)
        expect(cache.set).toHaveBeenCalledWith('marketMood:acc-1', { body: { data: 'fresh' } })
        expect(results).toEqual([
            { type: 'getMarketMoodActionSuccess', marketMoodPayload: { body: { data: 'fresh' } }, isBackgroundRefresh: false },
        ])
    })

    it('cold cache: dispatches a FAILURE action on API error instead of swallowing it', () => {
        cache.get.and.returnValue({ status: 'miss' })
        dashboardService.getMarketMoodCall.and.returnValue(throwError(() => new Error('boom')))

        const results = collect(effect.getMarketMoodData)
        actions$.next(getMarketMoodAction('acc-1'))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getMarketMoodActionFailure')
        expect(results[0].error).toBeTruthy()
    })

    it('warm cache: dispatches cached data immediately, then a silent background refresh', () => {
        cache.get.and.returnValue({ status: 'fresh', data: { body: { data: 'cached' } } })
        cache.setIfChanged.and.returnValue(true)
        dashboardService.getMarketMoodCall.and.returnValue(of({ body: { data: 'live' } }) as any)

        const results = collect(effect.getMarketMoodData)
        actions$.next(getMarketMoodAction('acc-1'))

        expect(dashboardService.getMarketMoodCall).toHaveBeenCalledWith('acc-1', true)
        expect(results).toEqual([
            { type: 'getMarketMoodActionSuccess', marketMoodPayload: { body: { data: 'cached' } }, isBackgroundRefresh: false },
            { type: 'getMarketMoodActionSuccess', marketMoodPayload: { body: { data: 'live' } }, isBackgroundRefresh: true },
        ])
    })

    it('warm cache: always re-dispatches the cached value on every action, so the loading flag it set is always reset', () => {
        // Regression test: an earlier version skipped this dispatch when the store "already had"
        // the cached value, as a rebuild-avoidance optimization. That broke navigating away from
        // and back to the dashboard - the *_ACTION dispatch on remount always flips `loading` to
        // true in the reducer, and if this cached dispatch (or a background refresh) doesn't
        // fire, nothing ever resets it, producing a permanently spinning loader. This must always
        // fire on every incoming action regardless of whether the store already has this value.
        cache.get.and.returnValue({ status: 'fresh', data: { body: { data: 'cached' } } })
        cache.setIfChanged.and.returnValue(false)
        dashboardService.getMarketMoodCall.and.returnValue(of({ body: { data: 'cached' } }) as any)

        const results = collect(effect.getMarketMoodData)
        actions$.next(getMarketMoodAction('acc-1'))
        actions$.next(getMarketMoodAction('acc-1'))

        expect(results).toEqual([
            { type: 'getMarketMoodActionSuccess', marketMoodPayload: { body: { data: 'cached' } }, isBackgroundRefresh: false },
            { type: 'getMarketMoodActionSuccess', marketMoodPayload: { body: { data: 'cached' } }, isBackgroundRefresh: false },
        ])
    })

    it('warm cache: filters out the background refresh dispatch when the revalidated data is unchanged', () => {
        cache.get.and.returnValue({ status: 'stale', data: { body: { data: 'cached' } } })
        cache.setIfChanged.and.returnValue(false)
        dashboardService.getMarketMoodCall.and.returnValue(of({ body: { data: 'cached' } }) as any)

        const results = collect(effect.getMarketMoodData)
        actions$.next(getMarketMoodAction('acc-1'))

        expect(results).toEqual([{ type: 'getMarketMoodActionSuccess', marketMoodPayload: { body: { data: 'cached' } }, isBackgroundRefresh: false }])
    })

    it('warm cache: swallows a background refresh error - no FAILURE dispatched, cached data stands', () => {
        cache.get.and.returnValue({ status: 'fresh', data: { body: { data: 'cached' } } })
        dashboardService.getMarketMoodCall.and.returnValue(throwError(() => new Error('network down')))

        const results = collect(effect.getMarketMoodData)
        actions$.next(getMarketMoodAction('acc-1'))

        expect(results).toEqual([{ type: 'getMarketMoodActionSuccess', marketMoodPayload: { body: { data: 'cached' } }, isBackgroundRefresh: false }])
    })
})

describe('DashboardEffect - recent activities dispatches the real action creators', () => {
    // Regression test: this effect used to dispatch hand-typed `{ type: 'getRecentActivitiesAction...' }`
    // objects whose type string didn't match GET_RECENT_ACTIVITIES_SUCCESS/_FAILURE
    // ('getRecentActivitiesSuccess'/'getRecentActivitiesFailure', no "Action" in the middle) - so
    // neither success nor failure ever reached the reducer's `on()` handlers. Dispatching the
    // imported action creators directly (as done now) makes that class of bug a compile-time
    // impossibility instead of a silent runtime mismatch.
    let actions$: ReplaySubject<any>
    let effect: DashboardEffect
    let cache: jasmine.SpyObj<DashboardCacheStorageService>
    let dashboardService: jasmine.SpyObj<DashboardServiceService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        cache = jasmine.createSpyObj('DashboardCacheStorageService', ['get', 'set', 'setIfChanged'])
        dashboardService = jasmine.createSpyObj('DashboardServiceService', ['getRecentActivitiesCall'])

        TestBed.configureTestingModule({
            providers: [
                DashboardEffect,
                provideMockActions(() => actions$),
                { provide: DashboardServiceService, useValue: dashboardService },
                { provide: DashboardCacheStorageService, useValue: cache },
            ],
        })

        effect = TestBed.inject(DashboardEffect)
    })

    it('dispatches a success action whose type matches getRecentActivitiesActionSuccess.type exactly', () => {
        cache.get.and.returnValue({ status: 'miss' })
        dashboardService.getRecentActivitiesCall.and.returnValue(of({ body: { data: 'fresh' } }) as any)

        const results = collect(effect.getRecentActivities)
        actions$.next(getRecentActivitiesAction('acc-1'))

        expect(results[0].type).toBe(getRecentActivitiesActionSuccess({} as any, false).type)
    })

    it('dispatches a failure action whose type matches getRecentActivitiesActionFailure.type exactly', () => {
        cache.get.and.returnValue({ status: 'miss' })
        dashboardService.getRecentActivitiesCall.and.returnValue(throwError(() => new Error('boom')))

        const results = collect(effect.getRecentActivities)
        actions$.next(getRecentActivitiesAction('acc-1'))

        expect(results[0].type).toBe(getRecentActivitiesActionFailure(undefined).type)
    })
})
