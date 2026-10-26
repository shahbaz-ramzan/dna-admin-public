import { createReducer, on } from '@ngrx/store'
import {
    getOnboardingParticipantLabels,
    getOnboardingParticipantLabelsFailure,
    getOnboardingUserLabels,
    getOnboardingUserLabelsFailure,
    onBoardingCompleteAction,
    successOnboardingParticipantLabels,
    successOnboardingUserLabels,
    updateAccountAction,
    updateAccountActionFailure,
    updateAccountActionSuccess,
    uploadLogoAction,
    uploadLogoActionFailure,
    uploadLogoActionSuccess,
} from './onboarding.actions'

export const initialState = {
    onboardingUsersLabelsPayload: undefined,
    onboardingParticipantsLabelsPayload: undefined,
    isLogoLoading: false,
    onboardingParticipantsLoading: false,
    onboardingUsersLoading: false,
    updateAccountLoading: false,
    onboardingParticipantsLabelsError: undefined as any,
    onboardingUsersLabelsError: undefined as any,
    updateAccountError: undefined as any,
    logoUploadError: undefined as any,
}

export const onboardingReducer = createReducer(
    initialState,
    on(getOnboardingParticipantLabels, (state) => ({
        ...state,
        onboardingParticipantsLoading: true,
        onboardingParticipantsLabelsError: undefined,
    })),
    on(getOnboardingUserLabels, (state) => ({
        ...state,
        onboardingUsersLoading: true,
        onboardingUsersLabelsError: undefined,
    })),
    on(successOnboardingParticipantLabels, (state, { onboardingParticipantLabelsPayload }) => ({
        ...state,
        onboardingParticipantLabelsPayload: onboardingParticipantLabelsPayload?.body,
        onboardingParticipantsLoading: false,
    })),
    on(successOnboardingUserLabels, (state, { onboardingUserLabelsPayload }) => ({
        ...state,
        onboardingUserLabelsPayload: onboardingUserLabelsPayload?.body,
        onboardingUsersLoading: false,
    })),
    on(getOnboardingParticipantLabelsFailure, (state, { error }) => ({
        ...state,
        onboardingParticipantsLoading: false,
        onboardingParticipantsLabelsError: error,
    })),
    on(getOnboardingUserLabelsFailure, (state, { error }) => ({
        ...state,
        onboardingUsersLoading: false,
        onboardingUsersLabelsError: error,
    })),
    on(updateAccountAction, (state) => ({
        ...state,
        updateAccountLoading: true,
        updateAccountError: undefined,
    })),
    on(updateAccountActionSuccess, (state, { updateAccountResponse }) => ({
        ...state,
        updateAccountResponse: updateAccountResponse?.body,
        updateAccountLoading: false,
    })),
    on(updateAccountActionFailure, (state, { error }) => ({
        ...state,
        updateAccountLoading: false,
        updateAccountError: error,
    })),
    on(onBoardingCompleteAction, (state, { onBoardingPayload }) => ({
        ...state,
        onBoardingPayload,
    })),
    on(uploadLogoAction, (state) => ({
        ...state,
        isLogoLoading: true,
        logoUploadError: undefined,
    })),
    on(uploadLogoActionSuccess, (state) => ({
        ...state,
        isLogoLoading: false,
    })),
    on(uploadLogoActionFailure, (state, { error }) => ({
        ...state,
        isLogoLoading: false,
        logoUploadError: error,
    }))
)
