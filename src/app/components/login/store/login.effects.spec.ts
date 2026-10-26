import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { Observable, ReplaySubject, of, throwError } from 'rxjs'
import { LoginService } from 'src/app/service/login.service'
import { checkIdpUserAction, getAllAccountsAction, getIdpUserAction, upsertIdpAction } from './login.actions'
import { LoginEffects } from './login.effects'

/**
 * These effects classify purely on `response.status` - the real HTTP status - never a body field.
 * There is no envelope status to read: the .NET upgrade dropped `body.statusCode` from the body and
 * never replaced it with anything readable client-side (confirmed against a real dev response - see
 * the "Backend response contract" section in the README). A resolved response is a success; a
 * thrown HttpErrorResponse (real 4xx/5xx) is a failure, already turned into an ApiError by
 * ApiErrorInterceptor before it reaches these effects. `catchApiError` is the only place failure is
 * handled - there's no per-effect classification left to write.
 */
describe('LoginEffects.getAllAccountsByPersonId', () => {
    let actions$: ReplaySubject<any>
    let effect: LoginEffects
    let loginService: jasmine.SpyObj<LoginService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        loginService = jasmine.createSpyObj('LoginService', ['getAccountsByPersonIdCall', 'checkIdpUserCall', 'upsertIdpUserCall', 'getIdpUserCall'])

        TestBed.configureTestingModule({
            providers: [LoginEffects, provideMockActions(() => actions$), { provide: LoginService, useValue: loginService }],
        })

        effect = TestBed.inject(LoginEffects)
    })

    it('dispatches `accounts` for a real HTTP 200, reading `data` straight off the body - no envelope field involved', () => {
        const accountsList = [{ accountId: 1167, isDefault: true }]
        loginService.getAccountsByPersonIdCall.and.returnValue(of({ status: 200, body: { message: 'Success', data: { namedUserAccountDtos: accountsList } } }) as any)

        const results = collect(effect.getAllAccountsByPersonId)
        actions$.next(getAllAccountsAction('person-1'))

        expect(results[0].accounts).toEqual(accountsList)
        expect(results[0].noAccountsAvailable).toBe(false)
    })

    it('defaults accounts to an empty array rather than undefined when data is missing', () => {
        loginService.getAccountsByPersonIdCall.and.returnValue(of({ status: 200, body: { message: 'Success', data: {} } }) as any)

        const results = collect(effect.getAllAccountsByPersonId)
        actions$.next(getAllAccountsAction('person-1'))

        expect(results[0].accounts).toEqual([])
    })

    it('dispatches `noAccountsAvailable` for a real HTTP 204, distinct from an error', () => {
        loginService.getAccountsByPersonIdCall.and.returnValue(of({ status: 204, body: null }) as any)

        const results = collect(effect.getAllAccountsByPersonId)
        actions$.next(getAllAccountsAction('person-1'))

        expect(results[0].noAccountsAvailable).toBe(true)
    })

    it('dispatches an ApiError instead of EMPTY on a real transport failure - the regression `catchError(() => EMPTY)` used to cause', () => {
        loginService.getAccountsByPersonIdCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.getAllAccountsByPersonId)
        actions$.next(getAllAccountsAction('person-1'))

        // EMPTY dispatched nothing at all, so a failed call left the login screen's `redirecting`
        // flag stuck forever with no error shown - this is the outcome that must never recur.
        expect(results.length).toBe(1)
        expect(results[0].error.message).toBe('Server error')
    })

    it('surfaces the backend error message from a real HttpErrorResponse', () => {
        loginService.getAccountsByPersonIdCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { message: 'Bad request' } } })))

        const results = collect(effect.getAllAccountsByPersonId)
        actions$.next(getAllAccountsAction('person-1'))

        expect(results[0].error.message).toBe('Bad request')
        expect(results[0].accounts).toBeUndefined()
        expect(results[0].noAccountsAvailable).toBe(false)
    })
})

describe('LoginEffects - checkIdpUser / upsertIdpUser / getIdpUser', () => {
    let actions$: ReplaySubject<any>
    let effect: LoginEffects
    let loginService: jasmine.SpyObj<LoginService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        loginService = jasmine.createSpyObj('LoginService', ['getAccountsByPersonIdCall', 'checkIdpUserCall', 'upsertIdpUserCall', 'getIdpUserCall'])

        TestBed.configureTestingModule({
            providers: [LoginEffects, provideMockActions(() => actions$), { provide: LoginService, useValue: loginService }],
        })

        effect = TestBed.inject(LoginEffects)
    })

    it('checkIdpUser: dispatches `data` off the body on a resolved response', () => {
        loginService.checkIdpUserCall.and.returnValue(of({ status: 200, body: { data: { mapped: true } } }) as any)

        const results = collect(effect.checkIdpUser)
        actions$.next(checkIdpUserAction('opaque-1'))

        expect(results[0].data).toEqual({ mapped: true })
        expect(results[0].error).toBeUndefined()
    })

    it('checkIdpUser: dispatches an error instead of silently doing nothing on a real transport failure', () => {
        loginService.checkIdpUserCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'IDP lookup failed' } } })))

        const results = collect(effect.checkIdpUser)
        actions$.next(checkIdpUserAction('opaque-1'))

        expect(results.length).toBe(1)
        expect(results[0].error.message).toBe('IDP lookup failed')
    })

    it('upsertIdpUser: dispatches `success: true` on a resolved response', () => {
        loginService.upsertIdpUserCall.and.returnValue(of({ status: 200, body: {} }) as any)

        const results = collect(effect.upsertIdpUser)
        actions$.next(upsertIdpAction({ id: 0 }))

        expect(results[0].success).toBe(true)
        expect(results[0].error).toBeUndefined()
    })

    it('upsertIdpUser: dispatches an error instead of silently doing nothing on a real transport failure', () => {
        loginService.upsertIdpUserCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { message: 'Mapping conflict' } } })))

        const results = collect(effect.upsertIdpUser)
        actions$.next(upsertIdpAction({ id: 0 }))

        expect(results[0].success).toBe(false)
        expect(results[0].error.message).toBe('Mapping conflict')
    })

    it('getIdpUser: dispatches `data` off the body on a resolved response', () => {
        loginService.getIdpUserCall.and.returnValue(of({ status: 200, body: { data: { userId: 'user-1' } } }) as any)

        const results = collect(effect.getIdpUser)
        actions$.next(getIdpUserAction('opaque-1'))

        expect(results[0].data).toEqual({ userId: 'user-1' })
        expect(results[0].error).toBeUndefined()
    })

    it('getIdpUser: dispatches an error instead of silently doing nothing on a real transport failure', () => {
        loginService.getIdpUserCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { errors: { message: 'Not found' } } })))

        const results = collect(effect.getIdpUser)
        actions$.next(getIdpUserAction('opaque-1'))

        expect(results.length).toBe(1)
        expect(results[0].error.message).toBe('Not found')
    })
})
