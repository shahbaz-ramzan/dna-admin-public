import { createAction } from '@ngrx/store'
import { ApiError } from 'src/app/service/api-error'

import {
    DELETE_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    EDIT_ACCOUNT_DETAILS_FAILURE_ACTION,
    EDIT_PROFILE_FAILURE_ACTION,
    EDIT_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    FAILURE_DELETE_TAG_ACTION,
    FAILURE_DELETE_USER_ROLE_ACTION,
    FAILURE_UPDATE_USER_ROLE_ACTION,
    FAILURE_UPLOAD_ACCOUNT_LOGO_ACTION,
    FAILURE_UPLOAD_PROFILE_PICTURE_ACTION,
    GRANT_TOP_LEVEL_ADMIN_ACTION_FAILURE,
    RESET_PASSWORD_ACTION_FAILURE,
    SAVE_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    SAVE_SUBSCRIPTION_COMPONENT_ACTION_FAILURE,
    SAVE_USER_TO_ACCOUNT_ACTION_FAILURE,
    UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_FAILURE,
    UPDATE_CUSTOM_REPORT_NAME_ACTION_FAILURE,
    UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_FAILURE,
    UPDATE_DEFAULT_TOGGLE_ACTION_FAILURE,
    UPDATE_DYNAMIC_WELCOME_ACTION_FAILURE,
    UPSERT_LEGAL_TEXT_ACTION_FAILURE,
    UPSERT_TAG_ACTION_FAILURE,
    ZAPIER_SYNC_ALL_ACTION_FAILURE,
    GET_LEGAL_TEXT_ACTION,
    SUCCESS_LEGAL_TEXT_ACTION,
    GET_LANGUAGE_ACTION,
    SUCCESS_LANGUAGE_ACTION,
    GET_SELF_REGISTRATION_LINK_ACTION,
    SUCCESS_SELF_REGISTRATION_LINK_ACTION,
    DELETE_SELF_REGISTRATION_LINK_ACTION,
    GET_MANAGE_TAGS_ACTION,
    SUCCESS_MANAGE_TAGS_ACTION,
    GET_PARTICIPANT_LABELS_ACTION,
    SUCCESS_PARTICIPANT_LABELS_ACTION,
    GET_USER_LABELS_ACTION,
    SUCCESS_USER_LABELS_ACTION,
    SUCCESS_UPLOAD_PROFILE_PICTURE_ACTION,
    UPLOAD_PROFILE_PICTURE_ACTION,
    UPLOAD_ACCOUNT_LOGO_ACTION,
    SUCCESS_UPLOAD_ACCOUNT_LOGO_ACTION,
    GET_SUBSCRIPTION_ACCOUNT_ACTION,
    GET_SUBSCRIPTION_URL_DETAILS_ACTION,
    SUCCESS_SUBSCRIPTION_ACCOUNT_ACTION,
    SUCCESS_SUBSCRIPTION_URL_DETAILS_ACTION,
    GET_PROFILE_PICTURE_ACTION,
    SUCCESS_PROFILE_PICTURE_ACTION,
    UPSERT_TAG_ACTION,
    DELETE_TAG_ACTION,
    SUCCESS_DELETE_TAG_ACTION,
    GET_FACILITATORS_ACTION,
    GET_FACILITATORS_SUCCESS_ACTION,
    SAVE_SELF_REGISTRATION_LINK_ACTION,
    SAVE_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
    DELETE_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
    SET_EDIT_REGISTRATION_LINK_ACTION,
    SET_EDIT_REGISTRATION_LINK_SUCCESS_ACTION,
    EDIT_SELF_REGISTRATION_LINK_ACTION,
    EDIT_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
    CANCEL_SELF_REGISTRATION_LINK_MODIFICATION_ACTION,
    EDIT_ACCOUNT_DETAILS_ACTION,
    EDIT_ACCOUNT_DETAILS_SUCCESS_ACTION,
    EDIT_PROFILE_ACTION,
    EDIT_PROFILE_SUCCESS_ACTION,
    UPDATE_USER_ROLE_ACTION,
    SUCCESS_UPDATE_USER_ROLE_ACTION,
    SUCCESS_USERS_ACTION,
    SUCCESS_USER_ROLES_ACTION,
    GET_USERS_ACTION,
    GET_USER_ROLES_ACTION,
    FAILURE_USER_ROLES_ACTION,
    GET_SUBSCRIPTION_NAME_ACTION,
    GET_SUBSCRIPTION_NAME_SUCCESS_ACTION,
    GET_SUBSCRIPTION_NAME_FAILURE_ACTION,
    GET_USERS_LIST_ACTION,
    SUCCESS_GET_USERS_LIST_ACTION,
    FAILURE_GET_USERS_LIST_ACTION,
    INVITE_NEW_USER_ACTION,
    INVITE_NEW_USER_SUCCESS_ACTION,
    GET_ACCOUNT_SUBSCRIPTION_DETAILS_ACTION,
    GET_ACCOUNT_SUBSCRIPTION_DETAILS_SUCCESS_ACTION,
    GET_ACCOUNT_SUBSCRIPTION_DETAILS_FAILURE_ACTION,
    UPSERT_LEGAL_TEXT_ACTION,
    UPSERT_LEGAL_TEXT_ACTION_SUCCESS,
    UPSERT_TAG_ACTION_SUCCESS,
    SAVE_SUBSCRIPTION_COMPONENT_ACTION_SUCCESS,
    SAVE_SUBSCRIPTION_COMPONENT_ACTION,
    GET_CUSTOM_REPORTS,
    GET_CUSTOM_REPORTS_SUCCESS,
    UPDATE_CUSTOM_REPORT_NAME_ACTION,
    UPDATE_CUSTOM_REPORT_NAME_ACTION_SUCCESS,
    GET_USER_ROLE_ACTION,
    TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION,
    TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION_SUCCESS,
    GET_USER_ROLE_ACTION_SUCCESS,
    DELETE_USER_ROLE_ACTION,
    SUCCESS_DELETE_USER_ROLE_ACTION,
    SAVE_USER_TO_ACCOUNT_ACTION,
    SAVE_USER_TO_ACCOUNT_ACTION_SUCCESS,
    GET_ALL_ACCOUNTS_ACTION,
    GET_ALL_ACCOUNTS_ACTION_SUCCESS,
    GET_PARTICIPANT_ACCOUNTS_ACTION,
    GET_PARTICIPANT_ACCOUNTS_ACTION_SUCCESS,
    GET_COMPLETION_EMAIL_SETTINGS_ACCTION,
    GET_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS,
    UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS,
    UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION,
    UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION,
    UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS,
    GET_CUSTOMIZE_EMAIL_TEXT_ACTION,
    GET_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS,
    GRANT_TOP_LEVEL_ADMIN_ACTION,
    GRANT_TOP_LEVEL_ADMIN_ACTION_SUCCESS,
    RESET_PASSWORD_ACTION,
    RESET_PASSWORD_ACTION_SUCCESS,
    ZAPIER_SYNC_ALL_ACTION,
    ZAPIER_SYNC_ALL_ACTION_SUCCESS,
    CHECK_ZAPIER_BULK_STATUS_ACTION,
    CHECK_ZAPIER_BULK_STATUS_ACTION_SUCCESS,
    UPDATE_DEFAULT_TOGGLE_ACTION,
    UPDATE_DEFAULT_TOGGLE_ACTION_SUCCESS,
    GET_DEFAULT_TOGGLE_ACTION,
    GET_DEFAULT_TOGGLE_ACTION_SUCCESS,
    GET_DYNAMIC_WELCOME_ACTION,
    GET_DYNAMIC_WELCOME_ACTION_SUCCESS,
    UPDATE_DYNAMIC_WELCOME_ACTION,
    UPDATE_DYNAMIC_WELCOME_ACTION_SUCCESS,
} from './settings-actions-constants'

export const uploadAccountLogo = createAction(UPLOAD_ACCOUNT_LOGO_ACTION, (params: any) => ({ params }))
export const SuccessUploadAccountLogo = createAction(SUCCESS_UPLOAD_ACCOUNT_LOGO_ACTION, (accountLogoPayload: any) => ({ accountLogoPayload }))

export const getSubscriptionAccountAction = createAction(GET_SUBSCRIPTION_ACCOUNT_ACTION, (accountId: any) => ({ accountId }))
export const successSubscriptionAccountAction = createAction(SUCCESS_SUBSCRIPTION_ACCOUNT_ACTION, (subscriptionAccountPayload: any) => ({
    subscriptionAccountPayload,
}))
export const getSubscriptionUrlDetailsAction = createAction(GET_SUBSCRIPTION_URL_DETAILS_ACTION, (subscriptionId: any, subscriptionAccountPayload: any) => ({
    subscriptionId,
    subscriptionAccountPayload,
}))
export const successSubscriptionUrlDetailsAction = createAction(SUCCESS_SUBSCRIPTION_URL_DETAILS_ACTION, (subscriptionUrlDetailsPayload: any) => ({
    subscriptionUrlDetailsPayload,
}))

export const getProfilePictureAction = createAction(GET_PROFILE_PICTURE_ACTION, (accountId: any) => ({ accountId }))

export const getCustomReportNamesAction = createAction(GET_CUSTOM_REPORTS, (accountId: any) => ({ accountId }))

export const getCustomReportsSuccessAction = createAction(GET_CUSTOM_REPORTS_SUCCESS, (customReportNamesResponse: any) => ({ customReportNamesResponse }))
export const successProfilePictureAction = createAction(SUCCESS_PROFILE_PICTURE_ACTION, (profilePicturePayload: any) => ({ profilePicturePayload }))

export const uploadProfilePicture = createAction(UPLOAD_PROFILE_PICTURE_ACTION, (params: any) => ({ params }))
export const SuccessUploadProfilePicture = createAction(SUCCESS_UPLOAD_PROFILE_PICTURE_ACTION, (uploadProfilePayload: any) => ({ uploadProfilePayload }))

export const getUserLabels = createAction(GET_USER_LABELS_ACTION)
export const getUserLabelsSuccess = createAction(SUCCESS_USER_LABELS_ACTION, (userLabelsPayload: any) => ({ userLabelsPayload }))

export const getParticipantLabels = createAction(GET_PARTICIPANT_LABELS_ACTION)
export const getParticipantLabelsSuccess = createAction(SUCCESS_PARTICIPANT_LABELS_ACTION, (participantLabelsPayload: any) => ({ participantLabelsPayload }))
export const getLegalTextAction = createAction(GET_LEGAL_TEXT_ACTION, (accountId: any) => ({ accountId }))
export const getLegalTextActionSuccess = createAction(SUCCESS_LEGAL_TEXT_ACTION, (legalTextPayload: any) => ({ legalTextPayload }))
export const getLanguageAction = createAction(GET_LANGUAGE_ACTION)
export const getLanguageActionSuccess = createAction(SUCCESS_LANGUAGE_ACTION, (languagePayload: any) => ({ languagePayload }))
export const getSelfRegistrationLinksAction = createAction(GET_SELF_REGISTRATION_LINK_ACTION, (accountId: any) => ({ accountId }))
export const getSelfRegistrationLinksSuccess = createAction(SUCCESS_SELF_REGISTRATION_LINK_ACTION, (selfRegistrationLinkPayload: any) => ({
    selfRegistrationLinkPayload,
}))
export const deleteSelfRegistrationLink = createAction(DELETE_SELF_REGISTRATION_LINK_ACTION, (params: any) => ({ params }))
export const deleteSelfRegistrationLinkSuccessAction = createAction(DELETE_SELF_REGISTRATION_LINK_SUCCESS_ACTION, (response: any) => ({ response }))
export const upsertTagAction = createAction(UPSERT_TAG_ACTION, (params: any) => ({ params }))
export const upsertTagActionSuccess = createAction(UPSERT_TAG_ACTION_SUCCESS, (response) => ({ response }))
export const getManageTagsAction = createAction(GET_MANAGE_TAGS_ACTION, (accountId: any) => ({ accountId }))
export const getManageTagsActionSuccess = createAction(SUCCESS_MANAGE_TAGS_ACTION, (manageTagsPayload: any) => ({ manageTagsPayload }))
export const deleteTagAction = createAction(DELETE_TAG_ACTION, (tagId: number) => ({ tagId }))
export const deleteTagActionSuccess = createAction(SUCCESS_DELETE_TAG_ACTION, (response) => ({ response }))
export const getFacilitatorsAction = createAction(GET_FACILITATORS_ACTION, (accountId: any) => ({ accountId }))
export const getFacilitatorsSuccessAction = createAction(GET_FACILITATORS_SUCCESS_ACTION, (response) => ({ response }))
export const saveSelfRegistrationLinkAction = createAction(SAVE_SELF_REGISTRATION_LINK_ACTION, (data) => ({ data }))
export const saveSelfRegistrationLinkSuccessAction = createAction(SAVE_SELF_REGISTRATION_LINK_SUCCESS_ACTION, (response) => ({ response }))
export const setEditRegistrationLinkAction = createAction(SET_EDIT_REGISTRATION_LINK_ACTION, (accountId: number, linkId: number) => ({ accountId, linkId }))
export const setEditRegistrationLinkSuccessAction = createAction(SET_EDIT_REGISTRATION_LINK_SUCCESS_ACTION, (response) => ({ response }))
export const editSelfRegistrationLinkAction = createAction(EDIT_SELF_REGISTRATION_LINK_ACTION, (data) => ({ data }))
export const editSelfRegistrationLinkSuccessAction = createAction(EDIT_SELF_REGISTRATION_LINK_SUCCESS_ACTION, (response) => ({ response }))
export const cancelSelfRegistrationModificationAction = createAction(CANCEL_SELF_REGISTRATION_LINK_MODIFICATION_ACTION)
export const editAccountDetailAction = createAction(EDIT_ACCOUNT_DETAILS_ACTION, (data) => ({ data }))
export const editAccountDetailSuccessAction = createAction(EDIT_ACCOUNT_DETAILS_SUCCESS_ACTION, (response) => ({ response }))
export const updateDefaultToggleAction = createAction(UPDATE_DEFAULT_TOGGLE_ACTION, (data) => ({ data }))
export const updateDefaultToggleActionSuccess = createAction(UPDATE_DEFAULT_TOGGLE_ACTION_SUCCESS, (response) => ({ response }))
export const getDefaultToggleAction = createAction(GET_DEFAULT_TOGGLE_ACTION, (personId: string, accountId: number) => ({ personId, accountId }))
export const getDefaultToggleActionSuccess = createAction(GET_DEFAULT_TOGGLE_ACTION_SUCCESS, (getDefaultToggleResponse: any) => ({
    getDefaultToggleResponse,
}))
export const editProfileAction = createAction(EDIT_PROFILE_ACTION, (data) => ({
    data,
}))
export const editProfileSuccessAction = createAction(EDIT_PROFILE_SUCCESS_ACTION, (response) => ({ response }))

export const getUserRolesAction = createAction(GET_USER_ROLES_ACTION)

export const getUsersAction = createAction(GET_USERS_ACTION, (accountId: any, status: any, isFidelityLogin = false) => ({ accountId, status, isFidelityLogin }))
export const successUserRolesAction = createAction(SUCCESS_USER_ROLES_ACTION, (userRolesPayload: any) => ({ userRolesPayload }))
export const failureUserRolesAction = createAction(FAILURE_USER_ROLES_ACTION, (error: any) => ({ error }))

export const updateCompletionEmailSettingsAction = createAction(UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION, (payload: any) => payload)

export const updateCompletionEmailSettingsActionSuccess = createAction(
    UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS,
    (updateCompletionEmailSettingsResponse: any) => ({
        updateCompletionEmailSettingsResponse,
    })
)

export const getCompletionEmailSettingsAction = createAction(GET_COMPLETION_EMAIL_SETTINGS_ACCTION, (accountId: any) => ({ accountId }))

export const getCompletionEmailSettingsActionSuccess = createAction(GET_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS, (completionEmailSettingsResponse: any) => ({
    completionEmailSettingsResponse,
}))

export const updateCustomizeEmailTextAction = createAction(UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION, (payload: any) => payload)

export const updateCustomizeEmailTextActionSuccess = createAction(UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS, (updateCustomizeEmailTextResponse: any) => ({
    updateCustomizeEmailTextResponse,
}))

export const getCustomizeEmailTextAction = createAction(GET_CUSTOMIZE_EMAIL_TEXT_ACTION, (accountId: any) => ({ accountId }))

export const getCustomizeEmailTextActionSuccess = createAction(GET_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS, (customizeEmailTextResponse: any) => ({
    customizeEmailTextResponse,
}))

export const getUserRoleAction = createAction(GET_USER_ROLE_ACTION, (accountId: any, personId: any, status: any) => ({
    accountId,
    personId,
    status,
}))
export const successUserRoleAction = createAction(GET_USER_ROLE_ACTION_SUCCESS, (userRolePayload: any) => ({ userRolePayload }))
export const successUsersAction = createAction(SUCCESS_USERS_ACTION, (usersPayload) => ({ usersPayload }))
export const deleteUserRoleAction = createAction(DELETE_USER_ROLE_ACTION, (accountId: any, personId: any) => ({ accountId, personId }))
export const successDeleteUserRoleAction = createAction(SUCCESS_DELETE_USER_ROLE_ACTION, (response) => ({ response }))
export const updateUserRoleAction = createAction(UPDATE_USER_ROLE_ACTION, (data) => ({ data }))
export const successUpdateUserRoleAction = createAction(SUCCESS_UPDATE_USER_ROLE_ACTION, (response) => ({ response }))
export const getSubscriptionNameAction = createAction(GET_SUBSCRIPTION_NAME_ACTION, (accountId: any, isFidelityLogin = false) => ({
    accountId,
    isFidelityLogin,
}))
export const getSubscriptionNameSuccessAction = createAction(GET_SUBSCRIPTION_NAME_SUCCESS_ACTION, (subscriptionNamePayload: any) => ({
    subscriptionNamePayload,
}))
export const getSubscriptionNameFailureAction = createAction(GET_SUBSCRIPTION_NAME_FAILURE_ACTION, (error: any) => ({ error }))

export const getUsersListAction = createAction(GET_USERS_LIST_ACTION, (getUsersPayload: any) => ({
    getUsersPayload,
}))

export const getUsersListActionSuccess = createAction(SUCCESS_GET_USERS_LIST_ACTION, (usersListResponse: any) => ({
    usersListResponse,
}))

export const getUsersListActionFailure = createAction(FAILURE_GET_USERS_LIST_ACTION, (error: any) => ({ error }))

export const topLevelAdminSearchUserAction = createAction(TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION, (payload: any) => ({
    payload,
}))

export const topLevelAdminSearchUserActionSuccess = createAction(TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION_SUCCESS, (topLevelUsersSearchResponse: any) => ({
    topLevelUsersSearchResponse,
}))

export const inviteNewUserAction = createAction(INVITE_NEW_USER_ACTION, (payload: any) => ({ payload }))

export const inviteNewUserSuccessAction = createAction(INVITE_NEW_USER_SUCCESS_ACTION, (response: any) => ({
    response,
}))
export const getAccountSubscriptionDetailAction = createAction(GET_ACCOUNT_SUBSCRIPTION_DETAILS_ACTION, (accountId: any) => ({ accountId }))
export const getAccountSubscriptionDetailSuccessAction = createAction(GET_ACCOUNT_SUBSCRIPTION_DETAILS_SUCCESS_ACTION, (response: any) => ({ response }))
export const getAccountSubscriptionDetailFailureAction = createAction(GET_ACCOUNT_SUBSCRIPTION_DETAILS_FAILURE_ACTION, (error: any) => ({ error }))
export const upsertLegalTextAction = createAction(UPSERT_LEGAL_TEXT_ACTION, (legalTextPayload: any) => ({ legalTextPayload }))
export const upsertLegalTextActionSuccess = createAction(UPSERT_LEGAL_TEXT_ACTION_SUCCESS, (response: any) => ({ response }))

export const saveSubscriptionComponentAction = createAction(SAVE_SUBSCRIPTION_COMPONENT_ACTION, (subscriptionId: any) => ({ subscriptionId }))
export const saveSubscriptionComponentActionSuccess = createAction(SAVE_SUBSCRIPTION_COMPONENT_ACTION_SUCCESS, (response: any) => ({ response }))

export const grantTopLevelAdminAction = createAction(GRANT_TOP_LEVEL_ADMIN_ACTION, (payload: any) => ({ payload }))
export const grantTopLevelAdminActionSuccess = createAction(GRANT_TOP_LEVEL_ADMIN_ACTION_SUCCESS, (response: any) => ({ response }))

export const updateCustomReportNameAction = createAction(UPDATE_CUSTOM_REPORT_NAME_ACTION, (payload: any) => ({ payload }))
export const updateCustomReportNameActionSuccess = createAction(UPDATE_CUSTOM_REPORT_NAME_ACTION_SUCCESS, (response: any) => ({ response }))

export const saveUserToAccountAction = createAction(SAVE_USER_TO_ACCOUNT_ACTION, (participantPayload: any) => ({ participantPayload }))
export const saveUserToAccountActionSuccess = createAction(SAVE_USER_TO_ACCOUNT_ACTION_SUCCESS, (response) => ({ response }))

export const getAllAccountsAction = createAction(GET_ALL_ACCOUNTS_ACTION)
export const getAllAccountsActionSuccess = createAction(GET_ALL_ACCOUNTS_ACTION_SUCCESS, (allAccountsResponse: any) => ({ allAccountsResponse }))

export const getParticipantAccountsAction = createAction(GET_PARTICIPANT_ACCOUNTS_ACTION, (personId: any) => ({ personId }))
export const getParticipantAccountsActionSuccess = createAction(GET_PARTICIPANT_ACCOUNTS_ACTION_SUCCESS, (participantAllAccounts) => ({
    participantAllAccounts,
}))

export const resetPasswordAction = createAction(RESET_PASSWORD_ACTION, (personId: any) => ({ personId }))
export const resetPasswordActionSuccess = createAction(RESET_PASSWORD_ACTION_SUCCESS, (response) => ({
    response,
}))

export const zapierSyncAllAction = createAction(ZAPIER_SYNC_ALL_ACTION, (accountId: any) => ({ accountId }))
export const zapierSyncAllActionSuccess = createAction(ZAPIER_SYNC_ALL_ACTION_SUCCESS, (response: any) => ({ response }))

export const checkZapierBulkStatusAction = createAction(CHECK_ZAPIER_BULK_STATUS_ACTION, (accountId: any) => ({ accountId }))
export const checkZapierBulkStatusSuccessAction = createAction(CHECK_ZAPIER_BULK_STATUS_ACTION_SUCCESS, (response: any) => ({ response }))

export const getDynamicWelcomeAction = createAction(GET_DYNAMIC_WELCOME_ACTION, (accountId: number) => ({ accountId }))
export const getDynamicWelcomeActionSuccess = createAction(GET_DYNAMIC_WELCOME_ACTION_SUCCESS, (response: any) => ({
    response,
}))

export const updateDynamicWelcomeAction = createAction(UPDATE_DYNAMIC_WELCOME_ACTION, (body: any) => ({ body }))
export const updateDynamicWelcomeActionSuccess = createAction(UPDATE_DYNAMIC_WELCOME_ACTION_SUCCESS, (response: any) => ({ response }))

// Failure action creators for settings.reducer.ts's `on(...)` cases below - the effects dispatch
// these same type strings as inline literals (`{ type: X_FAILURE_ACTION, error }`), these creators
// exist only so the reducer can reference them. Before these `on(...)` cases existed, none of
// these failure types had a reducer case at all, so their loading flags stuck `true` forever on a
// mutation failure (see BRANCH_VERIFICATION_REPORT.md V4).
export const deleteSelfRegistrationLinkFailureAction = createAction(DELETE_SELF_REGISTRATION_LINK_FAILURE_ACTION, (error: ApiError) => ({ error }))
export const upsertTagActionFailure = createAction(UPSERT_TAG_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const failureDeleteTagAction = createAction(FAILURE_DELETE_TAG_ACTION, (error: ApiError) => ({ error }))
export const saveSelfRegistrationLinkFailureAction = createAction(SAVE_SELF_REGISTRATION_LINK_FAILURE_ACTION, (error: ApiError) => ({ error }))
export const editSelfRegistrationLinkFailureAction = createAction(EDIT_SELF_REGISTRATION_LINK_FAILURE_ACTION, (error: ApiError) => ({ error }))
export const editAccountDetailsFailureAction = createAction(EDIT_ACCOUNT_DETAILS_FAILURE_ACTION, (error: ApiError) => ({ error }))
export const updateDefaultToggleActionFailure = createAction(UPDATE_DEFAULT_TOGGLE_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const editProfileFailureAction = createAction(EDIT_PROFILE_FAILURE_ACTION, (error: ApiError) => ({ error }))
export const failureDeleteUserRoleAction = createAction(FAILURE_DELETE_USER_ROLE_ACTION, (error: ApiError) => ({ error }))
export const failureUpdateUserRoleAction = createAction(FAILURE_UPDATE_USER_ROLE_ACTION, (error: ApiError) => ({ error }))
export const failureUploadProfilePictureAction = createAction(FAILURE_UPLOAD_PROFILE_PICTURE_ACTION, (error: ApiError) => ({ error }))
export const failureUploadAccountLogoAction = createAction(FAILURE_UPLOAD_ACCOUNT_LOGO_ACTION, (error: ApiError) => ({ error }))
export const upsertLegalTextActionFailure = createAction(UPSERT_LEGAL_TEXT_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const saveSubscriptionComponentActionFailure = createAction(SAVE_SUBSCRIPTION_COMPONENT_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const updateCustomReportNameActionFailure = createAction(UPDATE_CUSTOM_REPORT_NAME_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const resetPasswordActionFailure = createAction(RESET_PASSWORD_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const grantTopLevelAdminActionFailure = createAction(GRANT_TOP_LEVEL_ADMIN_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const saveUserToAccountActionFailureSettings = createAction(SAVE_USER_TO_ACCOUNT_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const updateCompletionEmailSettingsActionFailure = createAction(UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_FAILURE, (error: ApiError) => ({ error }))
export const updateCustomizeEmailTextActionFailure = createAction(UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const zapierSyncAllActionFailure = createAction(ZAPIER_SYNC_ALL_ACTION_FAILURE, (error: ApiError) => ({ error }))
export const updateDynamicWelcomeActionFailure = createAction(UPDATE_DYNAMIC_WELCOME_ACTION_FAILURE, (error: ApiError) => ({ error }))
