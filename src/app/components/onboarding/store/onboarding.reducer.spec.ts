import {
    getOnboardingParticipantLabels,
    getOnboardingParticipantLabelsFailure,
    getOnboardingUserLabels,
    getOnboardingUserLabelsFailure,
    updateAccountAction,
    updateAccountActionFailure,
    updateAccountActionSuccess,
    uploadLogoAction,
    uploadLogoActionFailure,
} from './onboarding.actions'
import { initialState, onboardingReducer } from './onboarding.reducer'

/**
 * Every one of these 4 loading flags used to be reset only by its success action - a real transport
 * failure (`catchError(() => EMPTY)` in onboarding.effects.ts) left it stuck `true` forever, with
 * on-boarding.component.html:97's spinner depending on exactly these flags. These tests cover the
 * new failure handlers added alongside the effects fix - see
 * docs/ONBOARDING_TOUR_ERROR_HANDLING_PLAN.md Part A.
 */
describe('onboardingReducer - failure handling', () => {
    const error = { status: 500, message: 'Server error', raw: undefined } as any

    it('getOnboardingParticipantLabelsFailure resets onboardingParticipantsLoading and records the error', () => {
        const state = { ...initialState, onboardingParticipantsLoading: true }

        const result = onboardingReducer(state, getOnboardingParticipantLabelsFailure(error))

        expect(result.onboardingParticipantsLoading).toBe(false)
        expect(result.onboardingParticipantsLabelsError).toEqual(error)
    })

    it('getOnboardingParticipantLabels clears any previous error on a fresh dispatch', () => {
        const state = { ...initialState, onboardingParticipantsLabelsError: error }

        const result = onboardingReducer(state, getOnboardingParticipantLabels())

        expect(result.onboardingParticipantsLoading).toBe(true)
        expect(result.onboardingParticipantsLabelsError).toBeUndefined()
    })

    it('getOnboardingUserLabelsFailure resets onboardingUsersLoading and records the error', () => {
        const state = { ...initialState, onboardingUsersLoading: true }

        const result = onboardingReducer(state, getOnboardingUserLabelsFailure(error))

        expect(result.onboardingUsersLoading).toBe(false)
        expect(result.onboardingUsersLabelsError).toEqual(error)
    })

    it('getOnboardingUserLabels clears any previous error on a fresh dispatch', () => {
        const state = { ...initialState, onboardingUsersLabelsError: error }

        const result = onboardingReducer(state, getOnboardingUserLabels())

        expect(result.onboardingUsersLoading).toBe(true)
        expect(result.onboardingUsersLabelsError).toBeUndefined()
    })

    it('updateAccountActionFailure resets updateAccountLoading and records the error', () => {
        const state = { ...initialState, updateAccountLoading: true }

        const result = onboardingReducer(state, updateAccountActionFailure(error))

        expect(result.updateAccountLoading).toBe(false)
        expect(result.updateAccountError).toEqual(error)
    })

    it('updateAccountAction clears any previous error on a fresh dispatch', () => {
        const state = { ...initialState, updateAccountError: error }

        const result = onboardingReducer(state, updateAccountAction({ accountId: 1 }))

        expect(result.updateAccountLoading).toBe(true)
        expect(result.updateAccountError).toBeUndefined()
    })

    it('updateAccountActionSuccess resets updateAccountLoading without touching the error field', () => {
        const state = { ...initialState, updateAccountLoading: true }

        const result = onboardingReducer(state, updateAccountActionSuccess({ body: { data: { accountId: 1 } } }))

        expect(result.updateAccountLoading).toBe(false)
    })

    it('uploadLogoActionFailure resets isLogoLoading and records the error', () => {
        const state = { ...initialState, isLogoLoading: true }

        const result = onboardingReducer(state, uploadLogoActionFailure(error))

        expect(result.isLogoLoading).toBe(false)
        expect(result.logoUploadError).toEqual(error)
    })

    it('uploadLogoAction clears any previous error on a fresh dispatch', () => {
        const state = { ...initialState, logoUploadError: error }

        const result = onboardingReducer(state, uploadLogoAction({ file: 'logo.png' }))

        expect(result.isLogoLoading).toBe(true)
        expect(result.logoUploadError).toBeUndefined()
    })
})
