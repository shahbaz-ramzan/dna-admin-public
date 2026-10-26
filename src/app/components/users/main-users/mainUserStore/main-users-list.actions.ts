import { createAction } from '@ngrx/store'
import { ApiError } from 'src/app/service/api-error'
import {
    DIGITAL_SCAN_ACCESS_DATA_ACTION,
    DIGITAL_SCAN_ACCESS_DATA_ACTION_FAILURE,
    DIGITAL_SCAN_ACCESS_DATA_ACTION_SUCCESS,
    DONT_SET_PARTICIPANT_FACILITATOR_ACTION,
    DONT_UPDATE_PARTICIPANT_PROFILE_PICTURE_ACTION,
    EDIT_PARTICIPANT_FACILITATOR_ACTION,
    EDIT_PARTICIPANT_FACILITATOR_FAILURE_ACTION,
    EDIT_PARTICIPANT_FACILITATOR_SUCCESS_ACTION,
    EDIT_PARTICIPANT_PROFILE_ACTION,
    EDIT_PARTICIPANT_PROFILE_FAILURE_ACTION,
    EDIT_PARTICIPANT_PROFILE_PICTURE_ACTION,
    EDIT_PARTICIPANT_PROFILE_PICTURE_FAILURE_ACTION,
    EDIT_PARTICIPANT_PROFILE_PICTURE_SUCCESS_ACTION,
    EDIT_PARTICIPANT_PROFILE_SUCCESS_ACTION,
    EDIT_PARTICIPANT_TAGS_ACTION,
    EDIT_PARTICIPANT_TAGS_FAILURE_ACTION,
    EDIT_PARTICIPANT_TAGS_SUCCESS_ACTION,
    EXPORT_USERS_LIST_ACTION,
    EXPORT_USERS_LIST_ACTION_FAILURE,
    GET_CREDIT_ID_ACTION,
    GET_CREDIT_ID_ACTION_FAILURE,
    GET_CREDIT_ID_ACTION_SUCCESS,
    GET_DARK_MODE,
    GET_DISCOVERY_STATUS_ACTION,
    GET_DISCOVERY_STATUS_ACTION_FAILURE,
    GET_DISCOVERY_STATUS_ACTION_SUCCESS,
    GET_UNIQUE_STYLE_ACTION,
    GET_UNIQUE_STYLE_ACTION_FAILURE,
    GET_UNIQUE_STYLE_ACTION_SUCCESS,
    DISCOVERY_STATUS_RESOLVED_ACTION,
    GET_FACILITATORS_ACTION,
    GET_FACILITATORS_ACTION_FAILURE,
    GET_FACILITATORS_SUCCESS_ACTION,
    GET_SELF_REGISTRATION_DETAIL_ACTION,
    GET_SELF_REGISTRATION_DETAIL_ACTION_FAILURE,
    GET_SELF_REGISTRATION_DETAIL_ACTION_SUCCESS,
    GET_SELF_REGISTRATION_ID_ACTION,
    GET_SELF_REGISTRATION_ID_ACTION_FAILURE,
    GET_SELF_REGISTRATION_ID_ACTION_SUCCESSS,
    GET_TAGS_ACTION,
    GET_TAGS_ACTION_FAILURE,
    GET_TAGS_SUCCESS_ACTION,
    GET_USERS_LIST_ACTION,
    GET_USERS_LIST_ACTION_FAILURE,
    RESET_USERS_LIST_ACTION,
    SAVE_USER_TO_ACCOUNT_ACTION,
    SAVE_USER_TO_ACCOUNT_ACTION_FAILURE,
    SAVE_USER_TO_ACCOUNT_ACTION_SUCCESS,
    SEARCH_MULTIPLE_ACCOUNT_ACTION,
    SEARCH_MULTIPLE_ACCOUNT_ACTION_FAILURE,
    SEARCH_MULTIPLE_ACCOUNT_ACTION_SUCCESS,
    SUCCESS_EXPORT_USERS_LIST_ACTION,
    SUCCESS_GET_USERS_LIST_ACTION,
    SUCCESS_UPDATE_COLOR_ACTION,
    UPDATE_COLOR_ACTION,
    UPDATE_COLOR_ACTION_FAILURE,
    UPDATE_TAGS_ACTION,
} from './main-users-actions-constants'

// Users-list actions (per USERS_PAGE_OPTIMIZATION_PLAN.md §4)

export const getDarkModeStatus = createAction(GET_DARK_MODE, (darkModePayload: any) => ({ darkModePayload }))
export const UpdateColorAction = createAction(UPDATE_COLOR_ACTION, (accountColorPayload: any) => ({
    accountColorPayload,
}))

export const UpdateColorSuccessAction = createAction(SUCCESS_UPDATE_COLOR_ACTION, (accountColorPayload: any) => ({
    accountColorPayload,
}))

export const UpdateColorActionFailure = createAction(UPDATE_COLOR_ACTION_FAILURE, (error: ApiError) => ({ error }))

export const GetUsersListAction = createAction(GET_USERS_LIST_ACTION, (getUsersPayload: any) => ({
    getUsersPayload,
}))

export const GetUsersListActionSuccess = createAction(SUCCESS_GET_USERS_LIST_ACTION, (usersListResponse: any) => ({
    usersListResponse,
}))

export const GetUsersListActionFailure = createAction(GET_USERS_LIST_ACTION_FAILURE, (error: ApiError) => ({ error }))

// Dispatched once on a fresh mount of MainUsersComponent (i.e. when navigating between the
// /users and /myTeam routes, which share this component and this same store slice) so the
// newly-mounted page doesn't briefly render the other page's leftover list. Deliberately
// separate from GetUsersListAction's own reducer case, which intentionally does NOT clear
// usersListResponse on every fetch (see main-users-list.reducer.ts) so same-page actions like
// delete/filter/search/paginate keep showing existing rows instead of flashing blank.
export const ResetUsersListAction = createAction(RESET_USERS_LIST_ACTION)

export const exportUsersListAction = createAction(EXPORT_USERS_LIST_ACTION, (exportUsersPayload: any) => ({
    exportUsersPayload,
}))

export const exportUsersListActionSuccess = createAction(SUCCESS_EXPORT_USERS_LIST_ACTION, (exportedUsersListResponse: any) => ({
    exportedUsersListResponse,
}))

export const exportUsersListActionFailure = createAction(EXPORT_USERS_LIST_ACTION_FAILURE, (error: ApiError) => ({ error }))

export const GetTagsAction = createAction(GET_TAGS_ACTION, (body: any) => body)

export const GetTagsActionSuccess = createAction(GET_TAGS_SUCCESS_ACTION, (tagsResponse: any) => ({
    tagsResponse,
}))

export const GetTagsActionFailure = createAction(GET_TAGS_ACTION_FAILURE, (error: ApiError) => ({ error }))

export const updateTagsAction = createAction(UPDATE_TAGS_ACTION, (tagsResponse: any) => ({
    tagsResponse,
}))

export const getFacilitatorAction = createAction(GET_FACILITATORS_ACTION, (accountId: any) => ({ accountId }))
export const getFaciliatorSuccessAction = createAction(GET_FACILITATORS_SUCCESS_ACTION, (response) => ({ response }))
export const getFacilitatorActionFailure = createAction(GET_FACILITATORS_ACTION_FAILURE, (error: ApiError) => ({ error }))

export const saveUserToAccountAction = createAction(SAVE_USER_TO_ACCOUNT_ACTION, (data: any) => ({ data }))
// removedPersonId is only set when the effect identified this as a known single-participant
// account removal (see main-users-list.effects.ts) - the reducer uses it to splice that row out
// of usersListResponse immediately, without a re-fetch.
export const saveUserToAccountActionSuccess = createAction(SAVE_USER_TO_ACCOUNT_ACTION_SUCCESS, (response, removedPersonId?: string) => ({
    response,
    removedPersonId,
}))
export const saveUserToAccountActionFailure = createAction(SAVE_USER_TO_ACCOUNT_ACTION_FAILURE, (error: ApiError) => ({ error, notify: true }))
export const editParticipantProfileAction = createAction(EDIT_PARTICIPANT_PROFILE_ACTION, (data) => ({ data }))

export const editParticipantProfileSuccessAction = createAction(EDIT_PARTICIPANT_PROFILE_SUCCESS_ACTION, (response) => ({ response }))
export const editParticipantProfileFailureAction = createAction(EDIT_PARTICIPANT_PROFILE_FAILURE_ACTION, (error: ApiError) => ({ error, notify: true }))

export const editParticipantProfilePictureAction = createAction(EDIT_PARTICIPANT_PROFILE_PICTURE_ACTION, (data) => ({ data }))
export const editParticipantProfilePictureSuccessAction = createAction(EDIT_PARTICIPANT_PROFILE_PICTURE_SUCCESS_ACTION, (response) => ({ response }))
export const editParticipantProfilePictureFailureAction = createAction(EDIT_PARTICIPANT_PROFILE_PICTURE_FAILURE_ACTION, (error: ApiError) => ({
    error,
    notify: true,
}))
export const dontUpdateParticipantProfilePictureAction = createAction(DONT_UPDATE_PARTICIPANT_PROFILE_PICTURE_ACTION)

export const editParticipantTagsAction = createAction(EDIT_PARTICIPANT_TAGS_ACTION, (data) => ({ data }))

export const editParticipantTagsSuccessAction = createAction(EDIT_PARTICIPANT_TAGS_SUCCESS_ACTION, (response) => ({ response }))
export const editParticipantTagsFailureAction = createAction(EDIT_PARTICIPANT_TAGS_FAILURE_ACTION, (error: ApiError) => ({ error, notify: true }))

export const editParticipantFacilitatorAction = createAction(EDIT_PARTICIPANT_FACILITATOR_ACTION, (data) => ({ data }))

export const editParticipantFacilitatorSuccessAction = createAction(EDIT_PARTICIPANT_FACILITATOR_SUCCESS_ACTION, (response) => ({ response }))
export const editParticipantFacilitatorFailureAction = createAction(EDIT_PARTICIPANT_FACILITATOR_FAILURE_ACTION, (error: ApiError) => ({
    error,
    notify: true,
}))
export const dontSetParticipantFaciliatorAction = createAction(DONT_SET_PARTICIPANT_FACILITATOR_ACTION)

export const searchMultipleAccountsAction = createAction(SEARCH_MULTIPLE_ACCOUNT_ACTION, (searchUsersPayload: any) => ({
    searchUsersPayload,
}))

export const searchMultipleAccountsActionSuccess = createAction(SEARCH_MULTIPLE_ACCOUNT_ACTION_SUCCESS, (searchListResponse: any) => ({
    searchListResponse,
}))

export const searchMultipleAccountsActionFailure = createAction(SEARCH_MULTIPLE_ACCOUNT_ACTION_FAILURE, (error: ApiError) => ({ error }))

export const getSelftRegistrationIdAction = createAction(GET_SELF_REGISTRATION_ID_ACTION, (personId: any) => ({ personId }))

export const getSelftRegistrationIdActionSuccess = createAction(GET_SELF_REGISTRATION_ID_ACTION_SUCCESSS, (response: any) => response)
export const getSelftRegistrationIdActionFailure = createAction(GET_SELF_REGISTRATION_ID_ACTION_FAILURE, (error: ApiError) => ({ error, notify: false }))

export const getSelfRegistrationDetailAction = createAction(GET_SELF_REGISTRATION_DETAIL_ACTION, (payload: any) => payload)

export const getSelfRegistrationDetailActionSuccess = createAction(GET_SELF_REGISTRATION_DETAIL_ACTION_SUCCESS, (response: any) => response)
export const getSelfRegistrationDetailActionFailure = createAction(GET_SELF_REGISTRATION_DETAIL_ACTION_FAILURE, (error: ApiError) => ({ error, notify: false }))

export const getCreditIdAction = createAction(GET_CREDIT_ID_ACTION, (payload: any) => ({ payload }))

export const getCreditIdActionSuccess = createAction(GET_CREDIT_ID_ACTION_SUCCESS, (creditIdResponse: any) => ({ creditIdResponse }))

export const getCreditIdActionFailure = createAction(GET_CREDIT_ID_ACTION_FAILURE, (error: ApiError) => ({ error }))

export const getDiscoveryStatusAction = createAction(GET_DISCOVERY_STATUS_ACTION, (payload: any) => ({ payload }))

export const getDiscoveryStatusActionSuccess = createAction(GET_DISCOVERY_STATUS_ACTION_SUCCESS, (discoveryStatusResponse: any) => ({
    discoveryStatusResponse,
}))
export const getDiscoveryStatusActionFailure = createAction(GET_DISCOVERY_STATUS_ACTION_FAILURE, (error: ApiError) => ({ error, notify: false }))

// personId is echoed on success/failure so listeners can ignore a response for a participant
// other than the one they're currently showing.
export const getUniqueStyleAction = createAction(GET_UNIQUE_STYLE_ACTION, (payload: any) => ({ payload }))

export const getUniqueStyleActionSuccess = createAction(GET_UNIQUE_STYLE_ACTION_SUCCESS, (uniqueStyleResponse: any, personId: string) => ({
    uniqueStyleResponse,
    personId,
}))
export const getUniqueStyleActionFailure = createAction(GET_UNIQUE_STYLE_ACTION_FAILURE, (error: ApiError, personId: string) => ({
    error,
    personId,
    notify: false,
}))

// The one outcome components act on: whether `personId` has completed Discovery. Emitted by
// DiscoveryStatusEffects - straight from the store when the participant is already known to be
// complete (no API call), otherwise from the GetUniqueStyle response (a failed call resolves as
// completed, so a flaky endpoint never blocks a participant who may well have data).
export const discoveryStatusResolvedAction = createAction(DISCOVERY_STATUS_RESOLVED_ACTION, (personId: string, completed: boolean) => ({
    personId,
    completed,
}))

export const getDigitalScanAccessDataAction = createAction(DIGITAL_SCAN_ACCESS_DATA_ACTION)
export const getDigitalScanAccessDataActionSuccess = createAction(DIGITAL_SCAN_ACCESS_DATA_ACTION_SUCCESS, (response: any) => ({ response }))
export const getDigitalScanAccessDataActionFailure = createAction(DIGITAL_SCAN_ACCESS_DATA_ACTION_FAILURE, (error: ApiError) => ({ error, notify: false }))
