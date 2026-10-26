import { createReducer, on } from '@ngrx/store'
import K from 'src/app/constants'
import {
    getAllAccountsAction,
    getAllAccountsActionSuccess,
    getAllAccountsActionFailure,
    getMarketMoodAction,
    getMarketMoodActionSuccess,
    getMarketMoodActionFailure,
    getUniqueStyleGraphAction,
    getUniqueStyleGraphActionSuccess,
    getUniqueStyleGraphActionFailure,
    getAccountColorAction,
    getAccountColorActionSuccess,
    getAccountColorActionFailure,
    getProfilePictureAction,
    successProfilePictureAction,
    profilePictureActionFailure,
    getLastCompletionsAction,
    getLastCompletionsActionSuccess,
    getLastCompletionsActionFailure,
    getRecentActivitiesAction,
    getRecentActivitiesActionSuccess,
    getRecentActivitiesActionFailure,
} from './dashboard.actions'

export const initialState = {
    marketMoodPayload: undefined,
    uniqueStyleGraphPayload: undefined,
    allAccountsPayload: undefined,
    accountColorPayload: undefined,
}

export const dashboardReducer = createReducer(
    initialState,
    on(getMarketMoodAction, (state) => ({
        ...state,
        getMarketMoodLoading: true,
    })),
    on(getMarketMoodActionSuccess, (state, { marketMoodPayload, isBackgroundRefresh }) => ({
        ...state,
        marketMoodPayload: marketMoodPayload?.body,
        marketMoodError: undefined,
        ...(isBackgroundRefresh ? {} : { getMarketMoodLoading: false }),
    })),
    on(getMarketMoodActionFailure, (state, { error }) => ({
        ...state,
        getMarketMoodLoading: false,
        marketMoodError: error,
    })),
    on(getUniqueStyleGraphAction, (state) => ({
        ...state,
        getUniqueStyleLoading: true,
    })),
    on(getUniqueStyleGraphActionSuccess, (state, { uniqueStyleGraphPayload, isBackgroundRefresh }) => ({
        ...state,
        uniqueStyleGraphPayload: uniqueStyleGraphPayload?.body,
        uniqueStyleGraphError: undefined,
        ...(isBackgroundRefresh ? {} : { getUniqueStyleLoading: false }),
    })),
    on(getUniqueStyleGraphActionFailure, (state, { error }) => ({
        ...state,
        getUniqueStyleLoading: false,
        uniqueStyleGraphError: error,
    })),
    on(getAllAccountsAction, (state) => ({
        ...state,
        getAllAccountsLoading: true,
    })),
    on(getAllAccountsActionSuccess, (state, { allAccountsPayload }) => ({
        ...state,
        allAccountsPayload: allAccountsPayload?.body,
        allAccountsError: undefined,
        getAllAccountsLoading: false,
    })),
    on(getAllAccountsActionFailure, (state, { error }) => ({
        ...state,
        getAllAccountsLoading: false,
        allAccountsError: error,
    })),
    on(getAccountColorAction, (state) => ({
        ...state,
        getAccountColorLoading: true,
    })),
    on(getAccountColorActionSuccess, (state, { accountColorPayload }) => {
        const colorPayload = { ...accountColorPayload?.body }
        colorPayload['data'] = {
            primaryColor: colorPayload?.data?.primaryColor ? colorPayload?.data?.primaryColor : K.APP.DEFAULT_PRIMARY_COLOR,
            secondaryColor: colorPayload?.data?.secondaryColor ? colorPayload?.data?.secondaryColor : K.APP.DEFAULT_SECONDARY_COLOR,
            accountId: colorPayload?.data?.accountId,
            secondaryColor2:
                colorPayload.data?.secondaryColor === K.APP.DEFAULT_SECONDARY_COLOR ? K.APP.DEFAULT_SECONDARY_COLOR2 : colorPayload.data?.secondaryColor,
        }
        return {
            ...state,
            accountColorPayload: colorPayload,
            accountColorError: undefined,
            getAccountColorLoading: false,
        }
    }),
    on(getAccountColorActionFailure, (state, { error }) => ({
        ...state,
        getAccountColorLoading: false,
        accountColorError: error,
    })),

    on(getLastCompletionsAction, (state) => ({
        ...state,
        getLastCompletionsLoading: true,
    })),
    on(getLastCompletionsActionSuccess, (state, { lastCompletionsResponse, isBackgroundRefresh }) => ({
        ...state,
        lastCompletionsResponse: lastCompletionsResponse?.body,
        lastCompletionsError: undefined,
        ...(isBackgroundRefresh ? {} : { getLastCompletionsLoading: false }),
    })),
    on(getLastCompletionsActionFailure, (state, { error }) => ({
        ...state,
        getLastCompletionsLoading: false,
        lastCompletionsError: error,
    })),
    on(getProfilePictureAction, (state) => ({
        ...state,
        getProfilePictureLoading: true,
    })),
    on(successProfilePictureAction, (state, { profilePicturePayload }) => ({
        ...state,
        profilePicturePayload: profilePicturePayload?.body,
        profilePictureError: undefined,
        getProfilePictureLoading: false,
    })),
    on(profilePictureActionFailure, (state, { error }) => ({
        ...state,
        getProfilePictureLoading: false,
        profilePictureError: error,
    })),

    on(getRecentActivitiesAction, (state) => ({
        ...state,
        getRecentActivitiesLoading: true,
    })),
    on(getRecentActivitiesActionSuccess, (state, { recentActivitiesResponse, isBackgroundRefresh }) => ({
        ...state,
        recentActivitiesResponse: recentActivitiesResponse?.body,
        recentActivitiesError: undefined,
        ...(isBackgroundRefresh ? {} : { getRecentActivitiesLoading: false }),
    })),
    on(getRecentActivitiesActionFailure, (state, { error }) => ({
        ...state,
        getRecentActivitiesLoading: false,
        recentActivitiesError: error,
    }))
)
