import { createReducer, on } from '@ngrx/store'
import { initialState, State } from './main-users-list.reducer'
import {
    getBehaviralBiases,
    getBehaviralBiases2,
    getBehaviralBiasesSuccess,
    getBehaviralBiasesSuccess2,
    getCareersInsights,
    getCareersInsights2,
    getCareersInsightsSuccess,
    getCareersInsightsSuccess2,
    getCoachingReportAction,
    getCoachingReportActionSuccess,
    getCommunicationInsightAction,
    getCommunicationInsightAction2,
    getCommunicationInsightSuccessAction,
    getCommunicationInsightSuccessAction2,
    getCustomReportAccessDataAction,
    getCustomReportAccessDataActionSuccess,
    getDigitalScanScoresAction,
    getDigitalScanScoresActionFailure,
    getDigitalScanScoresActionSuccess,
    getEnvironmentKeys,
    getEnvironmentKeys2,
    getEnvironmentKeysSuccess,
    getEnvironmentKeysSuccess2,
    getFactorRelationshipAction,
    getFactorRelationshipActionSuccess,
    getFDNAFinancialPlanningInsightsAction,
    getFDNAFinancialPlanningInsightsActionSuccess,
    getFDNAScoreAction,
    getFDNAScoreAction2,
    getFDNAScoreActionSuccess,
    getFDNAScoreActionSuccess2,
    getFinancialStyleMatch,
    getFinancialStyleMatchActionSuccess,
    getHiringDataAction,
    getHiringDataActionSuccess,
    getMarketDataAction,
    getMarketDataActionSuccess,
    getMarketMoodArrayAction,
    getMarketMoodArraySuccessAction,
    getOldReportsAction,
    getOldReportsAction2,
    getOldReportsActionSuccess,
    getOldReportsActionSuccess2,
    getParticipantsDetailAction,
    getParticipantsDetailSuccessAction,
    getParticipantsDetailFailureAction,
    getRiskAllocation,
    getRiskAllocationSuccess,
    getRiskBehaviorAction,
    getRiskBehaviorAction2,
    getRiskBehaviorActionSuccess,
    getRiskBehaviorActionSuccess2,
    getSalesInsightsAction,
    getSalesInsightsActionSuccess,
    getSortingOrderAction,
    getSortingOrderActionSuccess,
    getStrongestFactorsAction,
    getStrongestFactorsActionSuccess,
    getTraitsDescriptionAction,
    getTraitsDescriptionActionSuccess,
    getTScoreAction,
    getTScoreAction2,
    getTScoreActionSuccess,
    getTScoreActionSuccess2,
    getUniqueStyleAndDescriptionAction,
    getUniqueStyleAndDescriptionActionSuccess,
    getUniqueStyleDescriptionAction,
    getUniqueStyleDescriptionActionSuccess,
    getVideoUrlAction,
    getVideoUrlActionSuccess,
    getWorkPlaceInsight,
    getWorkPlaceInsight2,
    getWorkPlaceInsightSuccess,
    getWorkPlaceInsightSuccess2,
    getWorkRelatedMoneyInsightAction,
    getWorkRelatedMoneyInsightActionSuccess,
    getWorkStyleMatch,
    getWorkStyleMatchActionSuccess,
    getWorkTalentsAction,
    getWorkTalentsAction2,
    getWorkTalentsActionSuccess,
    getWorkTalentsActionSuccess2,
    updateSortingOrderAction,
    updateSortingOrderActionSuccess,
} from './main-users.actions'

export const reportsReducer = createReducer(
    initialState as State,
    on(getRiskBehaviorAction, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        riskBehaviorPayload: undefined,
        getRiskBehaviorLoading: true,
    })),

    // Guards against the classic slot-vs-identity race: if the participant in slot 1 was
    // changed after this request was dispatched (e.g. deselect/reselect while an in-flight or
    // cached response is still resolving), a response for the OLD personId must not overwrite
    // the NEW participant's data. See SINGLE_USER_SELECTION_CACHING_PLAN.md incident notes.
    on(getRiskBehaviorActionSuccess, (state, { riskBehaviorPayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            riskBehaviorPayload: riskBehaviorPayload?.body,
            getRiskBehaviorLoading: false,
        }
    }),
    on(getRiskBehaviorAction2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        riskBehaviorPayload2: undefined,
        getRiskBehaviorLoading2: true,
    })),

    on(getRiskBehaviorActionSuccess2, (state, { riskBehaviorPayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            riskBehaviorPayload2: riskBehaviorPayload2?.body,
            getRiskBehaviorLoading2: false,
        }
    }),
    on(getFDNAScoreAction, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        getFDNAScoreLoading: true,
    })),

    on(getFDNAScoreActionSuccess, (state, { FDNAScorePayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            FDNAScorePayload: FDNAScorePayload?.body,
            getFDNAScoreLoading: false,
        }
    }),
    on(getFDNAScoreAction2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        getFDNAScoreLoading2: true,
    })),

    on(getFDNAScoreActionSuccess2, (state, { FDNAScorePayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            FDNAScorePayload2: FDNAScorePayload2?.body,
            getFDNAScoreLoading2: false,
        }
    }),
    on(getWorkTalentsAction, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        getWorkTalentsLoading: true,
    })),

    on(getWorkTalentsActionSuccess, (state, { workTalentsPayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            workTalentsPayload: workTalentsPayload?.body,
            getWorkTalentsLoading: false,
        }
    }),
    on(getWorkTalentsAction2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        getWorkTalentsLoading2: true,
    })),

    on(getWorkTalentsActionSuccess2, (state, { workTalentsPayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            workTalentsPayload2: workTalentsPayload2?.body,
            getWorkTalentsLoading2: false,
        }
    }),

    on(getFinancialStyleMatch, (state) => ({
        ...state,
        financialStyleMatchPayload: undefined,
        getFinancialStyleMatchLoading: true,
    })),

    on(getFinancialStyleMatchActionSuccess, (state, { financialStyleMatchPayload }) => ({
        ...state,
        financialStyleMatchPayload: financialStyleMatchPayload?.body,
        getFinancialStyleMatchLoading: false,
    })),

    on(getWorkStyleMatch, (state) => ({
        ...state,
        workStyleMatchPayload: undefined,
        getWorkStyleMatchLoading: true,
    })),
    on(getWorkStyleMatchActionSuccess, (state, { workStyleMatchPayload }) => ({
        ...state,
        workStyleMatchPayload: workStyleMatchPayload?.body,
        getWorkStyleMatchLoading: false,
    })),

    on(getTScoreAction, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        getTScoreLoading: true,
        getStrongesFactorsLoading: true,
    })),
    on(getTScoreActionSuccess, (state, { tScorePaylaod, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            tScorePaylaod: tScorePaylaod?.body,
            strongestFactorsPaylaod: tScorePaylaod?.body,
            getTScoreLoading: false,
            getStrongesFactorsLoading: false,
        }
    }),

    on(getMarketDataAction, (state) => ({
        ...state,
        getMarketDataLoading: true,
    })),
    on(getMarketDataActionSuccess, (state, { marketDataResponse }) => ({
        ...state,
        marketDataResponse: marketDataResponse?.body,
        getMarketDataLoading: false,
    })),

    on(getMarketMoodArrayAction, (state) => ({
        ...state,
        isMarketMoodLoading: true,
    })),
    on(getMarketMoodArraySuccessAction, (state, { response }) => ({
        ...state,
        marketMoodData: response?.body,
        isMarketMoodLoading: false,
    })),

    on(getUniqueStyleAndDescriptionAction, (state) => ({
        ...state,
        isUniqueStyleLoading: true,
    })),
    on(getUniqueStyleAndDescriptionActionSuccess, (state, { uniqueStyleAndDescription }) => ({
        ...state,
        uniqueStyleAndDescription: uniqueStyleAndDescription?.body,
        isUniqueStyleLoading: false,
    })),

    on(getTScoreAction2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        getTScoreLoading2: true,
        getStrongesFactorsLoading2: true,
    })),
    on(getTScoreActionSuccess2, (state, { tScorePaylaod2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            tScorePaylaod2: tScorePaylaod2?.body,
            strongestFactorsPaylaod2: tScorePaylaod2?.body,
            getTScoreLoading2: false,
            getStrongesFactorsLoading2: false,
        }
    }),

    on(getStrongestFactorsAction, (state) => ({
        ...state,
        getStrongesFactorsLoading: true,
    })),
    on(getStrongestFactorsActionSuccess, (state, { strongestFactorsPaylaod }) => ({
        ...state,
        strongestFactorsPaylaod: strongestFactorsPaylaod?.body,
        getStrongesFactorsLoading: false,
    })),

    on(getBehaviralBiases, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        getBehaviralBiasesLoading: true,
    })),

    on(getBehaviralBiasesSuccess, (state, { behaviralBiasesPayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            behaviralBiasesPayload: behaviralBiasesPayload?.body,
            getBehaviralBiasesLoading: false,
        }
    }),
    on(getVideoUrlAction, (state) => ({
        ...state,
        isVideoUrlLoading: true,
    })),
    on(getVideoUrlActionSuccess, (state, { response }) => ({
        ...state,
        videoUrlData: response?.body,
        isVideoUrlLoading: false,
    })),

    on(getBehaviralBiases2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        getBehaviralBiasesLoading2: true,
    })),

    on(getBehaviralBiasesSuccess2, (state, { behaviralBiasesPayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            behaviralBiasesPayload2: behaviralBiasesPayload2?.body,
            getBehaviralBiasesLoading2: false,
        }
    }),

    on(getWorkPlaceInsight, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        getWorkPlaceInsightLoading: true,
    })),

    on(getWorkPlaceInsightSuccess, (state, { workPlaceInsightPayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            workPlaceInsightPayload: workPlaceInsightPayload?.body,
            getWorkPlaceInsightLoading: false,
        }
    }),
    on(getWorkPlaceInsight2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        getWorkPlaceInsightLoading2: true,
    })),

    on(getWorkPlaceInsightSuccess2, (state, { workPlaceInsightPayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            workPlaceInsightPayload2: workPlaceInsightPayload2?.body,
            getWorkPlaceInsightLoading2: false,
        }
    }),

    on(getCareersInsights, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        getCareersInsightsLoading: true,
    })),

    on(getCareersInsightsSuccess, (state, { careersInsightsPayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            careersInsightsPayload: careersInsightsPayload?.body,
            getCareersInsightsLoading: false,
        }
    }),
    on(getCareersInsights2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        getCareersInsightsLoading2: true,
    })),

    on(getCareersInsightsSuccess2, (state, { careersInsightsPayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            careersInsightsPayload2: careersInsightsPayload2?.body,
            getCareersInsightsLoading2: false,
        }
    }),
    on(getEnvironmentKeys, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        getEnvironmentKeysLoading: true,
    })),

    on(getEnvironmentKeysSuccess, (state, { environmentKeysPayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            environmentKeysPayload: environmentKeysPayload?.body,
            getEnvironmentKeysLoading: false,
        }
    }),
    on(getEnvironmentKeys2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        getEnvironmentKeysLoading2: true,
    })),

    on(getEnvironmentKeysSuccess2, (state, { environmentKeysPayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            environmentKeysPayload2: environmentKeysPayload2?.body,
            getEnvironmentKeysLoading2: false,
        }
    }),

    on(getParticipantsDetailAction, (state) => ({
        ...state,
        isUserDetailLoading: true,
    })),
    on(getParticipantsDetailSuccessAction, (state) => ({
        ...state,
        isUserDetailLoading: false,
    })),
    on(getParticipantsDetailFailureAction, (state) => ({
        ...state,
        isUserDetailLoading: false,
    })),
    on(getCommunicationInsightAction, (state, { personId }) => ({
        ...state,
        activePersonId1: personId,
        communicationInsightsLoading: true,
    })),
    on(getCommunicationInsightSuccessAction, (state, { communicationInsightPayload, personId }) => {
        if (personId !== state.activePersonId1) return state
        return {
            ...state,
            communicationInsightsLoading: false,
            communicationInsightPayload: communicationInsightPayload?.body?.data,
        }
    }),
    on(getCommunicationInsightAction2, (state, { personId }) => ({
        ...state,
        activePersonId2: personId,
        communicationInsightsLoading2: true,
    })),
    on(getCommunicationInsightSuccessAction2, (state, { communicationInsightPayload2, personId }) => {
        if (personId !== state.activePersonId2) return state
        return {
            ...state,
            communicationInsightsLoading2: false,
            communicationInsightPayload2: communicationInsightPayload2?.body?.data,
        }
    }),
    on(getOldReportsAction, (state) => ({
        ...state,
        oldReportsLoading: true,
    })),
    on(getOldReportsActionSuccess, (state, { response }) => ({
        ...state,
        oldReportsLoading: false,
        oldReportsPayload: response?.body?.data,
    })),
    on(getSortingOrderAction, (state) => ({
        ...state,
        getSortingOrderLoading: true,
    })),
    on(getSortingOrderActionSuccess, (state, { sortingOrderResponse }) => ({
        ...state,
        getSortingOrderLoading: false,
        sortingOrderResponse: sortingOrderResponse?.body?.data,
    })),

    on(updateSortingOrderAction, (state) => ({
        ...state,
        updateSortingOrderLoading: true,
    })),
    on(updateSortingOrderActionSuccess, (state, { response }) => ({
        ...state,
        updateSortingOrderLoading: false,
        response,
    })),
    on(getOldReportsAction2, (state) => ({
        ...state,
        oldReportsLoading2: true,
    })),
    on(getOldReportsActionSuccess2, (state, { response }) => ({
        ...state,
        oldReportsLoading2: false,
        oldReportsPayload2: response?.body?.data,
    })),
    on(getWorkRelatedMoneyInsightAction, (state) => ({
        ...state,
        moneyInsightLoading: true,
    })),
    on(getWorkRelatedMoneyInsightActionSuccess, (state, { response }) => ({
        ...state,
        moneyInsightLoading: false,
        response,
    })),
    on(getDigitalScanScoresAction, (state) => ({
        ...state,
        digitalScanLoading: true,
    })),
    on(getDigitalScanScoresActionSuccess, (state, { response }) => ({
        ...state,
        digitalScanLoading: false,
        response,
    })),
    on(getDigitalScanScoresActionFailure, (state) => ({
        ...state,
        digitalScanLoading: false,
    })),
    on(getRiskAllocation, (state) => ({
        ...state,
        getRiskAllocationLoading: true,
    })),
    on(getRiskAllocationSuccess, (state, { response }) => ({
        ...state,
        getRiskAllocationLoading: false,
        response,
    })),
    on(getFDNAFinancialPlanningInsightsAction, (state) => ({
        ...state,
        getFinancialPlanningInsightsLoading: true,
    })),
    on(getFDNAFinancialPlanningInsightsActionSuccess, (state, { response }) => ({
        ...state,
        getFinancialPlanningInsightsLoading: false,
        response,
    })),
    on(getSalesInsightsAction, (state) => ({
        ...state,
        getSalesInsightsLoading: true,
    })),
    on(getSalesInsightsActionSuccess, (state, { response }) => ({
        ...state,
        getSalesInsightsLoading: false,
        response,
    })),
    on(getHiringDataAction, (state) => ({
        ...state,
        getHiringDataLoading: true,
    })),
    on(getHiringDataActionSuccess, (state, { response }) => ({
        ...state,
        getHiringDataLoading: false,
        response,
    })),
    on(getCustomReportAccessDataAction, (state) => ({
        ...state,
        getCustomReportAccessLoading: true,
    })),
    on(getCustomReportAccessDataActionSuccess, (state, { response }) => ({
        ...state,
        getCustomReportAccessLoading: false,
        response,
    })),
    on(getTraitsDescriptionAction, (state) => ({
        ...state,
        getTraitsDescLoading: true,
    })),
    on(getTraitsDescriptionActionSuccess, (state, { response }) => ({
        ...state,
        getTraitsDescLoading: false,
        response,
    })),
    on(getCoachingReportAction, (state) => ({
        ...state,
        getCoachingReprtLoading: true,
    })),
    on(getCoachingReportActionSuccess, (state, { coachingReportTableData }) => ({
        ...state,
        getCoachingReprtLoading: false,
        coachingReportTableData,
    })),
    on(getFactorRelationshipAction, (state) => ({
        ...state,
        getFactorRelationshipLoading: true,
    })),
    on(getFactorRelationshipActionSuccess, (state, { response }) => ({
        ...state,
        getFactorRelationshipLoading: false,
        factorRelationship: response,
    })),
    on(getUniqueStyleDescriptionAction, (state) => ({
        ...state,
        getUniqueStyleDescLoading: true,
    })),
    on(getUniqueStyleDescriptionActionSuccess, (state, { response }) => ({
        ...state,
        getUniqueStyleDescLoading: false,
        response,
    }))
)
