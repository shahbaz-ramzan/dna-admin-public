import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { timeout } from 'rxjs/operators'
import K from '../constants'
import Encryption from '../util/Encryption'
import { CACHE_BYPASS, CACHE_TTL_MS } from './cache.interceptor'
import { HANDLE_AUTH_ERROR } from './auth-error.interceptor'
import { SILENT_REQUEST } from '../components/loader/interceptor.service'
import Request from './requests'
@Injectable({
    providedIn: 'root',
})
export class NetworkService {
    constructor(private http: HttpClient) {}

    getToken() {
        return Encryption.decryptData(localStorage.getItem(K.APP.ACCESS_TOKEN) || '')
    }

    getBasicHeaders(): HttpHeaders {
        let reqHeader = null
        reqHeader = new HttpHeaders({
            Authorization: 'Bearer ' + this.getToken() + '1',
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Content-Security-Policy': "frame-ancestors 'none'",
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'no-referrer',
        })
        return reqHeader
    }

    /**
     * @param cacheTtlMs Opt-in cache duration in ms for GET requests (coalesces concurrent
     * callers and replays the cached response until it expires). Omit/0 for no caching.
     * @param silent Opt-in flag for background/silent revalidation calls - suppresses the
     * global full-page loader for this request. Omit/false for normal (loader-visible) calls.
     * @param forceRefresh Opt-in flag to bypass CacheInterceptor's cached response for this exact
     * URL and hit the network, refreshing that cache entry with the live result. Use for a
     * refetch that must reflect a mutation just made (e.g. re-listing after a save) - without
     * this, an app-level cache miss/purge can still be served a stale response by the HTTP-level
     * cache underneath it, since the two caches are otherwise independent.
     */
    httpCall(request: Request, cacheTtlMs = 0, silent = false, forceRefresh = false) {
        // 401 handling (logout) is centralized in AuthErrorInterceptor - no per-call catchError needed here.
        return this.http
            .request(request.method, request.url, {
                body: request.body,
                headers: request.headers,
                observe: 'response',
                context: new HttpContext()
                    .set(CACHE_TTL_MS, cacheTtlMs)
                    .set(CACHE_BYPASS, forceRefresh)
                    .set(HANDLE_AUTH_ERROR, true)
                    .set(SILENT_REQUEST, silent),
            })
            .pipe(
                // Applied downstream of the interceptor chain (ApiErrorInterceptor never sees a
                // TimeoutError - it's not an HttpErrorResponse). ensureApiError() at the effect
                // layer (via catchApiError) is what turns it into a normal ApiError with
                // code: 'TIMEOUT'. Without this, a hung request produced no error at all - the
                // global loader just spun forever with nothing for the user to act on.
                timeout(K.NETWORK.URL.TIMEOUT)
            )
    }
}
