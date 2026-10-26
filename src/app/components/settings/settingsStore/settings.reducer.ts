import { createReducer, on } from '@ngrx/store'
import {} from '../../login/store/login.actions'
import {
    SuccessUploadAccountLogo,
    SuccessUploadProfilePicture,
    cancelSelfRegistrationModificationAction,
    checkZapierBulkStatusAction,
    checkZapierBulkStatusSuccessAction,
    deleteSelfRegistrationLink,
    deleteSelfRegistrationLinkFailureAction,
    deleteTagAction,
    deleteTagActionSuccess,
    deleteUserRoleAction,
    editAccountDetailAction,
    editAccountDetailSuccessAction,
    editAccountDetailsFailureAction,
    editProfileAction,
    editProfileFailureAction,
    editProfileSuccessAction,
    editSelfRegistrationLinkAction,
    editSelfRegistrationLinkFailureAction,
    failureDeleteTagAction,
    failureDeleteUserRoleAction,
    failureUpdateUserRoleAction,
    failureUploadAccountLogoAction,
    failureUploadProfilePictureAction,
    grantTopLevelAdminActionFailure,
    resetPasswordActionFailure,
    saveSelfRegistrationLinkFailureAction,
    saveSubscriptionComponentActionFailure,
    saveUserToAccountActionFailureSettings,
    updateCompletionEmailSettingsActionFailure,
    updateCustomReportNameActionFailure,
    updateCustomizeEmailTextActionFailure,
    updateDefaultToggleActionFailure,
    updateDynamicWelcomeActionFailure,
    upsertLegalTextActionFailure,
    upsertTagActionFailure,
    zapierSyncAllActionFailure,
    getAccountSubscriptionDetailAction,
    getAccountSubscriptionDetailSuccessAction,
    getAccountSubscriptionDetailFailureAction,
    getAllAccountsAction,
    getAllAccountsActionSuccess,
    getCompletionEmailSettingsAction,
    getCompletionEmailSettingsActionSuccess,
    getCustomReportNamesAction,
    getCustomReportsSuccessAction,
    getCustomizeEmailTextAction,
    getCustomizeEmailTextActionSuccess,
    getDefaultToggleAction,
    getDefaultToggleActionSuccess,
    getDynamicWelcomeAction,
    getDynamicWelcomeActionSuccess,
    getFacilitatorsSuccessAction,
    getLanguageAction,
    getLanguageActionSuccess,
    getLegalTextAction,
    getLegalTextActionSuccess,
    getManageTagsAction,
    getManageTagsActionSuccess,
    getParticipantAccountsAction,
    getParticipantAccountsActionSuccess,
    getParticipantLabels,
    getParticipantLabelsSuccess,
    getProfilePictureAction,
    getSelfRegistrationLinksAction,
    getSelfRegistrationLinksSuccess,
    getSubscriptionAccountAction,
    getSubscriptionNameAction,
    getSubscriptionNameFailureAction,
    getSubscriptionNameSuccessAction,
    getSubscriptionUrlDetailsAction,
    getUserLabels,
    getUserLabelsSuccess,
    getUserRoleAction,
    getUserRolesAction,
    failureUserRolesAction,
    getUsersAction,
    getUsersListAction,
    getUsersListActionSuccess,
    getUsersListActionFailure,
    grantTopLevelAdminAction,
    grantTopLevelAdminActionSuccess,
    resetPasswordAction,
    resetPasswordActionSuccess,
    saveSelfRegistrationLinkAction,
    saveSubscriptionComponentAction,
    saveSubscriptionComponentActionSuccess,
    saveUserToAccountAction,
    saveUserToAccountActionSuccess,
    setEditRegistrationLinkAction,
    setEditRegistrationLinkSuccessAction,
    successDeleteUserRoleAction,
    successProfilePictureAction,
    successSubscriptionAccountAction,
    successSubscriptionUrlDetailsAction,
    successUpdateUserRoleAction,
    successUserRoleAction,
    successUserRolesAction,
    successUsersAction,
    topLevelAdminSearchUserAction,
    topLevelAdminSearchUserActionSuccess,
    updateCompletionEmailSettingsAction,
    updateCompletionEmailSettingsActionSuccess,
    updateCustomReportNameAction,
    updateCustomReportNameActionSuccess,
    updateCustomizeEmailTextAction,
    updateCustomizeEmailTextActionSuccess,
    updateDefaultToggleAction,
    updateDefaultToggleActionSuccess,
    updateDynamicWelcomeAction,
    updateDynamicWelcomeActionSuccess,
    updateUserRoleAction,
    uploadAccountLogo,
    uploadProfilePicture,
    upsertLegalTextAction,
    upsertLegalTextActionSuccess,
    upsertTagAction,
    upsertTagActionSuccess,
    zapierSyncAllAction,
    zapierSyncAllActionSuccess,
} from './settings.actions'

export const initialState = {
    legalTextPayload: undefined,
    languagePayload: undefined,
    selfRegistrationLinkPayload: undefined,
    manageTagsPayload: undefined,
    participantLabelsPayload: undefined,
    userLabelsPayload: undefined,
    accountLogoPayload: undefined,
    subscriptionUrlDetailsPayload: undefined,
    subscriptionAccountPayload: undefined,
    subscriptionNamePayload: undefined,
    profilePicture: undefined,
    profilePicturePayload: undefined,
    isTagLoading: false,
    isRegistrationLoading: false,
    isAccountLoading: false,
    isProfileLoading: false,
    registrationLinkToEdit: null,
    facilitators: <any>[],
    usersPayload: undefined,
    userRolesPayload: undefined,
    userRolePayload: undefined,
    isUsersLoading: false,
    isUserRolesLoading: false,
    isDeleteUserLoading: false,
    isUpdateRoleLoading: false,
    isAccountSubscriptionLoading: false,
    isUserSaving: false,
    subscriptionComponentSaving: false,
    topLevelAdminLoading: false,
}

export const settingsReducer = createReducer(
    initialState,
    on(getUserLabels, (state) => ({
        ...state,
        getuserLabelsLoading: true,
    })),
    on(getUserLabelsSuccess, (state, { userLabelsPayload, isBackgroundRefresh }: any) => ({
        ...state,
        userLabelsPayload: userLabelsPayload?.body,
        ...(isBackgroundRefresh ? {} : { getuserLabelsLoading: false }),
    })),

    on(getParticipantLabels, (state) => ({
        ...state,
        getParticipantLabelsLoading: true,
    })),
    on(getParticipantLabelsSuccess, (state, { participantLabelsPayload, isBackgroundRefresh }: any) => ({
        ...state,
        participantLabelsPayload: participantLabelsPayload?.body,
        ...(isBackgroundRefresh ? {} : { getParticipantLabelsLoading: false }),
    })),
    on(getSubscriptionAccountAction, (state) => ({
        ...state,
        getSubscriptionAccountLoading: true,
        getSubscriptionUrlDetailsLoading: true,
    })),
    on(successSubscriptionAccountAction, (state, { subscriptionAccountPayload }) => ({
        ...state,
        subscriptionAccountPayload: subscriptionAccountPayload?.body,
        subscriptionUrlDetailsPayload: subscriptionAccountPayload?.body,
        getSubscriptionAccountLoading: false,
        getSubscriptionUrlDetailsLoading: false,
    })),

    on(getSubscriptionUrlDetailsAction, (state, { subscriptionAccountPayload }) => ({
        ...state,
        subscriptionAccountPayload: subscriptionAccountPayload?.body,
        getSubscriptionUrlDetailsLoading: true,
        getSubscriptionAccountLoading: false,
    })),
    on(successSubscriptionUrlDetailsAction, (state, { subscriptionUrlDetailsPayload }) => ({
        ...state,
        subscriptionUrlDetailsPayload: subscriptionUrlDetailsPayload?.body,
        getSubscriptionUrlDetailsLoading: false,
    })),

    on(getLegalTextAction, (state) => ({
        ...state,
        getLegalTextLoading: true,
    })),
    on(getLegalTextActionSuccess, (state, { legalTextPayload, isBackgroundRefresh }: any) => ({
        ...state,
        legalTextPayload: legalTextPayload?.body,
        ...(isBackgroundRefresh ? {} : { getLegalTextLoading: false }),
    })),
    on(getManageTagsAction, (state) => ({
        ...state,
        getManageTagsLoading: true,
    })),
    on(getManageTagsActionSuccess, (state, { manageTagsPayload, isBackgroundRefresh }: any) => ({
        ...state,
        manageTagsPayload: manageTagsPayload?.body,
        ...(isBackgroundRefresh ? {} : { getManageTagsLoading: false, isTagLoading: false }),
    })),
    on(upsertTagAction, (state) => ({
        ...state,
        isTagLoading: true,
    })),
    on(upsertTagActionFailure, (state) => ({
        ...state,
        isTagLoading: false,
    })),
    on(upsertTagActionSuccess, (state) => ({
        ...state,
        //isTagLoading: false
    })),
    on(deleteTagAction, (state) => ({
        ...state,
        isTagLoading: true,
    })),
    on(failureDeleteTagAction, (state) => ({
        ...state,
        isTagLoading: false,
    })),
    on(deleteTagActionSuccess, (state) => ({
        ...state,
        //isTagLoading: false,
    })),
    on(getLanguageAction, (state) => ({
        ...state,
        getLanguageLoading: true,
    })),
    on(getLanguageActionSuccess, (state, { languagePayload, isBackgroundRefresh }: any) => ({
        ...state,
        languagePayload: languagePayload?.body,
        ...(isBackgroundRefresh ? {} : { getLanguageLoading: false }),
    })),
    on(getSelfRegistrationLinksAction, (state) => ({
        ...state,
        isRegistrationLoading: true,
    })),
    on(getSelfRegistrationLinksSuccess, (state, { selfRegistrationLinkPayload, isBackgroundRefresh }: any) => ({
        ...state,
        selfRegistrationLinkPayload: selfRegistrationLinkPayload?.body,
        ...(isBackgroundRefresh ? {} : { isRegistrationLoading: false }),
    })),

    on(deleteSelfRegistrationLink, (state) => ({
        ...state,
        isRegistrationLoading: true,
    })),
    on(deleteSelfRegistrationLinkFailureAction, (state) => ({
        ...state,
        isRegistrationLoading: false,
    })),
    on(uploadProfilePicture, (state) => ({
        ...state,
        isProfileLoading: true,
    })),
    on(failureUploadProfilePictureAction, (state) => ({
        ...state,
        isProfileLoading: false,
    })),
    on(SuccessUploadProfilePicture, (state, { uploadProfilePayload }) => ({
        ...state,
        uploadProfilePayload: uploadProfilePayload?.body,
        profilePicturePayload: uploadProfilePayload?.body,
        isProfileLoading: false,
    })),

    on(uploadAccountLogo, (state) => ({
        ...state,
        accountLogoLoading: true,
    })),
    on(failureUploadAccountLogoAction, (state) => ({
        ...state,
        accountLogoLoading: false,
    })),

    on(SuccessUploadAccountLogo, (state, { accountLogoPayload }) => ({
        ...state,
        accountLogoPayload: accountLogoPayload?.body,
        accountLogoLoading: false,
    })),
    on(getProfilePictureAction, (state) => ({
        ...state,
        isProfileLoading: true,
    })),
    on(successProfilePictureAction, (state, { profilePicturePayload, isBackgroundRefresh }: any) => ({
        ...state,
        profilePicture: profilePicturePayload?.body?.data,
        ...(isBackgroundRefresh ? {} : { isProfileLoading: false }),
    })),
    on(getCustomReportNamesAction, (state) => ({
        ...state,
        getReportsLoading: true,
    })),
    on(getCustomReportsSuccessAction, (state, { customReportNamesResponse, isBackgroundRefresh }: any) => ({
        ...state,
        customReportNamesResponse: customReportNamesResponse?.body?.data,
        ...(isBackgroundRefresh ? {} : { getReportsLoading: false }),
    })),
    on(saveSelfRegistrationLinkAction, (state) => ({
        ...state,
        isRegistrationLoading: true,
    })),
    on(saveSelfRegistrationLinkFailureAction, (state) => ({
        ...state,
        isRegistrationLoading: false,
    })),
    on(editSelfRegistrationLinkAction, (state) => ({
        ...state,
        isRegistrationLoading: true,
    })),
    on(editSelfRegistrationLinkFailureAction, (state) => ({
        ...state,
        isRegistrationLoading: false,
    })),
    on(getFacilitatorsSuccessAction, (state, { response }) => ({
        ...state,
        // Optional-chained defensively: this handler isn't reachable with an undefined response
        // today (getFacilitators' effect swallows failures into EMPTY, no toFailureAction), but a
        // future catchApiError conversion would make it reachable exactly like
        // setEditRegistrationLinkSuccessAction was - see settings.reducer.spec.ts.
        facilitators: response?.body?.data,
    })),
    on(setEditRegistrationLinkAction, (state) => ({
        ...state,
        isRegistrationLoading: true,
    })),
    // `response` is optional-chained because getSelfRegistrationLink's effect dispatches this same
    // action type with `response: undefined` + an `error` on a real transport failure (it used to
    // swallow failures into EMPTY, which left isRegistrationLoading stuck true forever - see
    // SETTINGS_PAGE_STATUSCODE_MIGRATION_PLAN.md D0). Without the `?.` this handler would throw
    // inside the reducer on that path, which is strictly worse than the stuck loader it replaced.
    on(setEditRegistrationLinkSuccessAction, (state, { response }) => ({
        ...state,
        registrationLinkToEdit: response?.body?.data,
        isRegistrationLoading: false,
    })),
    on(cancelSelfRegistrationModificationAction, (state) => ({
        ...state,
        registrationLinkToEdit: null,
    })),
    on(editAccountDetailAction, (state) => ({
        ...state,
        isAccountLoading: true,
    })),
    on(editAccountDetailsFailureAction, (state) => ({
        ...state,
        isAccountLoading: false,
    })),
    on(editAccountDetailSuccessAction, (state) => ({
        ...state,
        isAccountLoading: false,
    })),
    on(updateDefaultToggleAction, (state) => ({
        ...state,
        defaultToggleLoading: true,
    })),
    on(updateDefaultToggleActionFailure, (state) => ({
        ...state,
        defaultToggleLoading: false,
    })),
    on(updateDefaultToggleActionSuccess, (state) => ({
        ...state,
        defaultToggleLoading: false,
    })),

    on(getDefaultToggleAction, (state) => ({
        ...state,
        getDefaultToggleLoading: true,
    })),
    on(getDefaultToggleActionSuccess, (state, { getDefaultToggleResponse, isBackgroundRefresh }: any) => ({
        ...state,
        ...(isBackgroundRefresh ? {} : { getDefaultToggleLoading: false }),
        getDefaultToggleResponse,
    })),

    on(editProfileAction, (state) => ({
        ...state,
        isProfileLoading: true,
    })),
    on(editProfileFailureAction, (state) => ({
        ...state,
        isProfileLoading: false,
    })),
    on(editProfileSuccessAction, (state) => ({
        ...state,
        isProfileLoading: false,
    })),

    on(updateCompletionEmailSettingsAction, (state) => ({
        ...state,
        updateCompletionEmailSettingsLoading: true,
    })),
    on(updateCompletionEmailSettingsActionFailure, (state) => ({
        ...state,
        updateCompletionEmailSettingsLoading: false,
    })),
    on(updateCompletionEmailSettingsActionSuccess, (state, { updateCompletionEmailSettingsResponse }) => ({
        ...state,
        updateCompletionEmailSettingsLoading: false,
        updateCompletionEmailSettingsResponse,
    })),
    on(getCompletionEmailSettingsAction, (state) => ({
        ...state,
        getCompletionEmailSettingsLoading: true,
    })),
    on(getCompletionEmailSettingsActionSuccess, (state, { completionEmailSettingsResponse, isBackgroundRefresh }: any) => ({
        ...state,
        ...(isBackgroundRefresh ? {} : { getCompletionEmailSettingsLoading: false }),
        completionEmailSettingsResponse,
    })),
    on(updateCustomizeEmailTextAction, (state) => ({
        ...state,
        updateCustomizeEmailTextLoading: true,
    })),
    on(updateCustomizeEmailTextActionFailure, (state) => ({
        ...state,
        updateCustomizeEmailTextLoading: false,
    })),
    on(updateCustomizeEmailTextActionSuccess, (state, { updateCustomizeEmailTextResponse }) => ({
        ...state,
        updateCustomizeEmailTextLoading: false,
        updateCustomizeEmailTextResponse,
    })),
    on(getCustomizeEmailTextAction, (state) => ({
        ...state,
        getCustomizeEmailTextLoading: true,
    })),
    on(getCustomizeEmailTextActionSuccess, (state, { customizeEmailTextResponse, isBackgroundRefresh }: any) => ({
        ...state,
        ...(isBackgroundRefresh ? {} : { getCustomizeEmailTextLoading: false }),
        customizeEmailTextResponse,
    })),
    on(getUserRolesAction, (state) => ({
        ...state,
        isUserRolesLoading: true,
    })),
    on(getUsersAction, (state) => ({
        ...state,
        isUsersLoading: true,
    })),
    on(successUserRolesAction, (state, { userRolesPayload, isBackgroundRefresh }: any) => ({
        ...state,
        userRolesPayload: userRolesPayload?.body,
        ...(isBackgroundRefresh ? {} : { isUserRolesLoading: false }),
    })),
    on(failureUserRolesAction, (state) => ({
        ...state,
        isUserRolesLoading: false,
    })),
    on(getUserRoleAction, (state) => ({
        ...state,
        isUserRoleLoading: true,
    })),
    on(successUserRoleAction, (state, { userRolePayload, isBackgroundRefresh }: any) => ({
        ...state,
        userRolePayload: userRolePayload?.body,
        ...(isBackgroundRefresh ? {} : { isUserRoleLoading: false }),
    })),
    on(successUsersAction, (state, { usersPayload, isBackgroundRefresh }: any) => ({
        ...state,
        usersPayload: usersPayload?.body,
        ...(isBackgroundRefresh ? {} : { isUsersLoading: false }),
    })),

    on(topLevelAdminSearchUserAction, (state) => ({
        ...state,
        isTopLevelSearchLoading: true,
    })),
    on(topLevelAdminSearchUserActionSuccess, (state, { topLevelUsersSearchResponse }) => ({
        ...state,
        topLevelUsersSearchResponse: topLevelUsersSearchResponse?.body,
        isTopLevelSearchLoading: false,
    })),

    on(deleteUserRoleAction, (state) => ({
        ...state,
        isDeleteUserLoading: true,
    })),
    on(failureDeleteUserRoleAction, (state) => ({
        ...state,
        isDeleteUserLoading: false,
    })),
    on(successDeleteUserRoleAction, (state) => ({
        ...state,
        isDeleteUserLoading: false,
    })),
    on(updateUserRoleAction, (state) => ({
        ...state,
        isUpdateRoleLoading: true,
    })),
    on(failureUpdateUserRoleAction, (state) => ({
        ...state,
        isUpdateRoleLoading: false,
    })),
    on(successUpdateUserRoleAction, (state) => ({
        ...state,
        isUpdateRoleLoading: false,
    })),
    on(getSubscriptionNameAction, (state) => ({
        ...state,
        getSubscriptionAccountLoading: true,
    })),
    on(getSubscriptionNameSuccessAction, (state, { subscriptionNamePayload, isBackgroundRefresh }: any) => ({
        ...state,
        ...(isBackgroundRefresh ? {} : { getSubscriptionAccountLoading: false }),
        subscriptionNamePayload: subscriptionNamePayload?.body,
    })),
    on(getSubscriptionNameFailureAction, (state) => ({
        ...state,
        getSubscriptionAccountLoading: false,
    })),
    on(getUsersListAction, (state) => ({
        ...state,
        isUsersForInvitationLoading: true,
    })),

    on(getUsersListActionSuccess, (state) => ({
        ...state,
        isUsersForInvitationLoading: false,
    })),
    on(getUsersListActionFailure, (state) => ({
        ...state,
        isUsersForInvitationLoading: false,
    })),
    on(getAccountSubscriptionDetailAction, (state) => ({
        ...state,
        isAccountSubscriptionLoading: true,
    })),
    on(getAccountSubscriptionDetailSuccessAction, (state, action: any) => ({
        ...state,
        ...(action?.isBackgroundRefresh ? {} : { isAccountSubscriptionLoading: false }),
    })),
    on(getAccountSubscriptionDetailFailureAction, (state) => ({
        ...state,
        isAccountSubscriptionLoading: false,
    })),
    on(upsertLegalTextAction, (state) => ({
        ...state,
        isUpdateLegalTextLoading: true,
    })),
    on(upsertLegalTextActionFailure, (state) => ({
        ...state,
        isUpdateLegalTextLoading: false,
    })),
    on(upsertLegalTextActionSuccess, (state) => ({
        ...state,
        isUpdateLegalTextLoading: false,
    })),

    on(saveUserToAccountAction, (state) => ({
        ...state,
        isUserSaving: true,
    })),
    on(saveUserToAccountActionFailureSettings, (state) => ({
        ...state,
        isUserSaving: false,
    })),
    on(saveUserToAccountActionSuccess, (state) => ({
        ...state,
        isUserSaving: false,
    })),
    on(saveSubscriptionComponentAction, (state) => ({
        ...state,
        subscriptionComponentSaving: true,
    })),
    on(saveSubscriptionComponentActionFailure, (state) => ({
        ...state,
        subscriptionComponentSaving: false,
    })),
    on(saveSubscriptionComponentActionSuccess, (state) => ({
        ...state,
        subscriptionComponentSaving: false,
    })),
    on(grantTopLevelAdminAction, (state) => ({
        ...state,
        topLevelAdminLoading: true,
    })),
    on(grantTopLevelAdminActionFailure, (state) => ({
        ...state,
        topLevelAdminLoading: false,
    })),
    on(grantTopLevelAdminActionSuccess, (state) => ({
        ...state,
        topLevelAdminLoading: false,
    })),
    on(updateCustomReportNameAction, (state) => ({
        ...state,
        updateReportLoading: true,
    })),
    on(updateCustomReportNameActionFailure, (state) => ({
        ...state,
        updateReportLoading: false,
    })),
    on(updateCustomReportNameActionSuccess, (state) => ({
        ...state,
        updateReportLoading: false,
    })),
    on(getAllAccountsAction, (state) => ({
        ...state,
        allAccountsLoading: true,
    })),
    on(getAllAccountsActionSuccess, (state, { allAccountsResponse, isBackgroundRefresh }: any) => ({
        ...state,
        allAccountsResponse: allAccountsResponse?.body,
        ...(isBackgroundRefresh ? {} : { allAccountsLoading: false }),
    })),
    on(getParticipantAccountsAction, (state) => ({
        ...state,
        getParticipantAccountsLoading: true,
    })),
    on(getParticipantAccountsActionSuccess, (state, { participantAllAccounts }) => ({
        ...state,
        participantAllAccounts: participantAllAccounts?.body,
        getParticipantAccountsLoading: false,
    })),

    on(resetPasswordAction, (state) => ({
        ...state,
        resetPasswordLoading: true,
    })),
    on(resetPasswordActionFailure, (state) => ({
        ...state,
        resetPasswordLoading: false,
    })),
    on(resetPasswordActionSuccess, (state, { response }) => ({
        ...state,
        response,
        resetPasswordLoading: false,
    })),
    on(zapierSyncAllAction, (state) => ({
        ...state,
        zapierSyncAllLoading: true,
    })),
    on(zapierSyncAllActionFailure, (state) => ({
        ...state,
        zapierSyncAllLoading: false,
    })),
    on(zapierSyncAllActionSuccess, (state, { response }) => ({
        ...state,
        response,
        zapierSyncAllLoading: false,
    })),
    on(checkZapierBulkStatusAction, (state) => ({
        ...state,
        checkStatusLoading: true,
    })),
    on(checkZapierBulkStatusSuccessAction, (state, { response }) => ({
        ...state,
        response,
        checkStatusLoading: false,
    })),
    on(getDynamicWelcomeAction, (state) => ({
        ...state,
        dynamicWelcomeLoading: true,
    })),
    on(getDynamicWelcomeActionSuccess, (state, { response, isBackgroundRefresh }: any) => ({
        ...state,
        dynamicWelcomeResponse: response?.body?.data,
        ...(isBackgroundRefresh ? {} : { dynamicWelcomeLoading: false }),
    })),
    on(updateDynamicWelcomeAction, (state) => ({
        ...state,
        updateDynamicWelcomeLoading: true,
    })),
    on(updateDynamicWelcomeActionFailure, (state) => ({
        ...state,
        updateDynamicWelcomeLoading: false,
    })),
    on(updateDynamicWelcomeActionSuccess, (state, { response }) => ({
        ...state,
        updateDynamicWelcomeLoading: false,
        updateDynamicWelcomeResponse: response?.body?.data,
    }))
)
