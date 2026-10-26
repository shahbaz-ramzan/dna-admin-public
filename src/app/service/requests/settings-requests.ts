import { Inject, Injectable } from '@angular/core'
import K from 'src/app/constants/index'
import Request from 'src/app/service/requests'
@Injectable({
    providedIn: 'root',
})
export class SettingsRequests extends Request {
    constructor(@Inject('params') private params: any) {
        super(params)
    }

    static getLegalText(accountId: string) {
        return new Request(K.NETWORK.URL.GET_LEGAL_TEXT + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getSelfRegistrationLinks(accountId: string) {
        return new Request(K.NETWORK.URL.GET_SELF_REGISTRATION_LINK + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getSelfRegistrationLink(accountId: number, linkId: number) {
        return new Request(K.NETWORK.URL.GET_SINGLE_SELF_REGISTRATION_LINK + '/' + linkId + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getDefaultLanguage() {
        return new Request(K.NETWORK.URL.GET_LANGUAGE + '/', K.NETWORK.METHOD.GET)
    }
    static getParticipantLabels() {
        return new Request(K.NETWORK.URL.GET_PARTICIPANT_LABELS + '/', K.NETWORK.METHOD.GET)
    }
    static getUserLabels() {
        return new Request(K.NETWORK.URL.GET_USER_LABELS + '/', K.NETWORK.METHOD.GET)
    }

    static deleteSelfRegistrationLinks(params: any) {
        return new Request(K.NETWORK.URL.DELETE_SELF_REGISTRATION_LINK + '/', K.NETWORK.METHOD.DELETE, params)
    }

    static uploadProfilePicture(params: any) {
        const formData = new FormData()
        formData.append('fileUpload', params.profilePicture)
        return new Request(K.NETWORK.URL.UPLOAD_PROFILE_PICTURE + '/' + params.personId, K.NETWORK.METHOD.POST, formData)
    }

    static uploadAccountLogo(params: any) {
        const formData = new FormData()
        formData.append('fileUpload', params.accountLogo)
        return new Request(K.NETWORK.URL.UPLOAD_ACCOUNT_LOGO + '/' + params.accountId, K.NETWORK.METHOD.POST, formData, {
            'Content-Type': 'multipart/form-data',
        })
    }

    static getManageTags(accountId: string) {
        return new Request(K.NETWORK.URL.GET_MANAGE_TAGS + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static getProfilePicture(accountId: string) {
        return new Request(K.NETWORK.URL.GET_PROFILE_PICTURE + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getCustomReportNames(accountId: string) {
        return new Request(K.NETWORK.URL.GET_CUSTOM_REPORT_NAMES + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static upsertTag(params: any) {
        return new Request(K.NETWORK.URL.UPSERT_TAG, K.NETWORK.METHOD.POST, params)
    }
    static deleteTag(tagId: number) {
        return new Request(K.NETWORK.URL.DELETE_TAG + '/' + tagId, K.NETWORK.METHOD.DELETE)
    }

    static getSubscriptionAccount(accountId: string) {
        return new Request(K.NETWORK.URL.GET_SUBSCRIPTION_ACCOUNT + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static getSubscriptionDetails(subscriptionId: string) {
        return new Request(K.NETWORK.URL.GET_SUBSCRIPTION_DETAILS + '/' + subscriptionId, K.NETWORK.METHOD.GET)
    }

    static getFacilitators(accountId: string) {
        return new Request(K.NETWORK.URL.GET_FACILITATORS + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static saveSelfRegistrationLink(data: any) {
        return new Request(K.NETWORK.URL.SAVE_SELF_REGISTRATION_LINK, K.NETWORK.METHOD.POST, data)
    }

    static editSelfRegistrationLink(data: any) {
        return new Request(K.NETWORK.URL.EDIT_SELF_REGISTRATION_LINK, K.NETWORK.METHOD.PUT, data)
    }
    static editAccountDetail(data: any) {
        return new Request(K.NETWORK.URL.EDIT_ACCOUNT_DETAILS, K.NETWORK.METHOD.POST, data)
    }

    static updateDefaultToggle(data: any) {
        return new Request(K.NETWORK.URL.UPDATE_DEFAULT_TOGGLE, K.NETWORK.METHOD.PUT, data)
    }
    static getDefaultToggle(personId: string, accountId: number) {
        return new Request(K.NETWORK.URL.GET_DEFAULT_TOGGLE + '/' + personId + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static editProfile(data: any) {
        return new Request(K.NETWORK.URL.UPDATE_PROFILE, K.NETWORK.METHOD.PUT, data)
    }
    static getUserRoles() {
        return new Request(K.NETWORK.URL.GET_USER_ROLE_TYPES, K.NETWORK.METHOD.GET)
    }
    static getUserRole(payload: any) {
        return new Request(K.NETWORK.URL.GET_USER_ROLE + '/' + payload?.personId + '/' + payload?.accountId + '/' + payload?.status, K.NETWORK.METHOD.GET)
    }

    static updateCompletionEmailSettings(payload: any) {
        return new Request(K.NETWORK.URL.UPDATE_COMPLETION_EMAIL_SETTINGS, K.NETWORK.METHOD.POST, payload)
    }

    static getCompletionEmailSettings(payload: any) {
        return new Request(K.NETWORK.URL.GET_COMPLETION_EMAIL_SETTINGS + '/' + payload.accountId, K.NETWORK.METHOD.GET)
    }

    static updateCustomizeEmailText(payload: any) {
        return new Request(K.NETWORK.URL.UPDATE_CUSTOMIZE_EMAIL_TEXT, K.NETWORK.METHOD.POST, payload)
    }

    static getCustomizeEmailText(payload: any) {
        return new Request(K.NETWORK.URL.GET_CUSTOMIZE_EMAIL_TEXT + '/' + payload.accountId, K.NETWORK.METHOD.GET)
    }
    static getUsers(accountId: string, status: string) {
        return new Request(K.NETWORK.URL.GET_USER_ROLE_BY_ACCOUNT + '/' + accountId + '/' + status, K.NETWORK.METHOD.GET)
    }
    static deleteUserRole(accountId: string, personId: string) {
        return new Request(K.NETWORK.URL.DELETE_USER_ROLE + '/' + personId + '/' + accountId, K.NETWORK.METHOD.DELETE)
    }
    static updateUserRole(data: any) {
        return new Request(K.NETWORK.URL.UPDATE_USER_ROLE, K.NETWORK.METHOD.POST, data)
    }
    static getSubscriptionName(accountId: string) {
        return new Request(K.NETWORK.URL.GET_SUBSCRIPTION_NAME + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static getUsersList(body: any) {
        return new Request(K.NETWORK.URL.GET_USERS_LIST, K.NETWORK.METHOD.POST, body)
    }

    static getTopLevelAdminSearchUsers(body: any) {
        return new Request(K.NETWORK.URL.TOP_LEVEL_ADMIN_SEARCH_PARTICIPANT, K.NETWORK.METHOD.POST, body)
    }

    static inviteNewUsers(data: any) {
        return new Request(K.NETWORK.URL.INVITE_NEW_USERS, K.NETWORK.METHOD.POST, data)
    }
    static getAccountSubscriptionDetail(accountId: string) {
        return new Request(K.NETWORK.URL.GET_ACCOUNT_SUBSCRIPTION_DETAILS + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static upsertLegalText(legalTextPayload: any) {
        return new Request(K.NETWORK.URL.UPSERT_LEGAL_TEXT, K.NETWORK.METHOD.POST, legalTextPayload)
    }

    static saveSubscriptionComponent(subscriptionId: string) {
        return new Request(K.NETWORK.URL.SAVE_SUBSCRIPTION_COMPONENT + '/' + subscriptionId, K.NETWORK.METHOD.POST)
    }

    static updateCustomReportName(payload: any) {
        return new Request(K.NETWORK.URL.UPDATE_CUSTOM_REPORT_NAME, K.NETWORK.METHOD.POST, payload)
    }

    static resetPassword(personId: any) {
        return new Request(K.NETWORK.URL.RESET_PASSWORD + '/' + personId, K.NETWORK.METHOD.POST)
    }

    static grantTopLevelAdmin(accountId: string) {
        return new Request(K.NETWORK.URL.GRANT_TOP_LEVEL_ACCESS + '/' + accountId, K.NETWORK.METHOD.POST)
    }
    static getAllAccounts() {
        return new Request(K.NETWORK.URL.GET_ALL_ACCOUNTS, K.NETWORK.METHOD.GET)
    }

    static getParticipantAccounts(personId: string) {
        return new Request(K.NETWORK.URL.GET_PARTICIPANT_ACCOUNTS + '/' + personId + '/' + true, K.NETWORK.METHOD.GET)
    }
    static saveUserToAccount(body: any) {
        return new Request(K.NETWORK.URL.SAVE_USER_TO_ACCOUNT, K.NETWORK.METHOD.POST, body)
    }

    static zapierSyncAll(accountId: any) {
        return new Request(K.NETWORK.URL.ZAPIER_SYNC_ALL + '/' + accountId)
    }

    static checkZapierBulkStatu(accountId: any) {
        return new Request(K.NETWORK.URL.CHECK_ZAPIER_BULK_STATUS + '/' + accountId)
    }

    static getDynamicWelcome(accountId: number) {
        return new Request(K.NETWORK.URL.GET_DYNAMIC_WELCOME + '/' + accountId, K.NETWORK.METHOD.GET, {}, {}, '', true)
    }

    static updateDynamicWelcome(body: any) {
        return new Request(K.NETWORK.URL.UPDATE_DYNAMIC_WELCOME + '/', K.NETWORK.METHOD.POST, body)
    }
}
