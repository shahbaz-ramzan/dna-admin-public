export class MockSettingsService {
    getLegalTextCall(accountId: string) {
        return 'legal text call'
    }
    getLanguageCall() {
        return 'language call'
    }
    getParticipantLabelsCall() {
        return 'participation labels call'
    }
    getUserLabelsCall() {
        return 'user labels call'
    }
    deleteSelfRegistrationLinkCall(params: any) {
        return 'delete self registration link call'
    }
    getSelfRegistrationLinkCall(accountId: string) {
        return 'self registration link call'
    }

    upsertTagCall(params: any) {
        return 'upsert tag call'
    }
    deleteTagCall(tagId: number) {
        return 'delete tag call'
    }
    getManageTagsCall(accountId: string) {
        return 'get manage tags call'
    }
    getSubscriptionAccountCall(accountId: string) {
        return 'get subscription account call'
    }

    getSubscriptionDetailsCall(subscriptionId: string) {
        return 'get sub details call'
    }

    uploadProfilePictureCall(params: any) {
        return 'upload profile picture call'
    }
    getProfilePictureCall(params: any) {
        return 'get profile pic call'
    }

    getCustomReportNamesCall(params: any) {
        return 'custom report names call'
    }

    uploadAccountLogoCall(params: any) {
        return 'Upload Account Logo Call'
    }

    getFacilitators(accountId: string) {
        return 'get  facilitators'
    }

    saveSelfRegistrationLink(data: any) {
        return 'save  self registration link'
    }

    getSelfRegistrationLink(accountId: number, linkId: number) {
        return `Get Self Registration Link ${linkId}`
    }

    editSelfRegistrationLink(data: any) {
        return 'edit Self Registration Link'
    }

    editAccountDetails(data: any) {
        return 'edit acc details'
    }
    updateDefaultToggleCall(data: any) {
        return 'update default toggle call'
    }
    getDefaultToggleCall(personId: string, accountId: number) {
        return `${personId} Default Toggle for ${accountId}`
    }
    editProfile(data: any) {
        return 'Edit Profile'
    }

    getUserRolesCall() {
        return 'user roles'
    }
    getUserRoleCall(payload: any) {
        return `User Role - ${payload.userId}, ${payload.accountId}`
    }

    updateCompletionEmailSettingsCall(payload: any) {
        return payload
    }

    getCompletionEmailSettingsCall(payload: any) {
        return payload
    }

    updateCustomizeEmailTextCall(payload: any) {
        return payload
    }

    getCustomizeEmailTextCall(payload: any) {
        return payload
    }

    getUsersCall(accountId: string, status: string) {
        return `users?status=${status}&accountid=${accountId}`
    }

    deleteUserRoleCall(accountId: string, personId: string) {
        return `delete user role from account id ${accountId} with person Id ${personId}`
    }
    updateUserRoleCall(data: any) {
        return data
    }
    getSubscriptionNameCall(accountId: string) {
        return `subscriptions/${accountId}/name`
    }

    getAccountSubscriptionDetail(accountId: string) {
        return `https://api.account.onshape.com/api/customer/v1/core/accounts/${accountId}/subscription`
    }

    getUsersListCall(body: any) {
        return body
    }

    getTopLevelAdminSearchUsersCall(body: any) {
        return body
    }

    upsertLegalTextCall(legalTextPayload: any) {
        return legalTextPayload
    }

    inviteNewUsers(data: any) {
        return data
    }

    saveSubscriptionComponentCall(subscriptionId: string) {
        return subscriptionId
    }

    updateCustomReportNameCall(payload: any) {
        return payload
    }
    resetPasswordCall(personId: any) {
        return personId
    }

    grantTopLevelAdminCall(accountId: any) {
        return accountId
    }

    getAllAccountsCall() {
        return 'all accounts call'
    }
    getParticipantAccountsCall(personId: string) {
        return personId
    }
    saveUserToAccountCall(body: any) {
        return body
    }

    zapierSyncAllCall(accountId: any) {
        return accountId
    }

    checkZapierBulkStatusCall(accountId: any) {
        return accountId
    }

    getDynamicWelcome(accountId: number) {
        return accountId
    }

    updateDynamicWelcome(body: any) {
        return body
    }

    convertRegistrationLinkToLocalFormData() {
        return {}
    }

    prepareRegistrationPayload() {
        return {}
    }

    convertAccountInfoToLocalFormDta() {
        return {}
    }

    prepareAccountInfoPayload() {
        return {}
    }

    parseUserRole() {
        return []
    }

    parseSystemLabels() {
        return {}
    }

    updateMenuBarTab() {
        return {}
    }

    transformSubscriptionFeatures() {
        return {}
    }

    isNewPackage() {
        return {}
    }
}
