import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { Observable, ReplaySubject, of, throwError } from 'rxjs'
import { isApiError } from 'src/app/service/api-error'
import { TourService } from 'src/app/service/tour.service'
import { getActiveUserBannersAction, getActiveUserToursAction, upsertUserBannerStateAction, upsertUserTourStateAction } from './tour.actions'
import { TourEffects } from './tour.effects'

/**
 * Coverage for docs/ONBOARDING_TOUR_ERROR_HANDLING_PLAN.md Part B. All 4 API effects already used
 * real failure action creators with a correctly-named `error` field, but passed the raw thrown value
 * straight through instead of normalizing it via `ensureApiError` - so `isApiError(action.error)`
 * was always false, and `ApiErrorNotificationEffects` (which filters structurally on that check)
 * never toasted a single tour/banner failure even though every other piece looked wired correctly.
 * These tests assert the actual regression: the dispatched `error` must satisfy `isApiError(...)`.
 */
describe('TourEffects - API effects', () => {
    let actions$: ReplaySubject<any>
    let effect: TourEffects
    let tourService: jasmine.SpyObj<TourService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        tourService = jasmine.createSpyObj('TourService', [
            'getActiveUserToursCall',
            'upsertUserTourStateCall',
            'getActiveUserBannersCall',
            'upsertUserBannerStateCall',
        ])
        const router = jasmine.createSpyObj('Router', ['navigate'], { url: '/' })

        TestBed.configureTestingModule({
            providers: [TourEffects, provideMockActions(() => actions$), { provide: TourService, useValue: tourService }, { provide: Router, useValue: router }],
        })

        effect = TestBed.inject(TourEffects)
    })

    it('getActiveUserTours$: dispatches the real tours on success', () => {
        tourService.getActiveUserToursCall.and.returnValue(of({ body: [{ id: 'tour-1' }] }) as any)

        const results = collect(effect.getActiveUserTours$)
        actions$.next(getActiveUserToursAction({ userId: 'user-1' }))

        expect(results[0].tours).toEqual([{ id: 'tour-1' }])
    })

    it('getActiveUserTours$: dispatches an error that satisfies isApiError on a real transport failure - the regression this fix targets', () => {
        tourService.getActiveUserToursCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.getActiveUserTours$)
        actions$.next(getActiveUserToursAction({ userId: 'user-1' }))

        expect(results.length).toBe(1)
        expect(isApiError(results[0].error)).toBeTrue()
        expect(results[0].error.message).toBe('Server error')
    })

    it('upsertUserTourState$: dispatches an error that satisfies isApiError on a real transport failure', () => {
        tourService.upsertUserTourStateCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { message: 'Bad request' } } })))

        const results = collect(effect.upsertUserTourState$)
        actions$.next(upsertUserTourStateAction({ payload: { tourKey: 'k1' } }))

        expect(results.length).toBe(1)
        expect(isApiError(results[0].error)).toBeTrue()
        expect(results[0].error.message).toBe('Bad request')
    })

    it('getActiveUserBanners$: dispatches an error that satisfies isApiError on a real transport failure', () => {
        tourService.getActiveUserBannersCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.getActiveUserBanners$)
        actions$.next(getActiveUserBannersAction({ userId: 'user-1' }))

        expect(results.length).toBe(1)
        expect(isApiError(results[0].error)).toBeTrue()
    })

    it('upsertUserBannerState$: dispatches an error that satisfies isApiError on a real transport failure', () => {
        tourService.upsertUserBannerStateCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.upsertUserBannerState$)
        actions$.next(upsertUserBannerStateAction({ payload: { bannerKey: 'b1' } }))

        expect(results.length).toBe(1)
        expect(isApiError(results[0].error)).toBeTrue()
    })
})
