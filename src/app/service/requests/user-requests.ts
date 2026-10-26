import { Inject, Injectable } from '@angular/core'
import K from 'src/app/constants/index'
import Request from 'src/app/service/requests'
@Injectable({
    providedIn: 'root',
})
export class UserRequests extends Request {
    constructor(@Inject('params') private params: any) {
        super(params)
    }

    static getRiskBehavior(personId: string) {
        return new Request(K.NETWORK.URL.GET_RISK_BEHAVIOR + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getFDNAScore(personId: string, languageId: string) {
        return new Request(K.NETWORK.URL.GET_FDNA_SCORE + '/' + personId + '/' + languageId, K.NETWORK.METHOD.GET)
    }
    static getUniqueStyleAndDescription(personId: string, languageId: string) {
        return new Request(K.NETWORK.URL.GET_UNIQUE_STYLE_AND_DESCRIPTION + '/' + personId + '/' + languageId, K.NETWORK.METHOD.GET)
    }

    static getVideoUrl(personId: string) {
        return new Request(K.NETWORK.URL.GET_VIDEO_URL + '/' + personId, K.NETWORK.METHOD.GET)
    }

    static getWorkTalents(personId: string, languageId: string) {
        return new Request(K.NETWORK.URL.GET_WORK_TALENTS + '/' + personId + '/' + languageId, K.NETWORK.METHOD.GET)
    }
    static getBehaviralBiases(personId: string, languageId: string) {
        return new Request(K.NETWORK.URL.GET_BEHAVIRAL_BIASES + '/' + personId + '/' + languageId, K.NETWORK.METHOD.GET)
    }
    static getWorkPlaceInsight(personId: string, languageId: string) {
        return new Request(K.NETWORK.URL.GET_WORKPLACE_INSIGHT + '/' + personId + '/' + languageId, K.NETWORK.METHOD.GET)
    }
    static getFinancialStyleMatch(personId1: string, languageId2: string) {
        return new Request(K.NETWORK.URL.GET_FINANCIAL_STYLE_MATCH + '/' + personId1 + '/' + languageId2, K.NETWORK.METHOD.GET)
    }
    static getWorkStyleMatch(personId1: string, personId2: string) {
        return new Request(K.NETWORK.URL.GET_WORK_STYLE_MATCH + '/' + personId1 + '/' + personId2, K.NETWORK.METHOD.GET)
    }
    static getEnvironmentKeys(personId: string, languageId: string) {
        return new Request(K.NETWORK.URL.GET_ENVIRONMENT_KEYS + '/' + personId + '/' + languageId, K.NETWORK.METHOD.GET)
    }
    static getTScore(personId: string) {
        return new Request(K.NETWORK.URL.GET_TSCORE + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getMaraketData(stockMarketId: number) {
        return new Request(K.NETWORK.URL.GET_MARKET_DATA + '/' + stockMarketId, K.NETWORK.METHOD.GET)
    }
    static getStrongestFactore(personId: string) {
        return new Request(K.NETWORK.URL.GET_STRONGEST_FACTOR + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getCareersInsights(personId: string) {
        return new Request(K.NETWORK.URL.GET_CAREERS_INSIGHTS + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getUpdateColor(body: any) {
        return new Request(K.NETWORK.URL.GET_UPDATE_COLOR, K.NETWORK.METHOD.POST, body)
    }

    static getUsersList(body: any) {
        return new Request(K.NETWORK.URL.GET_USERS_LIST, K.NETWORK.METHOD.POST, body)
    }
    static exportUsersList(body: any) {
        return new Request(K.NETWORK.URL.EXPORT_USERS_LIST, K.NETWORK.METHOD.POST, body)
    }
    static getTags(accountId: any) {
        return new Request(K.NETWORK.URL.GET_MANAGE_TAGS + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static getParticipantsDetail(payload: any) {
        return new Request(K.NETWORK.URL.GET_PARTICIPANTS_DETAIL, K.NETWORK.METHOD.POST, payload)
    }
    static getMarketMoodArray(personId: string, portfolioValue: any, date: string) {
        return new Request(K.NETWORK.URL.GET_MARKET_MOOD_ARRAY + '/' + personId + '/' + portfolioValue + '/' + date, K.NETWORK.METHOD.GET)
    }

    static getFacilitators(accountId: any) {
        return new Request(K.NETWORK.URL.GET_FACILITATORS + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static editParticipantProfile(data: any) {
        return new Request(K.NETWORK.URL.UPDATE_PROFILE, K.NETWORK.METHOD.PUT, data)
    }

    static editParticipantProfilePicture(data: any) {
        const formData = new FormData()
        formData.append('fileUpload', data.profilePicture)

        const reqHeaders = {
            'Content-Type': 'multipart/form-data',
        }
        return new Request(K.NETWORK.URL.UPLOAD_PROFILE_PICTURE + '/' + data.personId, K.NETWORK.METHOD.POST, formData, reqHeaders)
    }

    static editParticipantTags(data: any) {
        return new Request(K.NETWORK.URL.UPSERT_ASSOCIATED_TAG_BY_ACCOUNT, K.NETWORK.METHOD.POST, data)
    }

    static editParticipantFacilitator(data: any) {
        return new Request(K.NETWORK.URL.UPSERT_PARTICIPANT_TO_FACILITATOR_BY_ACCOUNT, K.NETWORK.METHOD.POST, data)
    }
    static searchMultipleAccounts(body: any) {
        return new Request(K.NETWORK.URL.SEARCH_MULTIPLE_ACCOUNT, K.NETWORK.METHOD.POST, body)
    }
    static getCommunicationInsights(personId: any) {
        return new Request(K.NETWORK.URL.GET_COMMUNICATION_INSIGHTS + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getOldReports(personId: any) {
        return new Request(K.NETWORK.URL.GET_OLD_REPORTS + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getSortingOrder(accountId: number) {
        return new Request(K.NETWORK.URL.GET_SORTING_ORDER + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static updateSortingOrder(payload: any) {
        return new Request(K.NETWORK.URL.UPDATE_SORTING_ORDER, K.NETWORK.METHOD.POST, payload)
    }
    static getSelfRegistrationId(personId: any) {
        return new Request(K.NETWORK.URL.GET_SELF_REGISTRATION_ID + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getSelfRegistrationDetail(linkId: any, accountId: any) {
        return new Request(K.NETWORK.URL.GET_SINGLE_SELF_REGISTRATION_LINK + '/' + linkId + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getCustomReportName(accountId: any, reportId: any) {
        return new Request(K.NETWORK.URL.GET_CUSTOM_REPORT + '/' + accountId + '/' + reportId, K.NETWORK.METHOD.GET)
    }

    static getCreditId(personId: any) {
        return new Request(K.NETWORK.URL.GET_CREDIT_ID + '/' + personId, K.NETWORK.METHOD.GET)
    }

    static getDiscoveryStatus(creditId: any) {
        return new Request(K.NETWORK.URL.GET_DISCOVERY_STATUS + '/' + creditId, K.NETWORK.METHOD.GET)
    }

    static getUniqueStyle(personId: string) {
        return new Request(K.NETWORK.URL.GET_UNIQUE_STYLE + '/' + personId, K.NETWORK.METHOD.GET)
    }

    static saveUserToAccount(body: any) {
        return new Request(K.NETWORK.URL.SAVE_USER_TO_ACCOUNT, K.NETWORK.METHOD.POST, body)
    }

    static getWorkRelatedMoneyInsights(body: any) {
        const request = new Request('', K.NETWORK.METHOD.POST, body)
        request.url = 'https://app.wonderchat.io/api/v1/chat'
        return request
    }

    static getDigitalScanScores(body: any) {
        const request = new Request('', K.NETWORK.METHOD.POST, body)
        request.url = K.NETWORK.URL.DIGITAL_SCAN_API
        return request
    }

    static getFinancialPlanningInsights(personId: string) {
        const url = K.NETWORK.URL.GET_FDNA_FINANCIAL_PLANNING_INSIGHTS + '/' + personId + '/22'
        return new Request(url, K.NETWORK.METHOD.GET)
    }

    static getSalesInsightData(personId: string) {
        const url = `${K.NETWORK.URL.GET_SALES_INSIGHT}/${personId}`
        return new Request(url, K.NETWORK.METHOD.GET)
    }

    static getHiringData(personId: string) {
        const url = `${K.NETWORK.URL.GET_HIRING_DATA}/${personId}`
        return new Request(url, K.NETWORK.METHOD.GET)
    }

    static salesReportAccess() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/${K.NETWORK.URL.SALES_REPORT_ACCESS_TABLE}${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }
    static coachingReportAccess() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/${K.NETWORK.URL.COACHING_REPORT_ACCESS_TABLE}${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }

    static digitalScanAccess() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/${K.NETWORK.URL.DIGITAL_SCAN_ACCESS_TABLE}${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }

    static getTraitsDescription() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/TraitsDescriptionTable${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }

    static getCoachingReportData() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/CoachingReportWordsTable${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }

    static getCoachingReportTraitsData() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/CoachingReportTraitsTableV1${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }
    static getFactorRelationship() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/FactorRelationshipTable${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }

    static getUniqueStyleDesc() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/UniqueStyleDescriptionTable${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }

    static getBDNAUniqueStyleVideoLinks() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/BDNAUniqueStyleVideoLinks${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }

    static getFDNAUniqueStyleVideoLinks() {
        const request = new Request('', K.NETWORK.METHOD.GET, undefined, {}, '', true)
        request.url = `${K.NETWORK.URL.AZURE_TABLE_API}/FDNAUniqueStyleVideoLinks${K.NETWORK.URL.AZURE_SHARED_ACCESS_KEY}`
        request.headers = request.headers.delete('Authorization')
        return request
    }
}
