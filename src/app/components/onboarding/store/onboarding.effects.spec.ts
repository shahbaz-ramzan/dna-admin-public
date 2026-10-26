import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { Observable, ReplaySubject, of, throwError } from 'rxjs'
import { OnboardingService } from 'src/app/service/onboarding.service'
import { getOnboardingParticipantLabels, getOnboardingUserLabels, updateAccountAction, uploadLogoAction } from './onboarding.actions'
import { OnboardingEffects } from './onboarding.effects'

/**
 * First coverage for this file - see docs/ONBOARDING_TOUR_ERROR_HANDLING_PLAN.md Part A. All 4
 * effects used `catchError(() => EMPTY)`, so a real transport failure dispatched nothing at all and
 * left the corresponding loading flag stuck `true` forever (on-boarding.component.html:97's spinner
 * depends on exactly these flags). These tests cover the fixed effects: success still dispatches the
 * real response, and failure now dispatches a normalized `ApiError` via the new failure creators.
 */
describe('OnboardingEffects', () => {
    let actions$: ReplaySubject<any>
    let effect: OnboardingEffects
    let onboardingService: jasmine.SpyObj<OnboardingService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        onboardingService = jasmine.createSpyObj('OnboardingService', [
            'getOnboardingParticipantLabelsCall',
            'getOnboardingUserLabelsCall',
            'updateAccountDetails',
            'uploadAccountLogo',
        ])

        TestBed.configureTestingModule({
            providers: [OnboardingEffects, provideMockActions(() => actions$), { provide: OnboardingService, useValue: onboardingService }],
        })

        effect = TestBed.inject(OnboardingEffects)
    })

    it('onboardingUserLabelsData: dispatches the real response on success', () => {
        const response = { body: { data: [{ id: 1 }] } }
        onboardingService.getOnboardingParticipantLabelsCall.and.returnValue(of(response) as any)

        const results = collect(effect.onboardingUserLabelsData)
        actions$.next(getOnboardingParticipantLabels())

        expect(results[0].type).toBe('successOnboardingParticipantLabels')
        expect(results[0].onboardingParticipantLabelsPayload).toEqual(response)
    })

    it('onboardingUserLabelsData: dispatches a normalized ApiError instead of nothing on a real transport failure', () => {
        onboardingService.getOnboardingParticipantLabelsCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.onboardingUserLabelsData)
        actions$.next(getOnboardingParticipantLabels())

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getOnboardingParticipantLabelsFailure')
        expect(results[0].error.message).toBe('Server error')
    })

    it('onboardingParticipantLabelsData: dispatches a normalized ApiError on a real transport failure', () => {
        onboardingService.getOnboardingUserLabelsCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { message: 'Bad request' } } })))

        const results = collect(effect.onboardingParticipantLabelsData)
        actions$.next(getOnboardingUserLabels())

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getOnboardingUserLabelsFailure')
        expect(results[0].error.message).toBe('Bad request')
    })

    it('updateAccountDetails: dispatches the real response on success', () => {
        const response = { body: { data: { accountId: 1 } } }
        onboardingService.updateAccountDetails.and.returnValue(of(response) as any)

        const results = collect(effect.updateAccountDetails)
        actions$.next(updateAccountAction({ accountId: 1 }))

        expect(results[0].type).toBe('updateAccountActionSuccess')
        expect(results[0].updateAccountResponse).toEqual(response)
    })

    it('updateAccountDetails: dispatches a normalized ApiError instead of nothing on a real transport failure', () => {
        onboardingService.updateAccountDetails.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.updateAccountDetails)
        actions$.next(updateAccountAction({ accountId: 1 }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('updateAccountActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })

    it('uploadLogo: dispatches a normalized ApiError instead of nothing on a real transport failure', () => {
        onboardingService.uploadAccountLogo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.uploadLogo)
        actions$.next(uploadLogoAction({ file: 'logo.png' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('uploadOnBoardingLogoActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })
})
