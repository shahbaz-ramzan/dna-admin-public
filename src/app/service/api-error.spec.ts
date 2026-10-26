import { HTTP_INTERCEPTORS, HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { NavigationEnd, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { ReplaySubject, Subject, TimeoutError } from 'rxjs'
import { getMarketMoodActionFailure, getMarketMoodActionSuccess } from 'src/app/components/dashboard/dashboard.actions'
import K from '../constants'
import { ApiError, ApiErrorInterceptor, ApiErrorNotificationEffects, ensureApiError, isApiError, serverMessage } from './api-error'
import { HANDLE_AUTH_ERROR } from './auth-error.interceptor'
import { MsgService } from './msg.service'

function httpError(status: number, error: any): HttpErrorResponse {
    return new HttpErrorResponse({ status, error, statusText: 'error' })
}

describe('ensureApiError', () => {
    it('prefers the server-provided message over the generic per-status text', () => {
        const result = ensureApiError(httpError(400, { errors: { collections: { error: 'Email already registered' } } }))

        expect(result.message).toBe('Email already registered')
    })

    it('falls back to the generic per-status message when the backend sends no message', () => {
        const result = ensureApiError(httpError(400, {}))

        expect(result.message).toBe('The request could not be completed. Please review the information entered and try again.')
    })

    it('never returns an empty message even for an unrecognized status', () => {
        expect(ensureApiError(httpError(418, {})).message.length).toBeGreaterThan(0)
    })

    it('reports a status-0 failure as an unreachable server', () => {
        const result = ensureApiError(httpError(0, {}))

        expect(result.status).toBe(0)
        expect(result.message).toBe('Unable to reach the server. Please check your internet connection and try again.')
    })

    it('passes an already-normalized ApiError through unchanged', () => {
        const original = ensureApiError(httpError(404, {}))

        expect(ensureApiError(original)).toBe(original)
    })

    it('normalizes a raw HttpErrorResponse that bypassed the interceptor (a 401 left for AuthErrorInterceptor)', () => {
        const result = ensureApiError(httpError(401, {}))

        expect(isApiError(result)).toBeTrue()
        expect(result.status).toBe(401)
        expect(result.message).toBe('Your session has expired. Please log in again to continue.')
    })

    it('normalizes a plain thrown Error into a safe, readable ApiError instead of a mismatched shape', () => {
        const result = ensureApiError(new Error('localStorage quota exceeded'))

        expect(isApiError(result)).toBeTrue()
        expect(result.status).toBe(0)
        expect(result.message.length).toBeGreaterThan(0)
    })

    it('normalizes undefined/null without throwing', () => {
        expect(() => ensureApiError(undefined)).not.toThrow()
        expect(isApiError(ensureApiError(undefined))).toBeTrue()
    })

    it('normalizes a client-side timeout (RxJS TimeoutError) into its own message, not the generic fallback', () => {
        // A hung request never reaches ApiErrorInterceptor - timeout() in NetworkService.httpCall
        // is applied downstream of the interceptor chain, so this is the only place that turns it
        // into something a user or the notification effect can act on.
        const result = ensureApiError(new TimeoutError())

        expect(result.message).toBe('The request took longer than expected and was cancelled. Please try again.')
        expect(ensureApiError(new Error('other')).message).not.toBe(result.message)
    })
})

describe('serverMessage', () => {
    it('prefers errors.collections.error over any other field', () => {
        expect(serverMessage({ errors: { collections: { error: 'The error field.', accountName: 'The other field.' } } })).toBe('The error field.')
    })

    it('falls back to the first string value in errors.collections when there is no .error key', () => {
        // Some endpoints key their validation message under a field-specific name instead of
        // `.error` (e.g. onboarding's business-name validation returns `accountName`/`account`,
        // participant-management's search returns whatever field failed). Before this centralized
        // layer existed, several components read that first collections value directly
        // (first-key-wins) - see ERROR_MESSAGE_PARITY_PLAN.md RC1/V6.
        expect(serverMessage({ errors: { collections: { accountName: 'This business name is already taken.' } } })).toBe(
            'This business name is already taken.'
        )
    })

    it('picks the first collections value in insertion order when there are several field errors', () => {
        expect(serverMessage({ errors: { collections: { account: 'Account field message.', email: 'Email field message.' } } })).toBe(
            'Account field message.'
        )
    })

    it('ignores a non-string value in errors.collections rather than returning it as a message', () => {
        expect(serverMessage({ errors: { collections: { someObject: { nested: true } } } })).toBeUndefined()
    })

    it('falls back to errors.message when collections has nothing usable', () => {
        expect(serverMessage({ errors: { collections: {}, message: 'Top-level errors message.' } })).toBe('Top-level errors message.')
    })

    it('falls back to a string errors field', () => {
        expect(serverMessage({ errors: 'Errors is just a string.' })).toBe('Errors is just a string.')
    })

    it('falls back to body.message when nothing else is present', () => {
        expect(serverMessage({ message: 'Body-level message.' })).toBe('Body-level message.')
    })

    it('returns undefined when the body has no usable message at all', () => {
        expect(serverMessage({})).toBeUndefined()
        expect(serverMessage(undefined)).toBeUndefined()
        expect(serverMessage(null)).toBeUndefined()
    })

    it('does not throw when errors.collections is not an object', () => {
        expect(() => serverMessage({ errors: { collections: 'not an object' } })).not.toThrow()
        expect(serverMessage({ errors: { collections: 'not an object' } })).toBeUndefined()
    })
})

describe('ApiErrorInterceptor', () => {
    let http: HttpClient
    let httpMock: HttpTestingController

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [{ provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true }],
        })
        http = TestBed.inject(HttpClient)
        httpMock = TestBed.inject(HttpTestingController)
    })

    afterEach(() => httpMock.verify())

    it('normalizes any failure into an ApiError', () => {
        let captured: any
        http.get('/api/test').subscribe({ error: (err) => (captured = err) })
        httpMock.expectOne('/api/test').flush('error body', { status: K.NETWORK.STATUS_CODE.SERVER_ERROR, statusText: 'error' })

        expect(isApiError(captured)).toBeTrue()
        expect(captured.status).toBe(K.NETWORK.STATUS_CODE.SERVER_ERROR)
    })

    it('passes a 401 through untouched when HANDLE_AUTH_ERROR is set, so AuthErrorInterceptor stays the sole owner', () => {
        let captured: any
        http.get('/api/test', { context: new HttpContext().set(HANDLE_AUTH_ERROR, true) }).subscribe({ error: (err) => (captured = err) })
        httpMock.expectOne('/api/test').flush('unauthorized', { status: K.NETWORK.STATUS_CODE.UNAUTHORIZED, statusText: 'Unauthorized' })

        expect(captured instanceof HttpErrorResponse).toBeTrue()
        expect(isApiError(captured)).toBeFalse()
    })

    it('still normalizes a 401 when HANDLE_AUTH_ERROR is not set', () => {
        let captured: any
        http.get('/api/test').subscribe({ error: (err) => (captured = err) })
        httpMock.expectOne('/api/test').flush('unauthorized', { status: K.NETWORK.STATUS_CODE.UNAUTHORIZED, statusText: 'Unauthorized' })

        expect(isApiError(captured)).toBeTrue()
        expect(captured.status).toBe(K.NETWORK.STATUS_CODE.UNAUTHORIZED)
    })
})

function apiError(message: string, overrides: Partial<ApiError> = {}): ApiError {
    return { status: 404, message, ...overrides }
}

describe('ApiErrorNotificationEffects', () => {
    let actions$: ReplaySubject<any>
    let navigationEnd$: Subject<NavigationEnd>
    let msgService: jasmine.SpyObj<MsgService>
    let effects: ApiErrorNotificationEffects

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        navigationEnd$ = new Subject<NavigationEnd>()
        msgService = jasmine.createSpyObj('MsgService', ['errorMessage'])

        TestBed.configureTestingModule({
            providers: [
                ApiErrorNotificationEffects,
                provideMockActions(() => actions$),
                { provide: MsgService, useValue: msgService },
                { provide: Router, useValue: { events: navigationEnd$ } },
            ],
        })

        effects = TestBed.inject(ApiErrorNotificationEffects)
    })

    it('toasts the ApiError message for a single failure explicitly opted in', () => {
        effects.notifyApiFailure.subscribe()
        actions$.next({ type: 'someActionFailure', error: apiError('Could not be found.'), notify: true })

        expect(msgService.errorMessage).toHaveBeenCalledWith('Could not be found.')
    })

    it('toasts an action never registered anywhere as long as it opts in - proves structural coverage, not a hand-maintained list', () => {
        // Regression guard for the exact class of bug that broke Recent Activities: nothing here
        // enumerates action types, so a brand-new feature's failure action is caught automatically
        // as long as it carries a real ApiError and notify: true, with no per-feature registration step.
        effects.notifyApiFailure.subscribe()
        actions$.next({ type: 'someBrandNewFeatureActionFailure', error: apiError('Some new feature failed.'), notify: true })

        expect(msgService.errorMessage).toHaveBeenCalledWith('Some new feature failed.')
    })

    it('ignores a success action - it has no ApiError-shaped error to react to', () => {
        effects.notifyApiFailure.subscribe()
        actions$.next(getMarketMoodActionSuccess({ body: { data: 'fine' } }, false))

        expect(msgService.errorMessage).not.toHaveBeenCalled()
    })

    it('ignores a failure action whose error is missing/malformed rather than guessing a message', () => {
        effects.notifyApiFailure.subscribe()
        actions$.next({ type: 'someActionFailure', error: undefined, notify: true })

        expect(msgService.errorMessage).not.toHaveBeenCalled()
    })

    it('respects an explicit notify: false opt-out for ancillary/background failures (D2/D3, USERS_TABLE_ERROR_HANDLING_PLAN.md)', () => {
        effects.notifyApiFailure.subscribe()
        actions$.next({ type: 'someBackgroundActionFailure', error: apiError('Background lookup failed.'), notify: false })

        expect(msgService.errorMessage).not.toHaveBeenCalled()
    })

    it('stays silent when notify is omitted - opt-in, not opt-out: an API only toasts if it explicitly says so', () => {
        // This is the policy this whole layer runs on: only APIs that showed a message before
        // this centralized layer existed get notify: true (see ERROR_MESSAGE_PARITY_PLAN.md).
        // A real transport failure from an endpoint that was never wired for it (e.g. the actions
        // this spec imports from dashboard.actions, which never had a bespoke message) must not
        // start toasting just because it now carries a real ApiError.
        effects.notifyApiFailure.subscribe()
        actions$.next(getMarketMoodActionFailure(apiError('Would have been visible under the old opt-out default.')))

        expect(msgService.errorMessage).not.toHaveBeenCalled()
    })

    it('dedupes the identical message within one view instead of blanket-throttling everything', () => {
        effects.notifyApiFailure.subscribe()

        actions$.next({ type: 'firstActionFailure', error: apiError('Server error.'), notify: true })
        actions$.next({ type: 'secondActionFailure', error: apiError('Server error.'), notify: true })

        expect(msgService.errorMessage).toHaveBeenCalledTimes(1)
    })

    it('does NOT swallow a distinct message that arrives immediately after a different one', () => {
        // This is the exact case the old throttleTime(3000) got wrong: a deliberate action's
        // error must never be hidden just because something else was toasted moments earlier.
        effects.notifyApiFailure.subscribe()

        actions$.next({ type: 'firstActionFailure', error: apiError('Market Mood failed.'), notify: true })
        actions$.next({ type: 'secondActionFailure', error: apiError('Unique Style Graph failed.'), notify: true })

        expect(msgService.errorMessage).toHaveBeenCalledTimes(2)
        expect(msgService.errorMessage).toHaveBeenCalledWith('Market Mood failed.')
        expect(msgService.errorMessage).toHaveBeenCalledWith('Unique Style Graph failed.')
    })

    it('collapses several independently-resolving widgets on one page that all fail with the same message, however far apart they resolve', () => {
        // The exact real-world case this mechanism exists for: a report page dispatches several
        // requests at once (risk allocations, financial planning insights, t-score, factor
        // relationship), several of which are rejected for the same underlying reason (the
        // participant hasn't completed their assessment) - each resolves on its own independent
        // network round-trip, so they can arrive arbitrarily far apart, not just moments apart. A
        // time window can only ever push this problem to whatever gap exceeds it; scoping by view
        // instead of by time means it is caught regardless of how long the slowest widget takes.
        effects.notifyApiFailure.subscribe()

        actions$.next({ type: 'getRiskAllocationsActionFailure', error: apiError('Discovery is not completed.'), notify: true })
        actions$.next({ type: 'getFinancialPlanningInsightsActionFailure', error: apiError('Discovery is not completed.'), notify: true })
        actions$.next({ type: 'getFactorRelationshipActionFailure', error: apiError('Discovery is not completed.'), notify: true })
        actions$.next({ type: 'getTScoreActionFailure', error: apiError('Discovery is not completed.'), notify: true })

        expect(msgService.errorMessage).toHaveBeenCalledTimes(1)
    })

    it('shows the same message again on a genuinely new view (after navigation), not just after some elapsed time', () => {
        effects.notifyApiFailure.subscribe()

        actions$.next({ type: 'firstActionFailure', error: apiError('Discovery is not completed.'), notify: true })
        expect(msgService.errorMessage).toHaveBeenCalledTimes(1)

        // Same message again, no navigation in between - still suppressed, no matter how much
        // real time passes (there is no timer to wait out).
        actions$.next({ type: 'secondActionFailure', error: apiError('Discovery is not completed.'), notify: true })
        expect(msgService.errorMessage).toHaveBeenCalledTimes(1)

        // The user navigates - e.g. to a different participant's report. This is a genuinely new
        // view, so the same message failing again there is real information, not a repeat.
        navigationEnd$.next(new NavigationEnd(1, '/users/report/2', '/users/report/2'))

        actions$.next({ type: 'thirdActionFailure', error: apiError('Discovery is not completed.'), notify: true })
        expect(msgService.errorMessage).toHaveBeenCalledTimes(2)
    })
})
