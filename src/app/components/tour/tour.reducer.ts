import { createReducer, on } from '@ngrx/store'
import {
    openHomeWalkthroughAction,
    openUsersWalkthroughAction,
    getActiveUserToursSuccessAction,
    getActiveUserToursFailureAction,
    upsertUserTourStateSuccessAction,
    upsertUserTourStateFailureAction,
    getActiveUserBannersSuccessAction,
    getActiveUserBannersFailureAction,
    upsertUserBannerStateSuccessAction,
    upsertUserBannerStateFailureAction,
} from './tour.actions'

export interface TourState {
    request: 'home' | 'users' | null
    tours: any
    banners: any
    loading: boolean
    error: any
}

export const initialTourState: TourState = {
    request: null,
    tours: null,
    banners: null,
    loading: false,
    error: null,
}

export const tourReducer = createReducer(
    initialTourState,
    on(openHomeWalkthroughAction, (state) => ({ ...state, request: 'home' as const })),
    on(openUsersWalkthroughAction, (state) => ({ ...state, request: 'users' as const })),

    // API state management
    on(getActiveUserToursSuccessAction, (state, { tours }) => ({
        ...state,
        tours,
        loading: false,
        error: null,
    })),
    on(getActiveUserToursFailureAction, (state, { error }) => ({
        ...state,
        loading: false,
        error,
    })),

    on(upsertUserTourStateSuccessAction, (state, { result }) => ({
        ...state,
        tours: result,
        loading: false,
        error: null,
    })),
    on(upsertUserTourStateFailureAction, (state, { error }) => ({
        ...state,
        loading: false,
        error,
    })),

    // Banner state management
    on(getActiveUserBannersSuccessAction, (state, { banners }) => ({
        ...state,
        banners,
        loading: false,
        error: null,
    })),
    on(getActiveUserBannersFailureAction, (state, { error }) => ({
        ...state,
        loading: false,
        error,
    })),

    on(upsertUserBannerStateSuccessAction, (state, { result }) => ({
        ...state,
        banners: result,
        loading: false,
        error: null,
    })),
    on(upsertUserBannerStateFailureAction, (state, { error }) => ({
        ...state,
        loading: false,
        error,
    }))
)
