import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { Action } from '@ngrx/store'
import { EMPTY, merge, Observable, of } from 'rxjs'
import { catchError, filter, finalize, map, mergeMap } from 'rxjs/operators'
import { catchApiError } from 'src/app/service/api-error'
import {
    GET_ACCOUNT_COLOR_ACTION,
    GET_ALL_ACCOUNTS_BY_PERSON_ID_ACTION,
    GET_LAST_COMPLETIONS_ACTION,
    GET_MARKET_MOOD_ACTION,
    GET_PROFILE_PICTURE_ACTION,
    GET_RECENT_ACTIVITIES,
    GET_UNIQUE_STYLE_GRAPH_ACTION,
} from './dashboard-actions-constants'
import {
    getAccountColorActionFailure,
    getAccountColorActionSuccess,
    getAllAccountsActionFailure,
    getAllAccountsActionSuccess,
    getLastCompletionsActionFailure,
    getLastCompletionsActionSuccess,
    getMarketMoodActionFailure,
    getMarketMoodActionSuccess,
    getRecentActivitiesActionFailure,
    getRecentActivitiesActionSuccess,
    getUniqueStyleGraphActionFailure,
    getUniqueStyleGraphActionSuccess,
    profilePictureActionFailure,
    successProfilePictureAction,
} from './dashboard.actions'
import { DashboardCacheStorageService } from 'src/app/service/dashboard-cache-storage.service'
import { DashboardServiceService } from './dashboard-service.service'

/**
 * Runs a stale-while-revalidate fetch for a dashboard widget: if the localStorage cache has a
 * usable (< 30 min old) entry for `widgetKey`, emits the cached success action immediately
 * (loader stays off) and then revalidates in the background with `silent: true`, re-emitting
 * the success action with `isBackgroundRefresh: true` on completion. On a cold cache, emits
 * the normal loader-visible flow and a `*_FAILURE` action on error instead of swallowing it.
 *
 * `toSuccessAction`/`toFailureAction` must be the real action creators (e.g.
 * `getMarketMoodActionSuccess`), never a hand-typed `{ type: '...' }` object - a typed-by-hand
 * string can silently drift from the action's actual registered type (this bit Recent Activities
 * previously: its dispatched type didn't match what the reducer's `on()` was listening for, so
 * neither success nor failure ever reached the store).
 */
function withStaleWhileRevalidate<T>(
    widgetKey: string,
    cache: DashboardCacheStorageService,
    inFlightRefreshes: Set<string>,
    fetchLive: (silent: boolean) => Observable<T>,
    toSuccessAction: (payload: T, isBackgroundRefresh: boolean) => Action,
    toFailureAction: (error: any) => Action
): Observable<Action> {
    const cached = cache.get<T>(widgetKey)

    if (cached.status === 'miss') {
        return fetchLive(false).pipe(
            map((response) => {
                cache.set(widgetKey, response)
                return toSuccessAction(response, false)
            }),
            catchApiError(toFailureAction)
        )
    }

    // Always dispatch the cached value immediately - the corresponding *_ACTION dispatch that
    // triggered this already flipped the widget's `loading` flag to true in the reducer, and
    // this is the only thing that flips it back. Skipping this when the store "already has this
    // value" (an earlier version of this function did that as a rebuild-avoidance optimization)
    // caused an infinite loader: if the background refresh below also found no change, nothing
    // ever dispatched a success action again and `loading` stayed true forever. Do not
    // reintroduce that skip without decoupling "reset loading" from "should re-render" first.
    const cachedAction$ = of(toSuccessAction(cached.data as T, false))

    if (inFlightRefreshes.has(widgetKey)) {
        return cachedAction$
    }

    inFlightRefreshes.add(widgetKey)
    const backgroundRefresh$ = fetchLive(true).pipe(
        map((response) => ({ response, changed: cache.setIfChanged(widgetKey, response) })),
        // Skip re-dispatching (and therefore re-rendering) when the revalidated data is
        // identical to what's already on screen - this is what removes the visible "jerk"
        // on the common case where nothing actually changed within the cache window. Safe to
        // filter here (unlike the cachedAction$ above) because `loading` was already reset by
        // the immediate cachedAction$ dispatch, so there's nothing left that needs this to fire.
        filter(({ changed }) => changed),
        map(({ response }) => toSuccessAction(response, true)),
        catchError(() => EMPTY),
        // finalize (not the success map) so this clears on the error path too, where
        // catchError(() => EMPTY) completes without ever reaching a `next`.
        finalize(() => inFlightRefreshes.delete(widgetKey))
    )

    return merge(cachedAction$, backgroundRefresh$)
}

@Injectable()
export class DashboardEffect {
    private inFlightRefreshes = new Set<string>()

    constructor(
        private actions$: Actions,
        private dashboardService: DashboardServiceService,
        private dashboardCache: DashboardCacheStorageService
    ) {}

    getMarketMoodData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_MARKET_MOOD_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    `marketMood:${accountId}`,
                    this.dashboardCache,
                    this.inFlightRefreshes,
                    (silent) => this.dashboardService.getMarketMoodCall(accountId, silent),
                    (marketMoodPayload, isBackgroundRefresh) => getMarketMoodActionSuccess(marketMoodPayload, isBackgroundRefresh),
                    (error) => getMarketMoodActionFailure(error)
                )
            )
        )
    )

    getUniqueStyleGraphData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_UNIQUE_STYLE_GRAPH_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    `uniqueStyleGraph:${accountId}`,
                    this.dashboardCache,
                    this.inFlightRefreshes,
                    (silent) => this.dashboardService.getUniqueStyleGraphCall(accountId, silent),
                    (uniqueStyleGraphPayload, isBackgroundRefresh) => getUniqueStyleGraphActionSuccess(uniqueStyleGraphPayload, isBackgroundRefresh),
                    (error) => getUniqueStyleGraphActionFailure(error)
                )
            )
        )
    )
    profilePictureData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_PROFILE_PICTURE_ACTION),
            mergeMap(({ accountId }) =>
                this.dashboardService.getProfilePictureCall(accountId).pipe(
                    map((response) => successProfilePictureAction(response)),
                    catchApiError((error) => profilePictureActionFailure(error))
                )
            )
        )
    )
    getAllAccountsData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ALL_ACCOUNTS_BY_PERSON_ID_ACTION),
            mergeMap(({ personId }) =>
                this.dashboardService.getAllAccountsByPersonIdCall(personId).pipe(
                    map((response) => getAllAccountsActionSuccess(response)),
                    catchApiError((error) => getAllAccountsActionFailure(error))
                )
            )
        )
    )
    getAccountColorData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ACCOUNT_COLOR_ACTION),
            mergeMap(({ accountId }) =>
                this.dashboardService.getAccountColorCall(accountId).pipe(
                    map((response) => getAccountColorActionSuccess(response)),
                    catchApiError((error) => getAccountColorActionFailure(error))
                )
            )
        )
    )

    getAllCompletions = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_LAST_COMPLETIONS_ACTION),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    `lastCompletions:${accountId}`,
                    this.dashboardCache,
                    this.inFlightRefreshes,
                    (silent) => this.dashboardService.getLastCompletionsCall(accountId, silent),
                    (lastCompletionsResponse, isBackgroundRefresh) => getLastCompletionsActionSuccess(lastCompletionsResponse, isBackgroundRefresh),
                    (error) => getLastCompletionsActionFailure(error)
                )
            )
        )
    )

    getRecentActivities = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_RECENT_ACTIVITIES),
            mergeMap(({ accountId }) =>
                withStaleWhileRevalidate(
                    `recentActivities:${accountId}`,
                    this.dashboardCache,
                    this.inFlightRefreshes,
                    (silent) => this.dashboardService.getRecentActivitiesCall(accountId, silent),
                    (recentActivitiesResponse, isBackgroundRefresh) => getRecentActivitiesActionSuccess(recentActivitiesResponse, isBackgroundRefresh),
                    (error) => getRecentActivitiesActionFailure(error)
                )
            )
        )
    )
}
