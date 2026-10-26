import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { Observable, ReplaySubject, TimeoutError, of, throwError } from 'rxjs'
import { SettingsService } from '../settings.service'
import { SettingsCacheStorageService } from 'src/app/service/settings-cache-storage.service'
import { UsersCacheStorageService } from 'src/app/service/users-cache-storage.service'
import { deleteTagAction, upsertTagAction } from './settings.actions'
import { GET_SUBSCRIPTION_ACCOUNT_ACTION } from './settings-actions-constants'
import { SettingsEffects } from './settings.effects'

/**
 * Coverage for D0 (SETTINGS_PAGE_STATUSCODE_MIGRATION_PLAN.md): every `catchError` in this file was
 * converted to `catchApiError`, including the 5 that used to swallow failures into `EMPTY`. This
 * file did not exist before that change landed - these tests are the first effect-layer coverage
 * `settings.effects.ts` has ever had. Mirrors the three shapes `login.effects.spec.ts` already
 * covers: a real failure dispatching the typed action instead of a hand-typed literal, a former
 * `EMPTY` effect now dispatching instead of swallowing, and a timeout surfacing as an `ApiError`.
 */
describe('SettingsEffects - upsertTagData (former catchError((error) => of({ type: ..., error })))', () => {
    let actions$: ReplaySubject<any>
    let effect: SettingsEffects
    let settingsService: jasmine.SpyObj<SettingsService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        settingsService = jasmine.createSpyObj('SettingsService', ['upsertTagCall'])
        const settingsCache = jasmine.createSpyObj('SettingsCacheStorageService', ['purgeScopes', 'clearForCurrentUser'])
        const usersCache = jasmine.createSpyObj('UsersCacheStorageService', ['purgeAll'])

        TestBed.configureTestingModule({
            providers: [
                SettingsEffects,
                provideMockActions(() => actions$),
                { provide: SettingsService, useValue: settingsService },
                { provide: SettingsCacheStorageService, useValue: settingsCache },
                { provide: UsersCacheStorageService, useValue: usersCache },
            ],
        })

        effect = TestBed.inject(SettingsEffects)
    })

    it('dispatches the real response on a resolved call', () => {
        const response = { body: { message: 'Success', data: 'Tag saved' } }
        settingsService.upsertTagCall.and.returnValue(of(response) as any)

        const results = collect(effect.upserTagData)
        actions$.next(upsertTagAction({ accountId: 'acc-1' }))

        expect(results[0].type).toBe('upsertTagActionSuccess')
        expect(results[0].response).toEqual(response)
    })

    it('dispatches the real UPSERT_TAG_ACTION_FAILURE action with a normalized ApiError, instead of a hand-typed literal carrying the raw error', () => {
        settingsService.upsertTagCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { message: 'Duplicate tag' } } })))

        const results = collect(effect.upserTagData)
        actions$.next(upsertTagAction({ accountId: 'acc-1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('upsertTagActionFailure')
        expect(results[0].error.message).toBe('Duplicate tag')
        expect(results[0].error.status).toBe(400)
    })
})

describe('SettingsEffects - subscriptionAccountData (former catchError(() => EMPTY))', () => {
    let actions$: ReplaySubject<any>
    let effect: SettingsEffects
    let settingsService: jasmine.SpyObj<SettingsService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        settingsService = jasmine.createSpyObj('SettingsService', ['getSubscriptionAccountCall'])
        const settingsCache = jasmine.createSpyObj('SettingsCacheStorageService', ['purgeScopes', 'clearForCurrentUser'])
        const usersCache = jasmine.createSpyObj('UsersCacheStorageService', ['purgeAll'])

        TestBed.configureTestingModule({
            providers: [
                SettingsEffects,
                provideMockActions(() => actions$),
                { provide: SettingsService, useValue: settingsService },
                { provide: SettingsCacheStorageService, useValue: settingsCache },
                { provide: UsersCacheStorageService, useValue: usersCache },
            ],
        })

        effect = TestBed.inject(SettingsEffects)
    })

    it('dispatches the success action carrying the resolved response on a genuine success', () => {
        const response = { body: { data: [{ subscriptionId: 'sub-1' }] } }
        settingsService.getSubscriptionAccountCall.and.returnValue(of(response) as any)

        const results = collect(effect.subscriptionAccountData)
        actions$.next({ type: GET_SUBSCRIPTION_ACCOUNT_ACTION, accountId: 'acc-1' })

        expect(results[0].type).toBe('getSubscriptionUrlDetailsAction')
        expect(results[0].subscriptionId).toBe('sub-1')
    })

    it('dispatches an ApiError on a real transport failure instead of dispatching nothing at all - the regression `catchError(() => EMPTY)` used to cause', () => {
        settingsService.getSubscriptionAccountCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.subscriptionAccountData)
        actions$.next({ type: GET_SUBSCRIPTION_ACCOUNT_ACTION, accountId: 'acc-1' })

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('successSubscriptionAccountAction')
        expect(results[0].subscriptionAccountPayload).toBeUndefined()
        expect(results[0].error.message).toBe('Server error')
    })

    it('normalizes a request timeout into the same ApiError shape, rather than an unhandled TimeoutError', () => {
        settingsService.getSubscriptionAccountCall.and.returnValue(throwError(() => new TimeoutError()))

        const results = collect(effect.subscriptionAccountData)
        actions$.next({ type: GET_SUBSCRIPTION_ACCOUNT_ACTION, accountId: 'acc-1' })

        expect(results.length).toBe(1)
        expect(results[0].error.status).toBe(0)
        expect(typeof results[0].error.message).toBe('string')
    })
})

describe('SettingsEffects - deleteTagData (former catchError((error) => of({ type: ..., error })))', () => {
    let actions$: ReplaySubject<any>
    let effect: SettingsEffects
    let settingsService: jasmine.SpyObj<SettingsService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        settingsService = jasmine.createSpyObj('SettingsService', ['deleteTagCall'])
        const settingsCache = jasmine.createSpyObj('SettingsCacheStorageService', ['purgeScopes', 'clearForCurrentUser'])
        const usersCache = jasmine.createSpyObj('UsersCacheStorageService', ['purgeAll'])

        TestBed.configureTestingModule({
            providers: [
                SettingsEffects,
                provideMockActions(() => actions$),
                { provide: SettingsService, useValue: settingsService },
                { provide: SettingsCacheStorageService, useValue: settingsCache },
                { provide: UsersCacheStorageService, useValue: usersCache },
            ],
        })

        effect = TestBed.inject(SettingsEffects)
    })

    it('dispatches the real FAILURE_DELETE_TAG_ACTION action with a normalized ApiError on a real transport failure', () => {
        settingsService.deleteTagCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { errors: { message: 'Tag not found' } } })))

        const results = collect(effect.deleteTagData)
        actions$.next(deleteTagAction(42))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('failureDeleteTagAction')
        expect(results[0].error.message).toBe('Tag not found')
    })
})
