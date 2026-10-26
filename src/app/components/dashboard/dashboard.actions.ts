import { createAction } from '@ngrx/store'
import {
    FAILURE_ALL_ACCOUNTS_BY_PERSON_ID_ACTION,
    FAILURE_GET_ACCOUNT_COLOR_ACTION,
    FAILURE_MARKET_MOOD_ACTION,
    FAILURE_PROFILE_PICTURE_ACTION,
    FAILURE_UNIQUE_STYLE_GRAPH_ACTION,
    GET_ACCOUNT_COLOR_ACTION,
    GET_ALL_ACCOUNTS_BY_PERSON_ID_ACTION,
    GET_LAST_COMPLETIONS_ACTION,
    GET_LAST_COMPLETIONS_ACTION_FAILURE,
    GET_LAST_COMPLETIONS_ACTION_SUCCESS,
    GET_MARKET_MOOD_ACTION,
    GET_PROFILE_PICTURE_ACTION,
    GET_RECENT_ACTIVITIES,
    GET_RECENT_ACTIVITIES_FAILURE,
    GET_RECENT_ACTIVITIES_SUCCESS,
    GET_UNIQUE_STYLE_GRAPH_ACTION,
    SUCCESS_ALL_ACCOUNTS_BY_PERSON_ID_ACTION,
    SUCCESS_GET_ACCOUNT_COLOR_ACTION,
    SUCCESS_MARKET_MOOD_ACTION,
    SUCCESS_PROFILE_PICTURE_ACTION,
    SUCCESS_UNIQUE_STYLE_GRAPH_ACTION,
} from './dashboard-actions-constants'

export const getMarketMoodAction = createAction(GET_MARKET_MOOD_ACTION, (accountId: any) => ({ accountId }))
export const getMarketMoodActionSuccess = createAction(SUCCESS_MARKET_MOOD_ACTION, (marketMoodPayload: any, isBackgroundRefresh = false) => ({
    marketMoodPayload,
    isBackgroundRefresh,
}))
export const getMarketMoodActionFailure = createAction(FAILURE_MARKET_MOOD_ACTION, (error: any) => ({ error }))
export const getUniqueStyleGraphAction = createAction(GET_UNIQUE_STYLE_GRAPH_ACTION, (accountId: any) => ({ accountId }))
export const getProfilePictureAction = createAction(GET_PROFILE_PICTURE_ACTION, (accountId: any) => ({ accountId }))
export const successProfilePictureAction = createAction(SUCCESS_PROFILE_PICTURE_ACTION, (profilePicturePayload: any) => ({ profilePicturePayload }))
export const profilePictureActionFailure = createAction(FAILURE_PROFILE_PICTURE_ACTION, (error: any) => ({ error }))

export const getAllAccountsAction = createAction(GET_ALL_ACCOUNTS_BY_PERSON_ID_ACTION, (personId: string) => ({ personId }))

export const getAllAccountsActionSuccess = createAction(SUCCESS_ALL_ACCOUNTS_BY_PERSON_ID_ACTION, (allAccountsPayload: any) => ({ allAccountsPayload }))
export const getAllAccountsActionFailure = createAction(FAILURE_ALL_ACCOUNTS_BY_PERSON_ID_ACTION, (error: any) => ({ error }))
export const getUniqueStyleGraphActionSuccess = createAction(
    SUCCESS_UNIQUE_STYLE_GRAPH_ACTION,
    (uniqueStyleGraphPayload: any, isBackgroundRefresh = false) => ({ uniqueStyleGraphPayload, isBackgroundRefresh })
)
export const getUniqueStyleGraphActionFailure = createAction(FAILURE_UNIQUE_STYLE_GRAPH_ACTION, (error: any) => ({ error }))
export const getAccountColorAction = createAction(GET_ACCOUNT_COLOR_ACTION, (accountId: any) => ({ accountId }))
export const getAccountColorActionSuccess = createAction(SUCCESS_GET_ACCOUNT_COLOR_ACTION, (accountColorPayload: any) => ({ accountColorPayload }))
export const getAccountColorActionFailure = createAction(FAILURE_GET_ACCOUNT_COLOR_ACTION, (error: any) => ({ error }))

export const getLastCompletionsAction = createAction(GET_LAST_COMPLETIONS_ACTION, (accountId: any) => ({ accountId }))
export const getLastCompletionsActionSuccess = createAction(GET_LAST_COMPLETIONS_ACTION_SUCCESS, (lastCompletionsResponse: any, isBackgroundRefresh = false) => ({
    lastCompletionsResponse,
    isBackgroundRefresh,
}))
export const getLastCompletionsActionFailure = createAction(GET_LAST_COMPLETIONS_ACTION_FAILURE, (error: any) => ({ error }))

export const getRecentActivitiesAction = createAction(GET_RECENT_ACTIVITIES, (accountId: any) => ({ accountId }))
export const getRecentActivitiesActionSuccess = createAction(GET_RECENT_ACTIVITIES_SUCCESS, (recentActivitiesResponse: any, isBackgroundRefresh = false) => ({
    recentActivitiesResponse,
    isBackgroundRefresh,
}))
export const getRecentActivitiesActionFailure = createAction(GET_RECENT_ACTIVITIES_FAILURE, (error: any) => ({ error }))
