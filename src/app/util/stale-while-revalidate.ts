import { asapScheduler, EMPTY, merge, Observable, of, scheduled } from 'rxjs'
import { catchError, filter, finalize, map } from 'rxjs/operators'

export type SwrStatus = 'fresh' | 'stale' | 'miss'

// Minimum time between background refreshes of the same key - guards against rapid re-dispatch
// of a stale key (e.g. toggling between two saved filter views) firing a new network request
// each time even though the previous refresh just completed.
const BACKGROUND_REFRESH_COOLDOWN_MS = 5000

export interface SwrCache<T> {
    get(key: string): { status: SwrStatus; data?: T }
    setIfChanged(key: string, data: T): boolean
}

/**
 * Generic stale-while-revalidate fetch, mirroring dashboard.effect.ts's
 * withStaleWhileRevalidate: on a cache hit, emits the cached value immediately (loader stays
 * off) and revalidates in the background with `silent: true`, re-emitting only if the
 * revalidated data actually changed. On a cold cache, runs the normal loader-visible fetch and
 * emits a failure action on error instead of swallowing it.
 *
 * Kept as its own copy (not shared with dashboard.effect.ts) so existing, working dashboard
 * caching is never touched by changes made here.
 */
export function withStaleWhileRevalidate<T>(
    key: string,
    cache: SwrCache<T>,
    inFlightRefreshes: Set<string>,
    fetchLive: (silent: boolean) => Observable<T>,
    toSuccessAction: (payload: T, isBackgroundRefresh: boolean) => any,
    // Optional so callers whose existing (pre-caching) effect swallowed errors with
    // `catchError(() => EMPTY)` can keep that exact behaviour on a cold-cache miss instead of
    // being forced to invent a *_FAILURE action that never existed before - see
    // SETTINGS_PAGE_CACHE_PLAN.md §3.1.
    toFailureAction?: (error: any) => any,
    lastRefreshedAt?: Map<string, number>
): Observable<any> {
    const cached = cache.get(key)

    if (cached.status === 'miss') {
        return fetchLive(false).pipe(
            map((response) => {
                cache.setIfChanged(key, response)
                return toSuccessAction(response, false)
            }),
            catchError((error) => (toFailureAction ? of(toFailureAction(error)) : EMPTY))
        )
    }

    // Dispatch the cached value on a microtask (asapScheduler), not purely synchronously.
    // Some consumers (e.g. single-user-selection.component.ts) dispatch the triggering action
    // BEFORE setting up their own `this.actions.pipe(ofType(...))` subscription later in the
    // same ngOnInit - on a real cache miss this is harmless because the network round trip is
    // always slower than the rest of ngOnInit finishing, but a pure-synchronous cache-hit
    // emission fires within the SAME call stack as the dispatch, before that later subscription
    // exists yet, and is silently missed forever (no data ever renders on any reselect, only on
    // the very first cold-cache visit). Deferring to a microtask lets the rest of ngOnInit's
    // synchronous body - including every subscription in it - finish registering first, while
    // still resolving before the next paint, so there is no visible loader flash. Reducer-driven
    // consumers (e.g. dashboard.effect.ts's identical pattern) don't need this: the store's
    // reducer is registered once at app bootstrap, not per component instance, so a synchronous
    // emission there was never at risk of arriving before its listener existed.
    const cachedAction$ = scheduled([toSuccessAction(cached.data as T, false)], asapScheduler)

    if (inFlightRefreshes.has(key)) {
        return cachedAction$
    }

    const lastRefreshed = lastRefreshedAt?.get(key)
    if (lastRefreshed !== undefined && Date.now() - lastRefreshed < BACKGROUND_REFRESH_COOLDOWN_MS) {
        return cachedAction$
    }

    inFlightRefreshes.add(key)
    const backgroundRefresh$ = fetchLive(true).pipe(
        map((response) => ({ response, changed: cache.setIfChanged(key, response) })),
        filter(({ changed }) => changed),
        map(({ response }) => toSuccessAction(response, true)),
        catchError(() => EMPTY),
        finalize(() => {
            inFlightRefreshes.delete(key)
            lastRefreshedAt?.set(key, Date.now())
        })
    )

    return merge(cachedAction$, backgroundRefresh$)
}
