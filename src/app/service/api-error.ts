import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { Actions, createEffect } from '@ngrx/effects'
import { Action } from '@ngrx/store'
import { Observable, of, throwError, TimeoutError } from 'rxjs'
import { catchError, filter, tap } from 'rxjs/operators'
import K from '../constants'
import { HANDLE_AUTH_ERROR } from './auth-error.interceptor'
import { MsgService } from './msg.service'

// ---------------------------------------------------------------------------
// The model: one normalized error shape for the whole app
// ---------------------------------------------------------------------------

export interface ApiError {
    status: number
    /** Always user-readable: the backend's own message when it sent one, else generic text per status. */
    message: string
}

/**
 * Generic user-facing text per HTTP status, used when the backend sends no message of its own.
 *
 * House style for anything a user reads: state plainly what happened, then what they can do about
 * it. No status codes or HTTP jargon ("Internal Server Error" means nothing to an account holder),
 * no exclamation marks, no blaming the user, and no dead ends - every message either offers a next
 * step or names who to contact. Sentence case, ending in a full stop, to match the rest of the app.
 */
const MESSAGES: Record<number, string> = {
    [K.NETWORK.STATUS_CODE.TIMED_OUT]: 'Unable to reach the server. Please check your internet connection and try again.',
    [K.NETWORK.STATUS_CODE.BAD_REQUEST]: 'The request could not be completed. Please review the information entered and try again.',
    [K.NETWORK.STATUS_CODE.UNAUTHORIZED]: 'Your session has expired. Please log in again to continue.',
    [K.NETWORK.STATUS_CODE.FORBIDDEN]: 'You do not have permission to perform this action. Please contact your administrator if you need access.',
    [K.NETWORK.STATUS_CODE.NOT_FOUND]: 'The requested information could not be found. It may have been moved or deleted.',
    [K.NETWORK.STATUS_CODE.CONFLICT]: 'This change conflicts with a more recent update. Please refresh the page and try again.',
    [K.NETWORK.STATUS_CODE.SERVER_ERROR]: 'An unexpected error occurred on the server. Please try again, or contact support if the issue persists.',
    [K.NETWORK.STATUS_CODE.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again in a few minutes.',
}

const TIMEOUT_MESSAGE = 'The request took longer than expected and was cancelled. Please try again.'

/** Fallback for an unrecognized status or a non-HTTP throw. Intentionally vague but never a dead end. */
const DEFAULT_MESSAGE = 'An unexpected error occurred. Please try again, or contact support if the issue persists.'

/**
 * Structural check for "is this an ApiError", so ApiErrorNotificationEffects below can recognize any
 * action carrying a normalized error without enumerating every failure action type.
 *
 * Explicitly excludes HttpErrorResponse: it also happens to carry both a `status: number` and a
 * `message: string` (its own generic "Http failure response for ..." text, not the backend's),
 * so without this exclusion a raw HttpErrorResponse that reaches ensureApiError below would
 * false-positive as already-normalized and skip message extraction entirely.
 */
export function isApiError(value: unknown): value is ApiError {
    return (
        typeof value === 'object' &&
        value !== null &&
        !(value instanceof HttpErrorResponse) &&
        typeof (value as ApiError).status === 'number' &&
        typeof (value as ApiError).message === 'string'
    )
}

/**
 * The message the backend actually sent, checked in the order the rest of the app reads it.
 * Exported so an effect that throws a resolved-but-unusable response (a validity gate on a
 * withStaleWhileRevalidate call, say) can build an ApiError carrying the same message a raw
 * HttpErrorResponse would have gotten via ensureApiError, instead of losing it to the generic
 * DEFAULT_MESSAGE - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D5 for the concrete case.
 *
 * `errors.collections.error` wins when present, matching the majority of endpoints. Some
 * endpoints instead key their validation error under a field-specific name (e.g. `accountName`,
 * `account`) - before this centralized layer existed, several components read that first
 * collections value directly (first-key-wins). Falling back to the first string value in
 * `errors.collections` here reproduces that behavior generically, instead of hardcoding endpoint-
 * specific field names - see ERROR_MESSAGE_PARITY_PLAN.md RC1/V6.
 */
export function serverMessage(body: any): string | undefined {
    return (
        body?.errors?.collections?.error ||
        firstCollectionsValue(body?.errors?.collections) ||
        body?.errors?.message ||
        (typeof body?.errors === 'string' ? body.errors : undefined) ||
        body?.message ||
        undefined
    )
}

function firstCollectionsValue(collections: unknown): string | undefined {
    if (typeof collections !== 'object' || collections === null) return undefined
    for (const value of Object.values(collections)) {
        if (typeof value === 'string' && value) return value
    }
    return undefined
}

/**
 * Guarantees a genuine ApiError whatever reaches it, so every reader can safely read `.message`.
 * Besides a normal interceptor failure this also sees: a 401 marked HANDLE_AUTH_ERROR (rethrown raw
 * so AuthErrorInterceptor stays the sole 401 handler), a client-side request timeout (an RxJS
 * TimeoutError - `timeout()` in NetworkService.httpCall runs downstream of the interceptor chain, so
 * ApiErrorInterceptor never sees it), and a plain throw from code in an effect's own `map()` that
 * never went through HTTP at all.
 */
export function ensureApiError(error: unknown): ApiError {
    if (isApiError(error)) return error

    if (error instanceof HttpErrorResponse) {
        return {
            status: error.status,
            message: serverMessage(error.error) || MESSAGES[error.status] || DEFAULT_MESSAGE,
        }
    }

    return {
        status: 0,
        message: error instanceof TimeoutError ? TIMEOUT_MESSAGE : DEFAULT_MESSAGE,
    }
}

/** Replaces the repeated `catchError((error) => of({ type: FAILURE_..., error }))` in effects. */
export function catchApiError<T>(toFailureAction: (error: ApiError) => T) {
    return (source: Observable<any>): Observable<any> => source.pipe(catchError((error: unknown) => of(toFailureAction(ensureApiError(error)))))
}

// ---------------------------------------------------------------------------
// Step 1: classify every failed request (registered in app.module)
// ---------------------------------------------------------------------------

/**
 * Normalizes every failed request into an ApiError and rethrows it, so effects/components never
 * touch a raw HttpErrorResponse. Classification only - toasting is ApiErrorNotificationEffects' job.
 * 401s marked HANDLE_AUTH_ERROR pass through untouched so AuthErrorInterceptor stays the sole owner
 * of logout.
 */
@Injectable({
    providedIn: 'root',
})
export class ApiErrorInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (req.context.get(HANDLE_AUTH_ERROR) && error.status === K.NETWORK.STATUS_CODE.UNAUTHORIZED) {
                    return throwError(() => error)
                }
                return throwError(() => ensureApiError(error))
            })
        )
    }
}

// ---------------------------------------------------------------------------
// Step 2: toast whatever ends up in the store as a failure (registered in app.module)
// ---------------------------------------------------------------------------

/**
 * Toasts any action across the whole app whose `error` is an ApiError AND whose `notify` flag is
 * explicitly `true` - nothing to register per feature, but nothing toasts by accident either.
 * Filters structurally instead of with `ofType(...)` so a new feature's failure action is picked up
 * automatically the moment it sets `notify: true`, without a change here.
 *
 * `notify` is opt-in, not opt-out: omitting it (or setting it `false`) stays silent. Each action
 * creator/effect that sets `notify: true` was checked against the pre-migration codebase (commit
 * 515cb13) to confirm that exact API showed a message before - see ERROR_MESSAGE_PARITY_PLAN.md.
 * This keeps the generic layer from surfacing a toast for any API that never had one, while still
 * letting a genuinely new feature opt in deliberately.
 *
 * Dedupe is scoped to the current view, not a rolling time window. A page can dispatch several
 * independent requests that all fail for one shared underlying reason (e.g. a report page's risk-
 * allocations, financial-planning, t-score and factor-relationship widgets all rejected because the
 * participant hasn't completed their assessment) - each resolves on its own network round-trip, so
 * they can be spaced arbitrarily far apart. A time window just delays the same problem to whatever
 * value it's set to: two widgets failing further apart than the window still stack duplicate
 * toasts, and there is no window short enough to catch every real gap without also being long
 * enough to accidentally swallow a second, later, genuinely-new failure with coincidentally the
 * same text. Scoping to "shown once since the last navigation" instead is correct regardless of
 * timing: it can never miss a duplicate no matter how far apart the two failures resolve, and it
 * naturally allows the SAME message to show again on a genuinely new view (a different participant,
 * a different report) since NavigationEnd clears the record.
 */
@Injectable()
export class ApiErrorNotificationEffects {
    private shownThisView = new Set<string>()

    notifyApiFailure = createEffect(
        () =>
            this.actions$.pipe(
                filter((action): action is Action & { error: ApiError; notify?: boolean } => isApiError((action as any)?.error)),
                filter((action) => action.notify === true),
                filter(({ error }) => this.shouldShow(error.message)),
                tap(({ error }) => this.msgService.errorMessage(error.message))
            ),
        { dispatch: false }
    )

    constructor(
        private actions$: Actions,
        private msgService: MsgService,
        router: Router
    ) {
        router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.shownThisView.clear())
    }

    // Normalized so several widgets independently reporting the same backend message with
    // incidental whitespace/casing differences (each hits its own endpoint, so the exact response
    // body isn't guaranteed byte-identical) still collapse to one toast instead of slipping past
    // the exact-match check as "different" messages.
    private shouldShow(message: string): boolean {
        const key = message.trim().toLowerCase()
        if (this.shownThisView.has(key)) return false
        this.shownThisView.add(key)
        return true
    }
}
