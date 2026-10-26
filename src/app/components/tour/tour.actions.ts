import { createAction, props } from '@ngrx/store'

export const triggerAppWalkthroughAction = createAction('[Tour] Trigger App Walkthrough')
export const openHomeWalkthroughAction = createAction('[Tour] Open Home Walkthrough')
export const openUsersWalkthroughAction = createAction('[Tour] Open Users Walkthrough')

// API Actions
export const getActiveUserToursAction = createAction('[Tour] Get Active User Tours', props<{ userId: string }>())
export const getActiveUserToursSuccessAction = createAction('[Tour] Get Active User Tours Success', props<{ tours: any }>())
export const getActiveUserToursFailureAction = createAction('[Tour] Get Active User Tours Failure', props<{ error: any }>())

export const upsertUserTourStateAction = createAction('[Tour] Upsert User Tour State', props<{ payload: any }>())
export const upsertUserTourStateSuccessAction = createAction('[Tour] Upsert User Tour State Success', props<{ result: any }>())
export const upsertUserTourStateFailureAction = createAction('[Tour] Upsert User Tour State Failure', props<{ error: any }>())

// Banner Actions
export const getActiveUserBannersAction = createAction('[Tour] Get Active User Banners', props<{ userId: string }>())
export const getActiveUserBannersSuccessAction = createAction('[Tour] Get Active User Banners Success', props<{ banners: any }>())
export const getActiveUserBannersFailureAction = createAction('[Tour] Get Active User Banners Failure', props<{ error: any }>())

export const upsertUserBannerStateAction = createAction('[Tour] Upsert User Banner State', props<{ payload: any }>())
export const upsertUserBannerStateSuccessAction = createAction('[Tour] Upsert User Banner State Success', props<{ result: any }>())
export const upsertUserBannerStateFailureAction = createAction('[Tour] Upsert User Banner State Failure', props<{ error: any }>())
