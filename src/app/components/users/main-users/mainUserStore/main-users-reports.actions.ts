import { createAction } from '@ngrx/store'
import { ApiError } from 'src/app/service/api-error'
import {
    CUSTOM_REPORT_ACCESS_DATA_ACTION,
    CUSTOM_REPORT_ACCESS_DATA_ACTION_SUCCESS,
    GET_BEHAVIRAL_BIASES_ACTION,
    GET_BEHAVIRAL_BIASES_ACTION2,
    GET_CAREERS_INSIGHTS_ACTION,
    GET_CAREERS_INSIGHTS_ACTION2,
    GET_COACGING_REPORT_ACTION,
    GET_COACHING_REPORT_ACTION_SUCCESS,
    GET_COMMUNICATION_INSIGHTS_ACTION,
    GET_COMMUNICATION_INSIGHTS_ACTION2,
    GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION,
    GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION2,
    GET_CUSTOM_REPORT_NAME_ACTION,
    GET_CUSTOM_REPORT_NAME_ACTION_SUCCESS,
    GET_DIGITAL_SCAN_SCORES,
    GET_DIGITAL_SCAN_SCORES_FAILURE,
    GET_DIGITAL_SCAN_SCORES_SUCCESS,
    GET_ENVIRONMENT_KEYS_ACTION,
    GET_ENVIRONMENT_KEYS_ACTION2,
    GET_FACTOR_RELATIONSHIP_ACTION,
    GET_FACTOR_RELATIONSHIP_ACTION_SUCCESS,
    GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION,
    GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION_SUCCESS,
    GET_FDNA_SCORE_ACTION,
    GET_FDNA_SCORE_ACTION2,
    GET_FINANCIAL_STYLE_MATCH_ACTION,
    GET_HIRING_DATA_ACTION,
    GET_HIRING_DATA_ACTION_SUCCESS,
    GET_MARKET_DATA_ACTION,
    GET_MARKET_DATA_ACTION_SUCCESS,
    GET_MARKET_MOOD_ARRAY_ACTION,
    GET_MARKET_MOOD_ARRAY_ACTION2,
    GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION,
    GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION2,
    GET_OLD_REPORTS_ACTION,
    GET_OLD_REPORTS_ACTION2,
    GET_OLD_REPORTS_ACTION_SUCCESS,
    GET_OLD_REPORTS_ACTION_SUCCESS2,
    GET_PARTICIPANTS_DETAIL_ACTION,
    GET_PARTICIPANTS_DETAIL_SUCCESS_ACTION,
    GET_PARTICIPANTS_DETAIL_FAILURE_ACTION,
    GET_RISK_ALLOCATIONS_ACTION,
    GET_RISK_ALLOCATIONS_ACTION_SUCCESS,
    GET_RISK_BEHAVIOR_ACTION,
    GET_RISK_BEHAVIOR_ACTION2,
    GET_SALES_INSIGHT_ACTION,
    GET_SALES_INSIGHT_ACTION_SUCCESS,
    GET_SORTING_ORDER_ACTION,
    GET_SORTING_ORDER_SUCCESS_ACTION,
    GET_STRONGEST_FACTOR_ACTION,
    GET_TRAITS_DESCRIPTION_ACTION,
    GET_TRAITS_DESCRIPTION_ACTION_SUCCESS,
    GET_TSCORE_ACTION,
    GET_TSCORE_ACTION2,
    GET_UNIQUE_STYLE_DESCRIPTION_ACTION,
    GET_UNIQUE_STYLE_DESCRIPTION_ACTION_SUCCESS,
    GET_UNIQUE_STYLE_DETAILS_ACTION,
    GET_UNIQUE_STYLE_DETAILS_ACTION_SUCCESS,
    GET_VIDEO_URL_ACTION,
    GET_VIDEO_URL_ACTION_SUCCESS,
    GET_WORKPLACE_INSIGHT_ACTION,
    GET_WORKPLACE_INSIGHT_ACTION2,
    GET_WORK_RELATED_MONEY_INSIGHTS_ACTION,
    GET_WORK_RELATED_MONEY_INSIGHTS_ACTION_SUCCESS,
    GET_WORK_STYLE_MATCH_ACTION,
    GET_WORK_TALENTS_ACTION,
    GET_WORK_TALENTS_ACTION2,
    SUCCESS_BEHAVIRAL_BIASES_ACTION,
    SUCCESS_BEHAVIRAL_BIASES_ACTION2,
    SUCCESS_CAREERS_INSIGHTS_ACTION,
    SUCCESS_CAREERS_INSIGHTS_ACTION2,
    SUCCESS_ENVIRONMENT_KEYS_ACTION,
    SUCCESS_ENVIRONMENT_KEYS_ACTION2,
    SUCCESS_FDNA_SCORE_ACTION,
    SUCCESS_FDNA_SCORE_ACTION2,
    SUCCESS_FINANCIAL_STYLE_MATCH_ACTION,
    SUCCESS_RISK_BEHAVIOR_ACTION,
    SUCCESS_RISK_BEHAVIOR_ACTION2,
    SUCCESS_STRONGEST_FACTOR_ACTION,
    SUCCESS_TSCORE_ACTION,
    SUCCESS_TSCORE_ACTION2,
    SUCCESS_WORKPLACE_INSIGHT_ACTION,
    SUCCESS_WORKPLACE_INSIGHT_ACTION2,
    SUCCESS_WORK_STYLE_MATCH_ACTION,
    SUCCESS_WORK_TALENTS_ACTION,
    SUCCESS_WORK_TALENTS_ACTION2,
    UPDATE_SORTING_ORDER_ACTION,
    UPDATE_SORTING_ORDER_SUCCESS_ACTION,
} from './main-users-actions-constants'

// Reports actions (everything in the original main-users.actions.ts NOT listed as
// Users-list in USERS_PAGE_OPTIMIZATION_PLAN.md §4)

export const getEnvironmentKeys = createAction(GET_ENVIRONMENT_KEYS_ACTION, (personId: any, languageId: any) => ({ personId, languageId }))
export const getEnvironmentKeysSuccess = createAction(SUCCESS_ENVIRONMENT_KEYS_ACTION, (environmentKeysPayload: any, personId: any) => ({
    environmentKeysPayload,
    personId,
}))

export const getUniqueStyleAndDescriptionAction = createAction(GET_UNIQUE_STYLE_DETAILS_ACTION, (personId: any, languageId: any) => ({ personId, languageId }))
export const getUniqueStyleAndDescriptionActionSuccess = createAction(GET_UNIQUE_STYLE_DETAILS_ACTION_SUCCESS, (uniqueStyleAndDescription: any) => ({
    uniqueStyleAndDescription,
}))

export const getEnvironmentKeys2 = createAction(GET_ENVIRONMENT_KEYS_ACTION2, (personId: any, languageId: any) => ({ personId, languageId }))
export const getEnvironmentKeysSuccess2 = createAction(SUCCESS_ENVIRONMENT_KEYS_ACTION2, (environmentKeysPayload2: any, personId: any) => ({
    environmentKeysPayload2,
    personId,
}))
export const getRiskBehaviorAction = createAction(GET_RISK_BEHAVIOR_ACTION, (personId: any) => ({ personId }))
export const getRiskBehaviorActionSuccess = createAction(SUCCESS_RISK_BEHAVIOR_ACTION, (riskBehaviorPayload: any, personId: any) => ({
    riskBehaviorPayload,
    personId,
}))

export const getRiskBehaviorAction2 = createAction(GET_RISK_BEHAVIOR_ACTION2, (personId: any) => ({ personId }))
export const getRiskBehaviorActionSuccess2 = createAction(SUCCESS_RISK_BEHAVIOR_ACTION2, (riskBehaviorPayload2: any, personId: any) => ({
    riskBehaviorPayload2,
    personId,
}))

export const getFDNAScoreAction = createAction(GET_FDNA_SCORE_ACTION, (personId: any, languageId: any) => ({ personId, languageId }))

export const getFDNAScoreActionSuccess = createAction(SUCCESS_FDNA_SCORE_ACTION, (FDNAScorePayload: any, personId: any) => ({
    FDNAScorePayload,
    personId,
}))
export const getFDNAScoreAction2 = createAction(GET_FDNA_SCORE_ACTION2, (personId: any, languageId: any) => ({ personId, languageId }))

export const getFDNAScoreActionSuccess2 = createAction(SUCCESS_FDNA_SCORE_ACTION2, (FDNAScorePayload2: any, personId: any) => ({
    FDNAScorePayload2,
    personId,
}))

export const getWorkTalentsAction = createAction(GET_WORK_TALENTS_ACTION, (personId: any, languageId: any) => ({ personId, languageId }))

export const getWorkTalentsActionSuccess = createAction(SUCCESS_WORK_TALENTS_ACTION, (workTalentsPayload: any, personId: any) => ({
    workTalentsPayload,
    personId,
}))
export const getWorkTalentsAction2 = createAction(GET_WORK_TALENTS_ACTION2, (personId: any, languageId: any) => ({ personId, languageId }))

export const getWorkTalentsActionSuccess2 = createAction(SUCCESS_WORK_TALENTS_ACTION2, (workTalentsPayload2: any, personId: any) => ({
    workTalentsPayload2,
    personId,
}))

export const getFinancialStyleMatch = createAction(GET_FINANCIAL_STYLE_MATCH_ACTION, (personId_1: any, personId_2: any) => ({ personId_1, personId_2 }))

export const getFinancialStyleMatchActionSuccess = createAction(SUCCESS_FINANCIAL_STYLE_MATCH_ACTION, (financialStyleMatchPayload: any) => ({
    financialStyleMatchPayload,
}))

export const getWorkStyleMatch = createAction(GET_WORK_STYLE_MATCH_ACTION, (personId_1: any, personId_2: any) => ({ personId_1, personId_2 }))

export const getWorkStyleMatchActionSuccess = createAction(SUCCESS_WORK_STYLE_MATCH_ACTION, (workStyleMatchPayload: any) => ({ workStyleMatchPayload }))

export const getTScoreAction = createAction(GET_TSCORE_ACTION, (personId: any) => ({ personId }))

export const getMarketDataAction = createAction(GET_MARKET_DATA_ACTION, (stockMarketId: any) => ({ stockMarketId }))

export const getVideoUrlAction = createAction(GET_VIDEO_URL_ACTION, (personId) => ({ personId }))
export const getVideoUrlActionSuccess = createAction(GET_VIDEO_URL_ACTION_SUCCESS, (response) => ({ response }))

export const getMarketDataActionSuccess = createAction(GET_MARKET_DATA_ACTION_SUCCESS, (marketDataResponse: any) => ({ marketDataResponse }))

export const getTScoreAction2 = createAction(GET_TSCORE_ACTION2, (personId: any) => ({ personId }))
export const getStrongestFactorsAction = createAction(GET_STRONGEST_FACTOR_ACTION, (personId: any) => ({ personId }))

export const getStrongestFactorsActionSuccess = createAction(SUCCESS_STRONGEST_FACTOR_ACTION, (strongestFactorsPaylaod: any) => ({ strongestFactorsPaylaod }))
export const getTScoreActionSuccess = createAction(SUCCESS_TSCORE_ACTION, (tScorePaylaod: any, personId: any) => ({ tScorePaylaod, personId }))

export const getTScoreActionSuccess2 = createAction(SUCCESS_TSCORE_ACTION2, (tScorePaylaod2: any, personId: any) => ({ tScorePaylaod2, personId }))
export const getBehaviralBiases = createAction(GET_BEHAVIRAL_BIASES_ACTION, (personId: any, languageId: any) => ({ personId, languageId }))
export const getBehaviralBiases2 = createAction(GET_BEHAVIRAL_BIASES_ACTION2, (personId: any, languageId: any) => ({ personId, languageId }))

export const getBehaviralBiasesSuccess = createAction(SUCCESS_BEHAVIRAL_BIASES_ACTION, (behaviralBiasesPayload: any, personId: any) => ({
    behaviralBiasesPayload,
    personId,
}))

export const getBehaviralBiasesSuccess2 = createAction(SUCCESS_BEHAVIRAL_BIASES_ACTION2, (behaviralBiasesPayload2: any, personId: any) => ({
    behaviralBiasesPayload2,
    personId,
}))

export const getWorkPlaceInsight = createAction(GET_WORKPLACE_INSIGHT_ACTION, (personId: any, languageId: any) => ({ personId, languageId }))

export const getWorkPlaceInsightSuccess = createAction(SUCCESS_WORKPLACE_INSIGHT_ACTION, (workPlaceInsightPayload: any, personId: any) => ({
    workPlaceInsightPayload,
    personId,
}))
export const getWorkPlaceInsight2 = createAction(GET_WORKPLACE_INSIGHT_ACTION2, (personId: any, languageId: any) => ({ personId, languageId }))

export const getWorkPlaceInsightSuccess2 = createAction(SUCCESS_WORKPLACE_INSIGHT_ACTION2, (workPlaceInsightPayload2: any, personId: any) => ({
    workPlaceInsightPayload2,
    personId,
}))
export const getCareersInsights = createAction(GET_CAREERS_INSIGHTS_ACTION, (personId: any) => ({ personId }))
export const getCareersInsightsSuccess = createAction(SUCCESS_CAREERS_INSIGHTS_ACTION, (careersInsightsPayload: any, personId: any) => ({
    careersInsightsPayload,
    personId,
}))
export const getCareersInsights2 = createAction(GET_CAREERS_INSIGHTS_ACTION2, (personId: any) => ({ personId }))
export const getCareersInsightsSuccess2 = createAction(SUCCESS_CAREERS_INSIGHTS_ACTION2, (careersInsightsPayload2: any, personId: any) => ({
    careersInsightsPayload2,
    personId,
}))

export const getParticipantsDetailAction = createAction(GET_PARTICIPANTS_DETAIL_ACTION, (participants: any[], accountId: any, isFidelityLogin = false) => ({
    participants,
    accountId,
    isFidelityLogin,
}))

export const getParticipantsDetailSuccessAction = createAction(GET_PARTICIPANTS_DETAIL_SUCCESS_ACTION, (response: any) => ({ response }))
export const getParticipantsDetailFailureAction = createAction(GET_PARTICIPANTS_DETAIL_FAILURE_ACTION, (error: any) => ({ error }))
export const getMarketMoodArrayAction = createAction(GET_MARKET_MOOD_ARRAY_ACTION, (personId: any, portfolioValue: any, date: string) => ({
    personId,
    portfolioValue,
    date,
}))

export const getMarketMoodArraySuccessAction = createAction(GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION, (response: any) => ({ response }))
export const getMarketMoodArrayAction2 = createAction(GET_MARKET_MOOD_ARRAY_ACTION2, (personId: any, portfolioValue: any, date: string) => ({
    personId,
    portfolioValue,
    date,
}))

export const getMarketMoodArraySuccessAction2 = createAction(GET_MARKET_MOOD_ARRAY_SUCCESS_ACTION2, (response: any) => ({ response }))

export const getCommunicationInsightAction = createAction(GET_COMMUNICATION_INSIGHTS_ACTION, (personId: any) => ({ personId }))

export const getCommunicationInsightSuccessAction = createAction(
    GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION,
    (communicationInsightPayload: any, personId: any) => ({
        communicationInsightPayload,
        personId,
    })
)

export const getCommunicationInsightAction2 = createAction(GET_COMMUNICATION_INSIGHTS_ACTION2, (personId: any) => ({ personId }))

export const getCommunicationInsightSuccessAction2 = createAction(
    GET_COMMUNICATION_INSIGHTS_SUCCESS_ACTION2,
    (communicationInsightPayload2: any, personId: any) => ({
        communicationInsightPayload2,
        personId,
    })
)

export const getOldReportsAction = createAction(GET_OLD_REPORTS_ACTION, (personId: any) => ({ personId }))

// `error` is attached only on a real failure - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5.
export const getOldReportsActionSuccess = createAction(GET_OLD_REPORTS_ACTION_SUCCESS, (response: any, error?: ApiError) => ({ response, error }))

export const getSortingOrderAction = createAction(GET_SORTING_ORDER_ACTION, (accountId: any) => ({ accountId }))

// `error` is attached only on a real failure - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5.
export const getSortingOrderActionSuccess = createAction(GET_SORTING_ORDER_SUCCESS_ACTION, (sortingOrderResponse: any, error?: ApiError) => ({
    sortingOrderResponse,
    error,
}))

export const updateSortingOrderAction = createAction(UPDATE_SORTING_ORDER_ACTION, (payload: any) => payload)

export const updateSortingOrderActionSuccess = createAction(UPDATE_SORTING_ORDER_SUCCESS_ACTION, (response: any) => response)

export const getOldReportsAction2 = createAction(GET_OLD_REPORTS_ACTION2, (personId: any) => ({ personId }))

// `error` is attached only on a real failure - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5.
export const getOldReportsActionSuccess2 = createAction(GET_OLD_REPORTS_ACTION_SUCCESS2, (response: any, error?: ApiError) => ({ response, error }))

export const getCustomReportNameAction = createAction(GET_CUSTOM_REPORT_NAME_ACTION, (payload: any) => ({ payload }))

// `error` is attached only on a real failure (transport, or a resolved response with unusable
// data) - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5. Consumers no longer branch on
// `response.body.statusCode`; ApiErrorNotificationEffects toasts `error` globally when present.
export const getCustomReportNameSuccessAction = createAction(GET_CUSTOM_REPORT_NAME_ACTION_SUCCESS, (response: any, error?: ApiError) => ({
    response,
    error,
}))

export const getWorkRelatedMoneyInsightAction = createAction(GET_WORK_RELATED_MONEY_INSIGHTS_ACTION, (payload: any) => ({ payload }))
export const getWorkRelatedMoneyInsightActionSuccess = createAction(GET_WORK_RELATED_MONEY_INSIGHTS_ACTION_SUCCESS, (response: any) => ({ response }))

export const getDigitalScanScoresAction = createAction(GET_DIGITAL_SCAN_SCORES, (payload: any) => ({ payload }))
export const getDigitalScanScoresActionSuccess = createAction(GET_DIGITAL_SCAN_SCORES_SUCCESS, (response: any) => ({ response }))
export const getDigitalScanScoresActionFailure = createAction(GET_DIGITAL_SCAN_SCORES_FAILURE, (response: any) => ({ response }))

export const getRiskAllocation = createAction(GET_RISK_ALLOCATIONS_ACTION, (personId: any) => ({ personId }))
// `error` is attached only on a real failure - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5.
export const getRiskAllocationSuccess = createAction(GET_RISK_ALLOCATIONS_ACTION_SUCCESS, (response: any, error?: ApiError) => ({ response, error }))

export const getFDNAFinancialPlanningInsightsAction = createAction(GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION, (personId: string) => ({ personId }))
// `error` is attached only on a real failure - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5.
export const getFDNAFinancialPlanningInsightsActionSuccess = createAction(
    GET_FDNA_FINANCIAL_PLANNING_INSIGHTS_ACTION_SUCCESS,
    (response: any, error?: ApiError) => ({
        response,
        error,
    })
)

export const getSalesInsightsAction = createAction(GET_SALES_INSIGHT_ACTION, (personId: string) => ({ personId }))
// `error` is attached only on a real failure - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5.
export const getSalesInsightsActionSuccess = createAction(GET_SALES_INSIGHT_ACTION_SUCCESS, (response: any, error?: ApiError) => ({ response, error }))

export const getHiringDataAction = createAction(GET_HIRING_DATA_ACTION, (personId: string) => ({ personId }))
// `error` is attached only on a real failure - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5.
export const getHiringDataActionSuccess = createAction(GET_HIRING_DATA_ACTION_SUCCESS, (response: any, error?: ApiError) => ({ response, error }))

export const getCustomReportAccessDataAction = createAction(CUSTOM_REPORT_ACCESS_DATA_ACTION)
export const getCustomReportAccessDataActionSuccess = createAction(CUSTOM_REPORT_ACCESS_DATA_ACTION_SUCCESS, (response: any) => ({ response }))

export const getTraitsDescriptionAction = createAction(GET_TRAITS_DESCRIPTION_ACTION)
export const getTraitsDescriptionActionSuccess = createAction(GET_TRAITS_DESCRIPTION_ACTION_SUCCESS, (response: any) => ({ response }))

export const getCoachingReportAction = createAction(GET_COACGING_REPORT_ACTION)
export const getCoachingReportActionSuccess = createAction(GET_COACHING_REPORT_ACTION_SUCCESS, (coachingReportTableData: any) => ({ coachingReportTableData }))

export const getFactorRelationshipAction = createAction(GET_FACTOR_RELATIONSHIP_ACTION)
export const getFactorRelationshipActionSuccess = createAction(GET_FACTOR_RELATIONSHIP_ACTION_SUCCESS, (response: any) => ({ response }))

export const getUniqueStyleDescriptionAction = createAction(GET_UNIQUE_STYLE_DESCRIPTION_ACTION)
export const getUniqueStyleDescriptionActionSuccess = createAction(GET_UNIQUE_STYLE_DESCRIPTION_ACTION_SUCCESS, (response: any) => ({ response }))
