import { Injectable } from '@angular/core'
import { NetworkService } from 'src/app/service/network.service'
import K from 'src/app/constants'
import { SettingsRequests } from 'src/app/service/requests/settings-requests'
import Encryption from 'src/app/util/Encryption'

const SETTINGS_CACHE_TTL_MS = 30_000

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }
    constructor(private networkService: NetworkService) {
        this.systemLabels = this.parseSystemLabels()
    }
    getLegalTextCall(accountId: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getLegalText(accountId), 0, silent)
    }
    getLanguageCall(silent = false) {
        return this.networkService.httpCall(SettingsRequests.getDefaultLanguage(), SETTINGS_CACHE_TTL_MS, silent)
    }
    getParticipantLabelsCall(silent = false) {
        return this.networkService.httpCall(SettingsRequests.getParticipantLabels(), SETTINGS_CACHE_TTL_MS, silent)
    }
    getUserLabelsCall(silent = false) {
        return this.networkService.httpCall(SettingsRequests.getUserLabels(), SETTINGS_CACHE_TTL_MS, silent)
    }
    deleteSelfRegistrationLinkCall(params: any) {
        return this.networkService.httpCall(SettingsRequests.deleteSelfRegistrationLinks(params))
    }
    getSelfRegistrationLinkCall(accountId: string, silent = false) {
        // forceRefresh = !silent: withStaleWhileRevalidate only calls this with silent=false on a
        // genuine cache miss (cold start, or right after purgeScopes(['selfRegLinks']) on save/
        // edit/delete) - that always needs the real, current list, so it must not be served a
        // stale response by CacheInterceptor's own TTL cache for this same URL. A silent=true
        // background revalidation keeps normal caching behaviour.
        return this.networkService.httpCall(SettingsRequests.getSelfRegistrationLinks(accountId), SETTINGS_CACHE_TTL_MS, silent, !silent)
    }

    upsertTagCall(params: any) {
        return this.networkService.httpCall(SettingsRequests.upsertTag(params))
    }
    deleteTagCall(tagId: number) {
        return this.networkService.httpCall(SettingsRequests.deleteTag(tagId))
    }
    getManageTagsCall(accountId: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getManageTags(accountId), SETTINGS_CACHE_TTL_MS, silent, !silent)
    }
    getSubscriptionAccountCall(accountId: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getSubscriptionAccount(accountId), SETTINGS_CACHE_TTL_MS, silent)
    }

    getSubscriptionDetailsCall(subscriptionId: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getSubscriptionDetails(subscriptionId), SETTINGS_CACHE_TTL_MS, silent)
    }

    uploadProfilePictureCall(params: any) {
        return this.networkService.httpCall(SettingsRequests.uploadProfilePicture(params))
    }
    getProfilePictureCall(params: any, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getProfilePicture(params), SETTINGS_CACHE_TTL_MS, silent)
    }

    getCustomReportNamesCall(params: any, silent = false) {
        // forceRefresh = !silent: withStaleWhileRevalidate only calls this with silent=false on a
        // genuine cache miss (cold start, or right after purgeScopes(['customReportNames']) on save)
        // - that always needs the real, current list, so it must not be served a stale response by
        // CacheInterceptor's own TTL cache for this same URL. A silent=true background revalidation
        // keeps normal caching behaviour.
        return this.networkService.httpCall(SettingsRequests.getCustomReportNames(params), SETTINGS_CACHE_TTL_MS, silent, !silent)
    }

    uploadAccountLogoCall(params: any) {
        return this.networkService.httpCall(SettingsRequests.uploadAccountLogo(params))
    }

    getFacilitators(accountId: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getFacilitators(accountId), SETTINGS_CACHE_TTL_MS, silent)
    }

    saveSelfRegistrationLink(data: any) {
        return this.networkService.httpCall(SettingsRequests.saveSelfRegistrationLink(data))
    }

    getSelfRegistrationLink(accountId: number, linkId: number) {
        return this.networkService.httpCall(SettingsRequests.getSelfRegistrationLink(accountId, linkId))
    }

    editSelfRegistrationLink(data: any) {
        return this.networkService.httpCall(SettingsRequests.editSelfRegistrationLink(data))
    }

    editAccountDetails(data: any) {
        return this.networkService.httpCall(SettingsRequests.editAccountDetail(data))
    }
    updateDefaultToggleCall(data: any) {
        return this.networkService.httpCall(SettingsRequests.updateDefaultToggle(data))
    }
    getDefaultToggleCall(personId: string, accountId: number, silent = false) {
        // forceRefresh = !silent: same reasoning as getAllAccountsCall/getSelfRegistrationLinkCall - this
        // is re-dispatched with silent=false right after purgeScopes(['defaultToggle']) on save, and
        // must not be served a stale pre-save response from CacheInterceptor's own TTL cache.
        return this.networkService.httpCall(SettingsRequests.getDefaultToggle(personId, accountId), SETTINGS_CACHE_TTL_MS, silent, !silent)
    }
    editProfile(data: any) {
        return this.networkService.httpCall(SettingsRequests.editProfile(data))
    }

    getUserRolesCall(silent = false) {
        return this.networkService.httpCall(SettingsRequests.getUserRoles(), SETTINGS_CACHE_TTL_MS, silent)
    }
    getUserRoleCall(payload: any, silent = false) {
        // Dashboard and the always-mounted nav bar both request this on init with the same
        // params; a short cache coalesces those near-simultaneous calls into one request.
        return this.networkService.httpCall(SettingsRequests.getUserRole(payload), SETTINGS_CACHE_TTL_MS, silent)
    }

    updateCompletionEmailSettingsCall(payload: any) {
        const body = { ...payload }
        delete body.type //removing type parameter
        return this.networkService.httpCall(SettingsRequests.updateCompletionEmailSettings(body))
    }

    getCompletionEmailSettingsCall(payload: any, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getCompletionEmailSettings(payload), SETTINGS_CACHE_TTL_MS, silent)
    }

    updateCustomizeEmailTextCall(payload: any) {
        return this.networkService.httpCall(SettingsRequests.updateCustomizeEmailText(payload))
    }

    getCustomizeEmailTextCall(payload: any, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getCustomizeEmailText(payload), SETTINGS_CACHE_TTL_MS, silent)
    }

    getUsersCall(accountId: string, status: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getUsers(accountId, status), SETTINGS_CACHE_TTL_MS, silent, !silent)
    }

    deleteUserRoleCall(accountId: string, personId: string) {
        return this.networkService.httpCall(SettingsRequests.deleteUserRole(accountId, personId))
    }
    updateUserRoleCall(data: any) {
        return this.networkService.httpCall(SettingsRequests.updateUserRole(data))
    }
    getSubscriptionNameCall(accountId: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getSubscriptionName(accountId), SETTINGS_CACHE_TTL_MS, silent)
    }

    getAccountSubscriptionDetail(accountId: string, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getAccountSubscriptionDetail(accountId), SETTINGS_CACHE_TTL_MS, silent)
    }

    getUsersListCall(body: any) {
        return this.networkService.httpCall(SettingsRequests.getUsersList(body?.getUsersPayload))
    }

    getTopLevelAdminSearchUsersCall(body: any) {
        return this.networkService.httpCall(SettingsRequests.getTopLevelAdminSearchUsers(body?.payload))
    }

    upsertLegalTextCall(legalTextPayload: any) {
        return this.networkService.httpCall(SettingsRequests.upsertLegalText(legalTextPayload))
    }

    inviteNewUsers(data: any) {
        return this.networkService.httpCall(SettingsRequests.inviteNewUsers(data))
    }

    saveSubscriptionComponentCall(subscriptionId: string) {
        return this.networkService.httpCall(SettingsRequests.saveSubscriptionComponent(subscriptionId))
    }

    updateCustomReportNameCall(payload: any) {
        return this.networkService.httpCall(SettingsRequests.updateCustomReportName(payload))
    }
    resetPasswordCall(personId: any) {
        return this.networkService.httpCall(SettingsRequests.resetPassword(personId))
    }

    grantTopLevelAdminCall(accountId: any) {
        return this.networkService.httpCall(SettingsRequests.grantTopLevelAdmin(accountId))
    }

    getAllAccountsCall(silent = false) {
        // forceRefresh = !silent: see getSelfRegistrationLinkCall above - withStaleWhileRevalidate only
        // calls this with silent=false on a genuine cache miss (cold start, or right after
        // purgeScopes(undefined, ['allAccounts']) on account edit), which must not be served a stale
        // response by CacheInterceptor's own TTL cache for this same URL.
        return this.networkService.httpCall(SettingsRequests.getAllAccounts(), SETTINGS_CACHE_TTL_MS, silent, !silent)
    }
    getParticipantAccountsCall(personId: string) {
        return this.networkService.httpCall(SettingsRequests.getParticipantAccounts(personId))
    }
    saveUserToAccountCall(body: any) {
        return this.networkService.httpCall(SettingsRequests.saveUserToAccount(body.participantPayload))
    }

    zapierSyncAllCall(accountId: any) {
        return this.networkService.httpCall(SettingsRequests.zapierSyncAll(accountId))
    }

    checkZapierBulkStatusCall(accountId: any) {
        return this.networkService.httpCall(SettingsRequests.checkZapierBulkStatu(accountId))
    }

    getDynamicWelcome(accountId: number, silent = false) {
        return this.networkService.httpCall(SettingsRequests.getDynamicWelcome(accountId), SETTINGS_CACHE_TTL_MS, silent)
    }

    updateDynamicWelcome(body: any) {
        return this.networkService.httpCall(SettingsRequests.updateDynamicWelcome(body))
    }

    convertRegistrationLinkToLocalFormData(registrationLinkData: any, discoverySettings: any, advisors: any[], tagList: any[]) {
        const localForm = {
            id: registrationLinkData?.id,
            accountId: registrationLinkData?.accountId,
            link: registrationLinkData?.selfRegistrationlink,
            languageId: registrationLinkData?.languageId,
            reportId: registrationLinkData?.reportId,
            defaultLinkForAccount: registrationLinkData?.isDefault,
            tags: <any>[],
            advisor: {},
            selectedCategory: {},
            selectedSettings: <any>[],
        }

        // parsing tagsList
        tagList.forEach((tag) => {
            if (registrationLinkData?.tagsList?.filter((t: any) => t.tagId === tag.tagId).length > 0) tag.value = true
            localForm.tags.push(tag)
        })

        // parsing advisors
        localForm.advisor = advisors.filter((ad) => ad.facilitatorId === registrationLinkData.advisorPersonID)[0]

        // parsing discoverySettings
        Object.keys(discoverySettings)?.forEach((dSetting) => {
            if (Object.keys(registrationLinkData)?.includes(discoverySettings[dSetting]?.key)) {
                localForm.selectedCategory = discoverySettings[dSetting]
                const selectedCategoryKey = discoverySettings[dSetting]?.key
                const selectedCategoryObject = registrationLinkData[selectedCategoryKey]
                Object.keys(selectedCategoryObject).forEach((selectedSetting) => {
                    if (selectedCategoryObject[selectedSetting] === true) {
                        discoverySettings[dSetting].settings?.forEach((setting: any) => {
                            if (setting.key === selectedSetting) {
                                localForm.selectedSettings.push(setting)
                            }
                        })
                    }
                })
            }
        })
        return localForm
    }

    prepareRegistrationPayload(registrationForm: any, discovery: any[]) {
        let formToSubmit: any = {}
        const linkId = registrationForm.id ? +registrationForm.id : 0
        formToSubmit = {
            id: linkId,
            accountId: +registrationForm?.accountId,
            selfRegistrationlink: registrationForm?.link,
            advisorPersonID: registrationForm?.advisor?.facilitatorId,
            tagsList: [],
            isDefault: registrationForm?.defaultLinkForAccount,
        }

        // Defining Discovery Settings
        const discoverySettings: any = {}
        registrationForm.selectedCategory.settings.forEach((setting: any) => {
            discoverySettings[setting.key] = registrationForm.selectedSettings.filter((s: any) => s.key === setting.key).length > 0
        })
        if (registrationForm.selectedCategory.key === 'workTalentDashboardDto') {
            discoverySettings['isViewReport'] = true
        }
        if (registrationForm.selectedCategory.key === 'investorDashboardDto') {
            discoverySettings['isVideo'] = true
            discoverySettings['isBehavOverview'] = true
            discoverySettings['isBehavioralBiases'] = true
            discoverySettings['isMarketMood'] = true
            discoverySettings['isViewReport'] = true
        }
        discoverySettings['id'] = 0
        discoverySettings['accountId'] = +registrationForm.accountId
        discoverySettings['selfRegistrationId'] = linkId
        discoverySettings['status'] = true
        formToSubmit[registrationForm.selectedCategory.key] = discoverySettings
        // Setting remaining settings to null
        discovery.forEach((dS: any) => {
            if (dS.key != registrationForm.selectedCategory.key) formToSubmit[dS.key] = null
        })

        // Defining Tags
        registrationForm.tags.forEach((tag: any) => {
            if (tag.value === true) {
                formToSubmit.tagsList.push(tag.tagId)
            }
        })
        return formToSubmit
    }

    convertAccountInfoToLocalFormDta(accountInfo: any, languages: any[]) {
        let localForm: any = {}
        localForm = {
            accountId: accountInfo.accountId,
            accountName: accountInfo.accountName,
            cobrandingLogoPath: accountInfo.cobrandingLogoPath,
            defaultLanguage: {},
            isDefault: accountInfo.isDefault,
            isOnboardingComplete: accountInfo.isOnboardingComplete,
            namedUserLabel: accountInfo.namedUserLabel,
            participantLabel: accountInfo.participantLabel,
            defaultToggleOption: { isFDNA: accountInfo.isFDNA, defaultToggleOptionName: accountInfo.isFDNA ? 'Financial Behavior' : 'Work Talent' }, // TODO: bind proper data coming from Account Detail API
        }
        localForm.defaultLanguage = languages.filter((lan) => lan.id === accountInfo.defaultLanguageId)[0]
        return localForm
    }

    prepareAccountInfoPayload(accountInfo: any) {
        const formToSubmit = {
            personId: accountInfo?.personId,
            accountId: accountInfo?.accountId,
            accountName: accountInfo?.accountName,
            defaultLanguageId: accountInfo?.defaultLanguage?.id,
            isDefault: accountInfo?.isDefault,
            isOnboardingComplete: accountInfo?.isOnboardingComplete,
            participantLabelId: accountInfo?.participantLabel?.participantLabelId,
            namedUserLabelId: accountInfo?.namedUserLabel?.namedUserLabelId,
            isFDNA: accountInfo?.defaultToggleOption?.isFDNA,
        }
        return formToSubmit
    }

    parseUserRole(roles: any[], userRoleId: number) {
        let userRole = {}
        if (userRoleId === 1) {
            userRole = {
                name: 'Admin',
            }
        } else {
            roles.forEach((role: any) => {
                if (role.id === userRoleId) {
                    userRole = role
                    return
                }
            })
        }
        return userRole
    }

    getStoredAccountObject(): any {
        const raw = localStorage.getItem(K.APP.ACCOUNT_OBJECT)
        if (!raw) return null
        try {
            return JSON.parse(Encryption.decryptData(raw) || '')
        } catch {
            return null
        }
    }

    /**
     * Merges a partial account-update response (e.g. the edit-account API only returns the fields
     * that were submitted, not the full account DTO) onto the currently stored account object and
     * persists it - replacing outright would drop fields the response omits (isFDNA,
     * cobrandingLogoPath, etc - confirmed from the live UpdateAccountDetails response, which returns
     * only accountId/accountName/defaultLanguageId/cobrandingLogoPath/isDefault/participantLabel/
     * namedUserLabel/isOnboardingComplete, no isFDNA at all). Replacing wholesale is what caused
     * "Default toggle" to reset to "Select Option" after a save.
     */
    mergeAndPersistAccountObject(partialAccountInfo: any): any {
        const merged = { ...(this.getStoredAccountObject() || {}), ...partialAccountInfo }
        localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(merged)))
        return merged
    }

    parseSystemLabels() {
        const accountObject = this.getStoredAccountObject()
        return {
            namedUserLabel: accountObject ? accountObject?.namedUserLabel?.namedUserLabelName ?? 'Advisor' : '',
            participantLabelName: accountObject ? accountObject?.participantLabel?.participantLabelName ?? 'User' : '',
        }
    }

    transformSubscriptionFeatures(features: any) {
        const permissions: any = {}
        features?.map((feature: any) => {
            if (feature?.featuresHeading == 'Business DNA Insights') {
                const key = 'Business-' + feature.feature.replace(/[\u200B-\u200D\uFEFF]/g, '')
                permissions[key] = feature.status
            } else if (feature.featuresHeading == 'Financial DNA Insights') {
                const key = 'Financial-' + feature?.feature?.replace(/[\u200B-\u200D\uFEFF]/g, '')
                permissions[key] = feature?.status
            } else {
                permissions[feature.feature] = feature?.status
            }
        })
        return permissions
    }

    newPackages: any[] = [
        'small-business-annual-bdna',
        'professional-annual-bdna',
        'enterprise-annual-bdna',
        'small-business-monthly-bdna',
        'professional-monthly-bdna',
        'enterprise-monthly-bdna',
    ]

    isNewPackage(productHandle: string) {
        if (this.newPackages.includes(productHandle)) {
            return true
        } else return false
    }
}
