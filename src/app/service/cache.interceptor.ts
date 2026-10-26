import { HttpContextToken, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { shareReplay } from 'rxjs/operators'

/**
 * Opt-in cache TTL (ms) for a GET request. Defaults to 0 (no caching) so existing
 * requests are unaffected unless a caller explicitly sets this on the request context.
 *
 * Dashboard widgets also sit behind a second, independent cache layer:
 * DashboardCacheStorageService's 30-minute localStorage cache (stale-while-revalidate,
 * survives reloads). This interceptor's TTL is intentionally much shorter (30s, see
 * DASHBOARD_CACHE_TTL_MS in dashboard-service.service.ts) and just coalesces near-simultaneous
 * requests to the same URL - including a dashboard "silent" SWR revalidation call that lands
 * within 30s of a previous call for the same widget, which will replay that prior response
 * instead of reaching the network again. That's intentional (data rarely changes in <30s) but
 * worth knowing when debugging "why didn't a background refresh see the latest data".
 */
export const CACHE_TTL_MS = new HttpContextToken<number>(() => 0)

/**
 * Opt-in per-request flag: skip replaying whatever is currently cached for this URL and go to
 * the network, but still write the fresh response back into the cache (refreshing it for the
 * next normal, non-bypassing caller) rather than just skipping the cache outright. Used right
 * after a mutation, once the caller's own app-level cache (e.g. SettingsCacheStorageService) has
 * already decided a real refetch is needed - that decision must not be defeated by this
 * interceptor silently replaying an older response for the same URL within its own TTL window.
 */
export const CACHE_BYPASS = new HttpContextToken<boolean>(() => false)

interface CacheEntry {
    expiresAt: number
    response$: Observable<HttpEvent<unknown>>
}

const SWEEP_INTERVAL_MS = 5 * 60 * 1000

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
    private cache = new Map<string, CacheEntry>()

    constructor() {
        setInterval(() => this.evictExpired(), SWEEP_INTERVAL_MS)
    }

    private evictExpired(): void {
        const now = Date.now()
        for (const [key, entry] of this.cache) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key)
            }
        }
    }

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const ttl = req.context.get(CACHE_TTL_MS)
        if (req.method !== 'GET' || ttl <= 0) {
            return next.handle(req)
        }

        const key = req.urlWithParams
        const now = Date.now()
        const bypass = req.context.get(CACHE_BYPASS)
        const cached = bypass ? undefined : this.cache.get(key)
        if (cached && cached.expiresAt > now) {
            return cached.response$
        }

        // shareReplay coalesces concurrent callers into a single HTTP call AND keeps replaying
        // the last response to new (later, non-overlapping) subscribers until the TTL expires.
        // refCount must be false — refCount:true would drop the buffered value as soon as the
        // first caller's subscription tears down (i.e. right after the response completes),
        // defeating the cache for the common case of two calls that don't overlap in time.
        const response$ = next.handle(req).pipe(shareReplay({ bufferSize: 1, refCount: false }))
        this.cache.set(key, { expiresAt: now + ttl, response$ })
        return response$
    }
}
