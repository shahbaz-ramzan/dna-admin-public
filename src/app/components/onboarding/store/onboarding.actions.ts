import { createAction } from '@ngrx/store'
import { ApiError } from 'src/app/service/api-error'
import {
    GET_ONBOARDING_PARTICIPANTS_LABELS,
    GET_ONBOARDING_PARTICIPANTS_LABELS_FAILURE,
    GET_ONBOARDING_USERS_LABELS,
    GET_ONBOARDING_USERS_LABELS_FAILURE,
    ON_BOARDING_COMPLETE_ACTION,
    SUCCESS_ONBOARDING_PARTICIPANT_LABELS_ACTION,
    SUCCESS_ONBOARDING_USERS_LABELS_ACTION,
    UPDATE_ACCOUNT_ACTION,
    UPDATE_ACCOUNT_ACTION_FAILURE,
    UPDATE_ACCOUNT_ACTION_SUCCESS,
    UPLOAD_LOGO_ACTION,
    UPLOAD_LOGO_ACTION_FAILURE,
    UPLOAD_LOGO_ACTION_SUCCESS,
} from './onboarding-actions-constants'

export const getOnboardingParticipantLabels = createAction(GET_ONBOARDING_PARTICIPANTS_LABELS)
export const getOnboardingUserLabels = createAction(GET_ONBOARDING_USERS_LABELS)
export const successOnboardingParticipantLabels = createAction(SUCCESS_ONBOARDING_PARTICIPANT_LABELS_ACTION, (onboardingParticipantLabelsPayload: any) => ({
    onboardingParticipantLabelsPayload,
}))
export const successOnboardingUserLabels = createAction(SUCCESS_ONBOARDING_USERS_LABELS_ACTION, (onboardingUserLabelsPayload: any) => ({
    onboardingUserLabelsPayload,
}))
export const getOnboardingParticipantLabelsFailure = createAction(GET_ONBOARDING_PARTICIPANTS_LABELS_FAILURE, (error: ApiError) => ({ error }))
export const getOnboardingUserLabelsFailure = createAction(GET_ONBOARDING_USERS_LABELS_FAILURE, (error: ApiError) => ({ error }))

export const updateAccountAction = createAction(UPDATE_ACCOUNT_ACTION, (payload: any) => ({ payload }))

export const updateAccountActionSuccess = createAction(UPDATE_ACCOUNT_ACTION_SUCCESS, (updateAccountResponse: any) => ({ updateAccountResponse }))
export const updateAccountActionFailure = createAction(UPDATE_ACCOUNT_ACTION_FAILURE, (error: ApiError) => ({ error, notify: true }))

export const onBoardingCompleteAction = createAction(ON_BOARDING_COMPLETE_ACTION, (onBoardingPayload: any) => ({ onBoardingPayload }))

export const uploadLogoAction = createAction(UPLOAD_LOGO_ACTION, (payload: any) => ({ payload }))

export const uploadLogoActionSuccess = createAction(UPLOAD_LOGO_ACTION_SUCCESS, (response: any) => ({ response }))
export const uploadLogoActionFailure = createAction(UPLOAD_LOGO_ACTION_FAILURE, (error: ApiError) => ({ error }))
