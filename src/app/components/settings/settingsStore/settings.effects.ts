import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { catchApiError, ensureApiError } from 'src/app/service/api-error'
import { of } from 'rxjs'
import { catchError, concatMap, map, mergeMap, tap } from 'rxjs/operators'
import { SettingsService } from '../settings.service'
import {
    SETTINGS_STATIC_CACHE_FRESH_MS,
    SETTINGS_STATIC_CACHE_TTL_MS,
    SettingsCacheStorageService,
} from 'src/app/service/settings-cache-storage.service'
import { UsersCacheStorageService } from 'src/app/service/users-cache-storage.service'
import { withStaleWhileRevalidate } from 'src/app/util/stale-while-revalidate'
import {
    CHECK_ZAPIER_BULK_STATUS_ACTION,
    CHECK_ZAPIER_BULK_STATUS_ACTION_SUCCESS,
    DELETE_SELF_REGISTRATION_LINK_ACTION,
    DELETE_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    DELETE_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
    DELETE_TAG_ACTION,
    DELETE_USER_ROLE_ACTION,
    EDIT_ACCOUNT_DETAILS_ACTION,
    EDIT_ACCOUNT_DETAILS_FAILURE_ACTION,
    EDIT_ACCOUNT_DETAILS_SUCCESS_ACTION,
    EDIT_PROFILE_ACTION,
    EDIT_PROFILE_FAILURE_ACTION,
    EDIT_PROFILE_SUCCESS_ACTION,
    EDIT_SELF_REGISTRATION_LINK_ACTION,
    EDIT_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    EDIT_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
    FAILURE_DELETE_TAG_ACTION,
    FAILURE_DELETE_USER_ROLE_ACTION,
    FAILURE_UPDATE_USER_ROLE_ACTION,
    FAILURE_UPLOAD_ACCOUNT_LOGO_ACTION,
    FAILURE_UPLOAD_PROFILE_PICTURE_ACTION,
    GET_ACCOUNT_SUBSCRIPTION_DETAILS_ACTION,
    GET_ACCOUNT_SUBSCRIPTION_DETAILS_SUCCESS_ACTION,
    GET_ACCOUNT_SUBSCRIPTION_DETAILS_FAILURE_ACTION,
    GET_ALL_ACCOUNTS_ACTION,
    GET_ALL_ACCOUNTS_ACTION_SUCCESS,
    GET_COMPLETION_EMAIL_SETTINGS_ACCTION,
    GET_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS,
    GET_CUSTOMIZE_EMAIL_TEXT_ACTION,
    GET_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS,
    GET_CUSTOM_REPORTS,
    GET_CUSTOM_REPORTS_SUCCESS,
    GET_DEFAULT_TOGGLE_ACTION,
    GET_DEFAULT_TOGGLE_ACTION_SUCCESS,
    GET_DYNAMIC_WELCOME_ACTION,
    GET_DYNAMIC_WELCOME_ACTION_SUCCESS,
    GET_FACILITATORS_ACTION,
    GET_FACILITATORS_SUCCESS_ACTION,
    GET_LANGUAGE_ACTION,
    GET_LEGAL_TEXT_ACTION,
    GET_MANAGE_TAGS_ACTION,
    GET_PARTICIPANT_ACCOUNTS_ACTION,
    GET_PARTICIPANT_ACCOUNTS_ACTION_SUCCESS,
    GET_PARTICIPANT_LABELS_ACTION,
    GET_PROFILE_PICTURE_ACTION,
    GET_SELF_REGISTRATION_LINK_ACTION,
    GET_SUBSCRIPTION_ACCOUNT_ACTION,
    GET_SUBSCRIPTION_NAME_ACTION,
    GET_SUBSCRIPTION_NAME_SUCCESS_ACTION,
    GET_SUBSCRIPTION_NAME_FAILURE_ACTION,
    GET_SUBSCRIPTION_URL_DETAILS_ACTION,
    GET_USERS_ACTION,
    GET_USERS_LIST_ACTION,
    FAILURE_GET_USERS_LIST_ACTION,
    GET_USER_LABELS_ACTION,
    GET_USER_ROLES_ACTION,
    FAILURE_USER_ROLES_ACTION,
    GET_USER_ROLE_ACTION,
    GET_USER_ROLE_ACTION_SUCCESS,
    GRANT_TOP_LEVEL_ADMIN_ACTION,
    GRANT_TOP_LEVEL_ADMIN_ACTION_FAILURE,
    GRANT_TOP_LEVEL_ADMIN_ACTION_SUCCESS,
    INVITE_NEW_USER_ACTION,
    INVITE_NEW_USER_FAILURE_ACTION,
    INVITE_NEW_USER_SUCCESS_ACTION,
    RESET_PASSWORD_ACTION,
    RESET_PASSWORD_ACTION_FAILURE,
    RESET_PASSWORD_ACTION_SUCCESS,
    SAVE_SELF_REGISTRATION_LINK_ACTION,
    SAVE_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    SAVE_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
    SAVE_SUBSCRIPTION_COMPONENT_ACTION,
    SAVE_SUBSCRIPTION_COMPONENT_ACTION_FAILURE,
    SAVE_SUBSCRIPTION_COMPONENT_ACTION_SUCCESS,
    SAVE_USER_TO_ACCOUNT_ACTION,
    SAVE_USER_TO_ACCOUNT_ACTION_FAILURE,
    SAVE_USER_TO_ACCOUNT_ACTION_SUCCESS,
    SET_EDIT_REGISTRATION_LINK_ACTION,
    SET_EDIT_REGISTRATION_LINK_SUCCESS_ACTION,
    SUCCESS_DELETE_TAG_ACTION,
    SUCCESS_DELETE_USER_ROLE_ACTION,
    SUCCESS_GET_USERS_LIST_ACTION,
    SUCCESS_LANGUAGE_ACTION,
    SUCCESS_LEGAL_TEXT_ACTION,
    SUCCESS_MANAGE_TAGS_ACTION,
    SUCCESS_PARTICIPANT_LABELS_ACTION,
    SUCCESS_PROFILE_PICTURE_ACTION,
    SUCCESS_SELF_REGISTRATION_LINK_ACTION,
    SUCCESS_SUBSCRIPTION_ACCOUNT_ACTION,
    SUCCESS_SUBSCRIPTION_URL_DETAILS_ACTION,
    SUCCESS_UPDATE_USER_ROLE_ACTION,
    SUCCESS_UPLOAD_ACCOUNT_LOGO_ACTION,
    SUCCESS_UPLOAD_PROFILE_PICTURE_ACTION,
    SUCCESS_USERS_ACTION,
    SUCCESS_USER_LABELS_ACTION,
    SUCCESS_USER_ROLES_ACTION,
    TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION,
    TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION_SUCCESS,
    UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION,
    UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_FAILURE,
    UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS,
    UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION,
    UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_FAILURE,
    UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS,
    UPDATE_CUSTOM_REPORT_NAME_ACTION,
    UPDATE_CUSTOM_REPORT_NAME_ACTION_FAILURE,
    UPDATE_CUSTOM_REPORT_NAME_ACTION_SUCCESS,
    UPDATE_DEFAULT_TOGGLE_ACTION,
    UPDATE_DEFAULT_TOGGLE_ACTION_FAILURE,
    UPDATE_DEFAULT_TOGGLE_ACTION_SUCCESS,
    UPDATE_DYNAMIC_WELCOME_ACTION,
    UPDATE_DYNAMIC_WELCOME_ACTION_FAILURE,
    UPDATE_DYNAMIC_WELCOME_ACTION_SUCCESS,
    UPDATE_USER_ROLE_ACTION,
    UPLOAD_ACCOUNT_LOGO_ACTION,
    UPLOAD_PROFILE_PICTURE_ACTION,
    UPSERT_LEGAL_TEXT_ACTION,
    UPSERT_LEGAL_TEXT_ACTION_FAILURE,
    UPSERT_LEGAL_TEXT_ACTION_SUCCESS,
    UPSERT_TAG_ACTION,
    UPSERT_TAG_ACTION_FAILURE,
    UPSERT_TAG_ACTION_SUCCESS,
    ZAPIER_SYNC_ALL_ACTION,
    ZAPIER_SYNC_ALL_ACTION_FAILURE,
    ZAPIER_SYNC_ALL_ACTION_SUCCESS,
} from './settings-actions-constants'
@Injectable()
export class SettingsEffects {
    private inFlightRefreshes = new Set<string>()
    private lastRefreshedAt = new Map<string, number>()

    /** Best-effort accountId extraction across the mixed payload shapes mutation actions use
     * (`accountId` almost everywhere, `accountID` on updateDefaultToggleAction) - see
     * SETTINGS_PAGE_CACHE_PLAN.md §4. */
    private accountIdOf(obj: any): string | undefined {
        return obj?.accountId ?? obj?.accountID
    }

    legalTextData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_LEGAL_TEXT_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('legalText', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getLegalTextCall(accountId, silent),
                    (legalTextPayload, isBackgroundRefresh) => ({
                        type: SUCCESS_LEGAL_TEXT_ACTION,
                        legalTextPayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    profilePictureData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_PROFILE_PICTURE_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('profilePicture', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getProfilePictureCall(accountId, silent),
                    (profilePicturePayload, isBackgroundRefresh) => ({
                        type: SUCCESS_PROFILE_PICTURE_ACTION,
                        profilePicturePayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    customReportNames = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_CUSTOM_REPORTS),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('customReportNames', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getCustomReportNamesCall(accountId, silent),
                    (customReportNamesResponse, isBackgroundRefresh) => ({
                        type: GET_CUSTOM_REPORTS_SUCCESS,
                        customReportNamesResponse,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    selfRegistrationLinkData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SELF_REGISTRATION_LINK_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('selfRegLinks', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getSelfRegistrationLinkCall(accountId, silent),
                    (selfRegistrationLinkPayload, isBackgroundRefresh) => ({
                        type: SUCCESS_SELF_REGISTRATION_LINK_ACTION,
                        selfRegistrationLinkPayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    // Not cached: the success mapper here conditionally dispatches GET_SUBSCRIPTION_URL_DETAILS_ACTION
    // instead of a single success action - see SETTINGS_PAGE_CACHE_PLAN.md §3.3 Phase 2.
    subscriptionAccountData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SUBSCRIPTION_ACCOUNT_ACTION),
            mergeMap(({ accountId }) =>
                this.settingsService.getSubscriptionAccountCall(accountId).pipe(
                    map((response: any) =>
                        response?.body?.data[0]?.subscriptionId
                            ? {
                                  type: GET_SUBSCRIPTION_URL_DETAILS_ACTION,
                                  subscriptionId: response?.body?.data[0]?.subscriptionId,
                                  subscriptionAccountPayload: response,
                              }
                            : {
                                  type: SUCCESS_SUBSCRIPTION_ACCOUNT_ACTION,
                                  subscriptionAccountPayload: response,
                              }
                    ),
                    catchApiError((error) => ({
                        type: SUCCESS_SUBSCRIPTION_ACCOUNT_ACTION,
                        subscriptionAccountPayload: undefined,
                        error,
                    }))
                )
            )
        )
    )

    subscriptionUrlDetails = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SUBSCRIPTION_URL_DETAILS_ACTION),
            mergeMap(({ subscriptionId }) =>
                this.settingsService.getSubscriptionDetailsCall(subscriptionId).pipe(
                    map((response) => ({
                        type: SUCCESS_SUBSCRIPTION_URL_DETAILS_ACTION,
                        subscriptionUrlDetailsPayload: response,
                    })),
                    catchApiError((error) => ({
                        type: SUCCESS_SUBSCRIPTION_URL_DETAILS_ACTION,
                        subscriptionUrlDetailsPayload: undefined,
                        error,
                    }))
                )
            )
        )
    )

    // Reference data (language/labels) - global, long-lived cache (24h TTL / 1h fresh window).
    languageData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_LANGUAGE_ACTION),
            mergeMap(() =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('language'),
                    this.settingsCache.scopedTo(undefined, { ttlMs: SETTINGS_STATIC_CACHE_TTL_MS, freshMs: SETTINGS_STATIC_CACHE_FRESH_MS }),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getLanguageCall(silent),
                    (languagePayload, isBackgroundRefresh) => ({
                        type: SUCCESS_LANGUAGE_ACTION,
                        languagePayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    participantLabelsData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_PARTICIPANT_LABELS_ACTION),
            mergeMap(() =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('participantLabels'),
                    this.settingsCache.scopedTo(undefined, { ttlMs: SETTINGS_STATIC_CACHE_TTL_MS, freshMs: SETTINGS_STATIC_CACHE_FRESH_MS }),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getParticipantLabelsCall(silent),
                    (participantLabelsPayload, isBackgroundRefresh) => ({
                        type: SUCCESS_PARTICIPANT_LABELS_ACTION,
                        participantLabelsPayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    userLabelsData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_USER_LABELS_ACTION),
            mergeMap(() =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('userLabels'),
                    this.settingsCache.scopedTo(undefined, { ttlMs: SETTINGS_STATIC_CACHE_TTL_MS, freshMs: SETTINGS_STATIC_CACHE_FRESH_MS }),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getUserLabelsCall(silent),
                    (userLabelsPayload, isBackgroundRefresh) => ({
                        type: SUCCESS_USER_LABELS_ACTION,
                        userLabelsPayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    deleteSelfRegistration = createEffect(() =>
        this.actions$.pipe(
            ofType(DELETE_SELF_REGISTRATION_LINK_ACTION),
            concatMap(({ params }) =>
                this.settingsService.deleteSelfRegistrationLinkCall(params).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(params), ['selfRegLinks'])),
                    map((response) => ({
                        type: DELETE_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: DELETE_SELF_REGISTRATION_LINK_FAILURE_ACTION, error, notify: true }))
                )
            )
        )
    )
    upserTagData = createEffect(() =>
        this.actions$.pipe(
            ofType(UPSERT_TAG_ACTION),
            concatMap(({ params }) =>
                this.settingsService.upsertTagCall(params).pipe(
                    tap(() => {
                        const accountId = this.accountIdOf(params)
                        // Tag edits can't reliably scope to one account from this payload -
                        // fail safe with a full clear rather than risk stale tags, matching
                        // UsersCacheStorageService.purgeAll's "simpler and safer than guessing" call.
                        if (accountId) this.settingsCache.purgeScopes(accountId, ['manageTags'])
                        else this.settingsCache.clearForCurrentUser()
                    }),
                    map((response) => ({
                        type: UPSERT_TAG_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: UPSERT_TAG_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )
    deleteTagData = createEffect(() =>
        this.actions$.pipe(
            ofType(DELETE_TAG_ACTION),
            concatMap(({ tagId }) =>
                this.settingsService.deleteTagCall(tagId).pipe(
                    // tagId carries no accountId - see upserTagData's comment on the same tradeoff.
                    tap(() => this.settingsCache.clearForCurrentUser()),
                    map((response) => ({
                        type: SUCCESS_DELETE_TAG_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: FAILURE_DELETE_TAG_ACTION, error, notify: true }))
                )
            )
        )
    )
    manageTagsData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_MANAGE_TAGS_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('manageTags', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getManageTagsCall(accountId, silent),
                    (manageTagsPayload, isBackgroundRefresh) => ({
                        type: SUCCESS_MANAGE_TAGS_ACTION,
                        manageTagsPayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    uploadProfilePicture = createEffect(() =>
        this.actions$.pipe(
            ofType(UPLOAD_PROFILE_PICTURE_ACTION),
            concatMap(({ params }) =>
                this.settingsService.uploadProfilePictureCall(params).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(params), ['profilePicture', 'users', 'userRole'])),
                    map((response) => ({
                        type: SUCCESS_UPLOAD_PROFILE_PICTURE_ACTION,
                        uploadProfilePayload: response,
                    })),
                    catchApiError((error) => ({ type: FAILURE_UPLOAD_PROFILE_PICTURE_ACTION, error, notify: true }))
                )
            )
        )
    )

    // Prefills the edit form - correctness over speed, left uncached (see plan §3.3 Phase 2).
    getSelfRegistrationLink = createEffect(() =>
        this.actions$.pipe(
            ofType(SET_EDIT_REGISTRATION_LINK_ACTION),
            mergeMap(({ accountId, linkId }) =>
                this.settingsService.getSelfRegistrationLink(accountId, linkId).pipe(
                    map((response) => ({
                        type: SET_EDIT_REGISTRATION_LINK_SUCCESS_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({
                        type: SET_EDIT_REGISTRATION_LINK_SUCCESS_ACTION,
                        response: undefined,
                        error,
                    }))
                )
            )
        )
    )
    editSelfRegistrationLink = createEffect(() =>
        this.actions$.pipe(
            ofType(EDIT_SELF_REGISTRATION_LINK_ACTION),
            concatMap(({ data }) =>
                this.settingsService.editSelfRegistrationLink(data).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(data), ['selfRegLinks'])),
                    map((response) => ({
                        type: EDIT_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: EDIT_SELF_REGISTRATION_LINK_FAILURE_ACTION, error, notify: true }))
                )
            )
        )
    )

    uploadAccountLogo = createEffect(() =>
        this.actions$.pipe(
            ofType(UPLOAD_ACCOUNT_LOGO_ACTION),
            concatMap(({ params }) =>
                this.settingsService.uploadAccountLogoCall(params).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(params), ['profilePicture', 'accountDetails'])),
                    map((response) => ({
                        type: SUCCESS_UPLOAD_ACCOUNT_LOGO_ACTION,
                        accountLogoPayload: response,
                    })),
                    catchApiError((error) => ({ type: FAILURE_UPLOAD_ACCOUNT_LOGO_ACTION, error, notify: true }))
                )
            )
        )
    )

    getFacilitators = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_FACILITATORS_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('facilitators', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getFacilitators(accountId, silent),
                    (response, isBackgroundRefresh) => ({
                        type: GET_FACILITATORS_SUCCESS_ACTION,
                        response,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )

    saveSelfRegistrationLink = createEffect(() =>
        this.actions$.pipe(
            ofType(SAVE_SELF_REGISTRATION_LINK_ACTION),
            concatMap(({ data }) =>
                this.settingsService.saveSelfRegistrationLink(data).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(data), ['selfRegLinks'])),
                    map((response) => ({
                        type: SAVE_SELF_REGISTRATION_LINK_SUCCESS_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: SAVE_SELF_REGISTRATION_LINK_FAILURE_ACTION, error, notify: true }))
                )
            )
        )
    )
    editAccount = createEffect(() =>
        this.actions$.pipe(
            ofType(EDIT_ACCOUNT_DETAILS_ACTION),
            concatMap(({ data }) =>
                this.settingsService.editAccountDetails(data).pipe(
                    tap((response: any) => {
                        this.settingsCache.purgeScopes(this.accountIdOf(data), ['legalText', 'dynamicWelcome'])
                        // 'allAccounts' is a global-bucket scope (see SettingsCacheStorageService.buildKey),
                        // not account-scoped, so it must be purged separately from the account-scoped list above.
                        this.settingsCache.purgeScopes(undefined, ['allAccounts'])
                        // The edit-account response only contains the fields that were submitted, not the
                        // full account DTO - merge (not replace) onto the stored account object here, inside
                        // the effect, so localStorage is already correct before EDIT_ACCOUNT_DETAILS_SUCCESS_ACTION
                        // reaches any subscriber (nav-bar, account.component, etc). Removes the race where each
                        // subscriber previously guessed at read-after-write ordering independently.
                        if (response?.body?.data) this.settingsService.mergeAndPersistAccountObject(response.body.data)
                    }),
                    map((response) => ({
                        type: EDIT_ACCOUNT_DETAILS_SUCCESS_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: EDIT_ACCOUNT_DETAILS_FAILURE_ACTION, error, notify: true }))
                )
            )
        )
    )

    updateDefaultToggle = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_DEFAULT_TOGGLE_ACTION),
            concatMap(({ data }) =>
                this.settingsService.updateDefaultToggleCall(data).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(data), ['defaultToggle'])),
                    map((response) => ({
                        type: UPDATE_DEFAULT_TOGGLE_ACTION_SUCCESS,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: UPDATE_DEFAULT_TOGGLE_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )

    getDefaultToggle = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_DEFAULT_TOGGLE_ACTION),
            mergeMap(({ personId, accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('defaultToggle', accountId, { personId }),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getDefaultToggleCall(personId, accountId, silent),
                    (getDefaultToggleResponse, isBackgroundRefresh) => ({
                        type: GET_DEFAULT_TOGGLE_ACTION_SUCCESS,
                        getDefaultToggleResponse,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )

    editProfile = createEffect(() =>
        this.actions$.pipe(
            ofType(EDIT_PROFILE_ACTION),
            concatMap(({ data }) =>
                this.settingsService.editProfile(data).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(data), ['profilePicture', 'users', 'userRole'])),
                    map((response) => ({
                        type: EDIT_PROFILE_SUCCESS_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: EDIT_PROFILE_FAILURE_ACTION, error, notify: true }))
                )
            )
        )
    )

    // Global reference data - long-lived cache (24h TTL / 1h fresh window).
    getUserRoles = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_USER_ROLES_ACTION),
            mergeMap(() =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('userRoles'),
                    this.settingsCache.scopedTo(undefined, { ttlMs: SETTINGS_STATIC_CACHE_TTL_MS, freshMs: SETTINGS_STATIC_CACHE_FRESH_MS }),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getUserRolesCall(silent),
                    (userRolesPayload, isBackgroundRefresh) => ({
                        type: SUCCESS_USER_ROLES_ACTION,
                        userRolesPayload,
                        isBackgroundRefresh,
                    }),
                    // Restores a message this endpoint showed before this migration ("Error
                    // Loading ... Roles") - a cold-cache-miss failure here left the roles dropdown
                    // silently empty with no explanation.
                    (error) => ({
                        type: FAILURE_USER_ROLES_ACTION,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.lastRefreshedAt
                )
            )
        )
    )

    getUserRole = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_USER_ROLE_ACTION),
            mergeMap((payload: any) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('userRole', payload?.accountId, { personId: payload?.personId, status: payload?.status }),
                    this.settingsCache.scopedTo(payload?.accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getUserRoleCall(payload, silent),
                    (userRolePayload, isBackgroundRefresh) => ({
                        type: GET_USER_ROLE_ACTION_SUCCESS,
                        userRolePayload,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    getUsers = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_USERS_ACTION),
            mergeMap(({ accountId, status, isFidelityLogin }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('users', accountId, { status }),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getUsersCall(accountId, status, silent),
                    (response: any, isBackgroundRefresh) => {
                        let modifiedResponse: any = {}
                        if (response) {
                            modifiedResponse = { ...response }
                        }
                        modifiedResponse['isFidelityLogin'] = isFidelityLogin
                        return {
                            type: SUCCESS_USERS_ACTION,
                            usersPayload: modifiedResponse,
                            isBackgroundRefresh,
                        }
                    },
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )
    deleteUsers = createEffect(() =>
        this.actions$.pipe(
            ofType(DELETE_USER_ROLE_ACTION),
            concatMap(({ accountId, personId }) =>
                this.settingsService.deleteUserRoleCall(accountId, personId).pipe(
                    tap(() => {
                        this.settingsCache.purgeScopes(accountId, ['users', 'userRole', 'facilitators'])
                        this.usersCache.purgeAll()
                    }),
                    map((response) => ({
                        type: SUCCESS_DELETE_USER_ROLE_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: FAILURE_DELETE_USER_ROLE_ACTION, error, notify: true }))
                )
            )
        )
    )
    updateUserRole = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_USER_ROLE_ACTION),
            concatMap(({ data }) =>
                this.settingsService.updateUserRoleCall(data).pipe(
                    tap(() => {
                        const accountId = this.accountIdOf(data)
                        if (accountId) this.settingsCache.purgeScopes(accountId, ['users', 'userRole', 'facilitators'])
                        else this.settingsCache.clearForCurrentUser()
                        this.usersCache.purgeAll()
                    }),
                    map((response) => ({
                        type: SUCCESS_UPDATE_USER_ROLE_ACTION,
                        response: response,
                    })),
                    catchApiError((error) => ({ type: FAILURE_UPDATE_USER_ROLE_ACTION, error, notify: true }))
                )
            )
        )
    )
    getSubscriptionName = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SUBSCRIPTION_NAME_ACTION),
            mergeMap(({ accountId, isFidelityLogin }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('subscriptionName', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getSubscriptionNameCall(accountId, silent),
                    (response: any, isBackgroundRefresh) => {
                        let modifiedResponse: any = {}
                        if (response) {
                            modifiedResponse = { ...response }
                        }
                        modifiedResponse['isFidelityLogin'] = isFidelityLogin
                        return {
                            type: GET_SUBSCRIPTION_NAME_SUCCESS_ACTION,
                            subscriptionNamePayload: modifiedResponse,
                            isBackgroundRefresh,
                        }
                    },
                    (error) => ({ type: GET_SUBSCRIPTION_NAME_FAILURE_ACTION, error }),
                    this.lastRefreshedAt
                )
            )
        )
    )

    getUsersList = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_USERS_LIST_ACTION),
            mergeMap((body) =>
                this.settingsService.getUsersListCall(body).pipe(
                    map((response) => ({
                        type: SUCCESS_GET_USERS_LIST_ACTION,
                        usersListResponse: response,
                    })),
                    catchApiError((error) => ({
                        type: FAILURE_GET_USERS_LIST_ACTION,
                        error,
                        notify: true,
                    }))
                )
            )
        )
    )
    geTopLevelSearchUsers = createEffect(() =>
        this.actions$.pipe(
            ofType(TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION),
            mergeMap((body) =>
                this.settingsService.getTopLevelAdminSearchUsersCall(body).pipe(
                    map((response) => ({
                        type: TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION_SUCCESS,
                        topLevelUsersSearchResponse: response,
                    })),
                    catchApiError((error) => ({
                        type: TOP_LEVEL_ADMIN_SEARCH_USERS_ACTION_SUCCESS,
                        topLevelUsersSearchResponse: undefined,
                        error,
                        notify: true,
                    }))
                )
            )
        )
    )
    getAccountSubscriptionDetail = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ACCOUNT_SUBSCRIPTION_DETAILS_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('accountSubscription', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getAccountSubscriptionDetail(accountId, silent),
                    (response, isBackgroundRefresh) => ({
                        type: GET_ACCOUNT_SUBSCRIPTION_DETAILS_SUCCESS_ACTION,
                        response,
                        isBackgroundRefresh,
                    }),
                    // Restores a message this endpoint showed before this migration ("Unable to
                    // get Account Subscription Details") - a cold-cache-miss failure here left
                    // seat counts silently blank/zero with no explanation, on both this page and
                    // the nav bar's own subscription check.
                    (error) => ({
                        type: GET_ACCOUNT_SUBSCRIPTION_DETAILS_FAILURE_ACTION,
                        error: ensureApiError(error),
                        notify: true,
                    }),
                    this.lastRefreshedAt
                )
            )
        )
    )

    inviteNewUsers = createEffect(() =>
        this.actions$.pipe(
            ofType(INVITE_NEW_USER_ACTION),
            concatMap((data: any) =>
                this.settingsService.inviteNewUsers(data).pipe(
                    tap(() => {
                        const accountId = this.accountIdOf(data?.payload) ?? this.accountIdOf(data)
                        if (accountId) this.settingsCache.purgeScopes(accountId, ['users', 'userRole', 'facilitators'])
                        else this.settingsCache.clearForCurrentUser()
                    }),
                    map((response) => ({
                        type: INVITE_NEW_USER_SUCCESS_ACTION,
                        response,
                    })),
                    catchApiError((error) => ({ type: INVITE_NEW_USER_FAILURE_ACTION, error }))
                )
            )
        )
    )

    upsertLegalTextAction = createEffect(() =>
        this.actions$.pipe(
            ofType(UPSERT_LEGAL_TEXT_ACTION),
            concatMap(({ legalTextPayload }) =>
                this.settingsService.upsertLegalTextCall(legalTextPayload).pipe(
                    map((response) => ({
                        type: UPSERT_LEGAL_TEXT_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: UPSERT_LEGAL_TEXT_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )

    saveSubscriptionComponent = createEffect(() =>
        this.actions$.pipe(
            ofType(SAVE_SUBSCRIPTION_COMPONENT_ACTION),
            concatMap(({ subscriptionId }) =>
                this.settingsService.saveSubscriptionComponentCall(subscriptionId).pipe(
                    // subscriptionId, not accountId, is all this action carries - can't scope
                    // precisely, so fail safe with a full clear (see upserTagData's comment).
                    tap(() => this.settingsCache.clearForCurrentUser()),
                    map((response) => ({
                        type: SAVE_SUBSCRIPTION_COMPONENT_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: SAVE_SUBSCRIPTION_COMPONENT_ACTION_FAILURE, error }))
                )
            )
        )
    )

    updateReportName = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_CUSTOM_REPORT_NAME_ACTION),
            concatMap(({ payload }) =>
                this.settingsService.updateCustomReportNameCall(payload).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(payload), ['customReportNames'])),
                    map((response) => ({
                        type: UPDATE_CUSTOM_REPORT_NAME_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: UPDATE_CUSTOM_REPORT_NAME_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )

    resetPassword = createEffect(() =>
        this.actions$.pipe(
            ofType(RESET_PASSWORD_ACTION),
            concatMap(({ personId }) =>
                this.settingsService.resetPasswordCall(personId).pipe(
                    map((response) => ({
                        type: RESET_PASSWORD_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: RESET_PASSWORD_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )

    getTopLevelAdmin = createEffect(() =>
        this.actions$.pipe(
            ofType(GRANT_TOP_LEVEL_ADMIN_ACTION),
            concatMap(({ payload }) =>
                this.settingsService.grantTopLevelAdminCall(payload).pipe(
                    tap(() => {
                        const accountId = this.accountIdOf(payload)
                        if (accountId) this.settingsCache.purgeScopes(accountId, ['users', 'userRole'])
                        else this.settingsCache.clearForCurrentUser()
                    }),
                    map((response) => ({
                        type: GRANT_TOP_LEVEL_ADMIN_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: GRANT_TOP_LEVEL_ADMIN_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )

    saveUserToAccount = createEffect(() =>
        this.actions$.pipe(
            ofType(SAVE_USER_TO_ACCOUNT_ACTION),
            concatMap((participantPayload: any) =>
                this.settingsService.saveUserToAccountCall(participantPayload).pipe(
                    tap(() => {
                        const accountId = this.accountIdOf(participantPayload?.participantPayload) ?? this.accountIdOf(participantPayload)
                        if (accountId) this.settingsCache.purgeScopes(accountId, ['users', 'userRole', 'facilitators'])
                        else this.settingsCache.clearForCurrentUser()
                        this.usersCache.purgeAll()
                    }),
                    map((response) => ({
                        type: SAVE_USER_TO_ACCOUNT_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: SAVE_USER_TO_ACCOUNT_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )

    getAllAccounts = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ALL_ACCOUNTS_ACTION),
            mergeMap(() =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('allAccounts'),
                    this.settingsCache.scopedTo(undefined, { ttlMs: SETTINGS_STATIC_CACHE_TTL_MS, freshMs: SETTINGS_STATIC_CACHE_FRESH_MS }),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getAllAccountsCall(silent),
                    (allAccountsResponse, isBackgroundRefresh) => ({
                        type: GET_ALL_ACCOUNTS_ACTION_SUCCESS,
                        allAccountsResponse,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )

    updateCompletionEmailSettings = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION),
            concatMap((payload) =>
                this.settingsService.updateCompletionEmailSettingsCall(payload).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(payload), ['completionEmail'])),
                    map((response) => ({
                        type: UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS,
                        updateCompletionEmailSettingsResponse: response,
                    })),
                    catchApiError((error) => ({ type: UPDATE_COMPLETION_EMAIL_SETTINGS_ACCTION_FAILURE, error }))
                )
            )
        )
    )

    getCompletionEmailSettings = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_COMPLETION_EMAIL_SETTINGS_ACCTION),
            mergeMap((payload: any) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('completionEmail', payload?.accountId),
                    this.settingsCache.scopedTo(payload?.accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getCompletionEmailSettingsCall(payload, silent),
                    (completionEmailSettingsResponse, isBackgroundRefresh) => ({
                        type: GET_COMPLETION_EMAIL_SETTINGS_ACCTION_SUCCESS,
                        completionEmailSettingsResponse,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )

    updateCustomizeEmailText = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION),
            concatMap((payload) =>
                this.settingsService.updateCustomizeEmailTextCall(payload).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(payload), ['customizeEmailText'])),
                    map((response) => ({
                        type: UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS,
                        updateCustomizeEmailTextResponse: response,
                    })),
                    catchApiError((error) => ({ type: UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_FAILURE, error, notify: true }))
                )
            )
        )
    )

    getCustomizeEmailText = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_CUSTOMIZE_EMAIL_TEXT_ACTION),
            mergeMap((payload: any) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('customizeEmailText', payload?.accountId),
                    this.settingsCache.scopedTo(payload?.accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getCustomizeEmailTextCall(payload, silent),
                    (customizeEmailTextResponse, isBackgroundRefresh) => ({
                        type: GET_CUSTOMIZE_EMAIL_TEXT_ACTION_SUCCESS,
                        customizeEmailTextResponse,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )

    getParticipantAccounts = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_PARTICIPANT_ACCOUNTS_ACTION),
            mergeMap(({ personId }) =>
                this.settingsService.getParticipantAccountsCall(personId).pipe(
                    map((response) => ({
                        type: GET_PARTICIPANT_ACCOUNTS_ACTION_SUCCESS,
                        participantAllAccounts: response,
                    })),
                    // Previously had no catchError at all - a failure escaped this effect entirely
                    // (NgRx logs it and resubscribes), leaving getParticipantAccountsLoading stuck
                    // true forever. This endpoint never had a bespoke message before this
                    // migration, so stay silent (no notify) - just reset the loading flag via the
                    // existing success reducer case.
                    catchError(() =>
                        of({
                            type: GET_PARTICIPANT_ACCOUNTS_ACTION_SUCCESS,
                            participantAllAccounts: undefined,
                        })
                    )
                )
            )
        )
    )

    zapierSyncAll = createEffect(() =>
        this.actions$.pipe(
            ofType(ZAPIER_SYNC_ALL_ACTION),
            concatMap(({ accountId }) =>
                this.settingsService.zapierSyncAllCall(accountId).pipe(
                    map((response) => ({
                        type: ZAPIER_SYNC_ALL_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: ZAPIER_SYNC_ALL_ACTION_FAILURE, error }))
                )
            )
        )
    )

    checkZapierBulkStatus = createEffect(() =>
        this.actions$.pipe(
            ofType(CHECK_ZAPIER_BULK_STATUS_ACTION),
            mergeMap(({ accountId }) => {
                return this.settingsService.checkZapierBulkStatusCall(accountId).pipe(
                    map((response) => ({
                        type: CHECK_ZAPIER_BULK_STATUS_ACTION_SUCCESS,
                        response,
                    })),
                    // Previously had no catchError at all - a failure escaped this effect entirely,
                    // leaving checkStatusLoading stuck true forever (worse here since this is a
                    // poll-style status check - the user sees "checking..." indefinitely). This
                    // endpoint never had a bespoke message before this migration, so stay silent
                    // (no notify) - just reset the loading flag via the existing success reducer case.
                    catchError(() =>
                        of({
                            type: CHECK_ZAPIER_BULK_STATUS_ACTION_SUCCESS,
                            response: undefined,
                        })
                    )
                )
            })
        )
    )

    getDynamicWelcome = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_DYNAMIC_WELCOME_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    this.settingsCache.buildKey('dynamicWelcome', accountId),
                    this.settingsCache.scopedTo(accountId),
                    this.inFlightRefreshes,
                    (silent) => this.settingsService.getDynamicWelcome(accountId, silent),
                    (response, isBackgroundRefresh) => ({
                        type: GET_DYNAMIC_WELCOME_ACTION_SUCCESS,
                        response,
                        isBackgroundRefresh,
                    }),
                    undefined,
                    this.lastRefreshedAt
                )
            )
        )
    )

    updateDynamicWelcome = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_DYNAMIC_WELCOME_ACTION),
            concatMap(({ body }) =>
                this.settingsService.updateDynamicWelcome(body).pipe(
                    tap(() => this.settingsCache.purgeScopes(this.accountIdOf(body), ['dynamicWelcome'])),
                    map((response: any) => ({
                        type: UPDATE_DYNAMIC_WELCOME_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => ({ type: UPDATE_DYNAMIC_WELCOME_ACTION_FAILURE, error }))
                )
            )
        )
    )

    constructor(
        private actions$: Actions,
        private settingsService: SettingsService,
        private settingsCache: SettingsCacheStorageService,
        private usersCache: UsersCacheStorageService
    ) {}
}
