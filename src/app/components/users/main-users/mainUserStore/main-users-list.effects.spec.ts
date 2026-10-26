import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { Observable, ReplaySubject, of, throwError } from 'rxjs'
import { MainUsersService } from '../../main-users.service'
import { UsersCacheStorageService } from 'src/app/service/users-cache-storage.service'
import {
    UpdateColorAction,
    exportUsersListAction,
    GetTagsAction,
    getFacilitatorAction,
    editParticipantProfileAction,
    editParticipantProfilePictureAction,
    editParticipantTagsAction,
    editParticipantFacilitatorAction,
    searchMultipleAccountsAction,
    getSelftRegistrationIdAction,
    getSelfRegistrationDetailAction,
    getCreditIdAction,
    getDiscoveryStatusAction,
    saveUserToAccountAction,
} from './main-users-list.actions'
import { MainUsersListEffects } from './main-users-list.effects'

/**
 * First effect-layer coverage for this file - see docs/USERS_TABLE_ERROR_HANDLING_PLAN.md.
 * `UpdateColorAction` and `UpdateColorSuccessAction` used to share one action type, so
 * `updateColor`'s "success" path fired synchronously on dispatch rather than on a real resolved
 * response (Phase 1). These tests cover the fixed effect: real success dispatches both
 * `UpdateColorSuccessAction` and the account-color refetch, in that order, and a real transport
 * failure dispatches a normalized `ApiError` via `UpdateColorActionFailure` instead of the previous
 * `catchError(() => EMPTY)`.
 */
describe('MainUsersListEffects.updateColor', () => {
    let actions$: ReplaySubject<any>
    let effect: MainUsersListEffects
    let mainUsersService: jasmine.SpyObj<MainUsersService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        mainUsersService = jasmine.createSpyObj('MainUsersService', ['getUpdateColorCall'])
        const usersCache = jasmine.createSpyObj('UsersCacheStorageService', ['purgeAll', 'get', 'setIfChanged', 'removeUserFromAllCachedPages'])

        TestBed.configureTestingModule({
            providers: [
                MainUsersListEffects,
                provideMockActions(() => actions$),
                { provide: MainUsersService, useValue: mainUsersService },
                { provide: UsersCacheStorageService, useValue: usersCache },
            ],
        })

        effect = TestBed.inject(MainUsersListEffects)
    })

    it('dispatches UpdateColorSuccessAction with the real response, then the account-color refetch, on a genuine success', () => {
        const response = { body: { data: { primaryColor: '#123456' } } }
        mainUsersService.getUpdateColorCall.and.returnValue(of(response) as any)

        const results = collect(effect.updateColor)
        actions$.next(UpdateColorAction({ accountId: 'acc-1', primaryColor: '#123456', secondaryColor: '#654321' }))

        expect(results.length).toBe(2)
        expect(results[0].type).toBe('successUpdateColorAction')
        expect(results[0].accountColorPayload).toEqual(response)
        expect(results[1].type).toBe('getAccountColorAction')
    })

    it('dispatches the real UPDATE_COLOR_ACTION_FAILURE action with a normalized ApiError on a real transport failure, instead of dispatching nothing at all', () => {
        mainUsersService.getUpdateColorCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { errors: { message: 'Server error' } } })))

        const results = collect(effect.updateColor)
        actions$.next(UpdateColorAction({ accountId: 'acc-1', primaryColor: '#123456', secondaryColor: '#654321' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('updateColorActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })
})

/**
 * Phase 3 (docs/USERS_TABLE_ERROR_HANDLING_PLAN.md): the remaining 13 effects each moved from either
 * `catchError(() => EMPTY)` (dispatched nothing at all on a real failure) or
 * `catchError(() => of({ type: ... }))` (hand-typed, no error attached) to `catchApiError` + a real
 * failure creator. One test per effect confirms the failure action now carries a normalized
 * `ApiError` instead of either alternative. `getDigitalScanAccessData` is deliberately excluded -
 * client-confirmed as an untouched flow, not part of this phase.
 */
describe('MainUsersListEffects - Phase 3 catchApiError conversions', () => {
    let actions$: ReplaySubject<any>
    let effect: MainUsersListEffects
    let mainUsersService: jasmine.SpyObj<MainUsersService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    const httpError = (message: string) => new HttpErrorResponse({ status: 500, error: { errors: { message } } })

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        mainUsersService = jasmine.createSpyObj('MainUsersService', [
            'exportUsersListCall',
            'getTagsCall',
            'getFacilitators',
            'editParticipantProfile',
            'editParticipantProfilePicture',
            'editParticipantTags',
            'editParticipantFacilitator',
            'searchMultipleAccountsCall',
            'getSelfRegistrationId',
            'getSelfRegistrationDetail',
            'getCreditIdCall',
            'getDiscoveryStatusCall',
            'saveUserToAccountCall',
            'clearParticipantsDetailCache',
        ])
        const usersCache = jasmine.createSpyObj('UsersCacheStorageService', ['purgeAll', 'get', 'setIfChanged', 'removeUserFromAllCachedPages'])

        TestBed.configureTestingModule({
            providers: [
                MainUsersListEffects,
                provideMockActions(() => actions$),
                { provide: MainUsersService, useValue: mainUsersService },
                { provide: UsersCacheStorageService, useValue: usersCache },
            ],
        })

        effect = TestBed.inject(MainUsersListEffects)
    })

    it('exportUsersList: dispatches exportUsersListActionFailure with a normalized ApiError on a real transport failure', () => {
        mainUsersService.exportUsersListCall.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.exportUsersList)
        actions$.next(exportUsersListAction({ accountId: 'acc-1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('exportUsersListActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })

    it('getTags: dispatches GetTagsActionFailure with a normalized ApiError on a real transport failure', () => {
        mainUsersService.getTagsCall.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.getTags)
        actions$.next(GetTagsAction({ accountId: 'acc-1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getTagsActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })

    it('getFacilitators: dispatches a real ApiError instead of nothing at all - was catchError(() => EMPTY)', () => {
        mainUsersService.getFacilitators.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.getFacilitators)
        actions$.next(getFacilitatorAction('acc-1'))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getFacilitatorsActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })

    it('editParticipantProfile: dispatches editParticipantProfileFailureAction with a normalized ApiError', () => {
        mainUsersService.editParticipantProfile.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.editParticipantProfile)
        actions$.next(editParticipantProfileAction({ personId: 'p1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('editParticipantProfileFailureAction')
        expect(results[0].error.message).toBe('Server error')
    })

    it('editParticipantProfilePicture: dispatches editParticipantProfilePictureFailureAction with a normalized ApiError', () => {
        mainUsersService.editParticipantProfilePicture.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.editParticipantProfilePicture)
        actions$.next(editParticipantProfilePictureAction({ personId: 'p1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('editParticipantProfilePictureFailureAction')
        expect(results[0].error.message).toBe('Server error')
    })

    it('editParticipantTags: dispatches editParticipantTagsFailureAction with a normalized ApiError', () => {
        mainUsersService.editParticipantTags.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.editParticipantTags)
        actions$.next(editParticipantTagsAction({ personId: 'p1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('editParticipantTagFailureAction')
        expect(results[0].error.message).toBe('Server error')
    })

    it('editParticipantFacilitator: dispatches editParticipantFacilitatorFailureAction with a normalized ApiError', () => {
        mainUsersService.editParticipantFacilitator.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.editParticipantFacilitator)
        actions$.next(editParticipantFacilitatorAction({ personId: 'p1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('editParticipantFacilitatorFailureAction')
        expect(results[0].error.message).toBe('Server error')
    })

    it('searchMultipleAccounts: dispatches searchMultipleAccountsActionFailure with a normalized ApiError', () => {
        mainUsersService.searchMultipleAccountsCall.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.searchMultipleAccounts)
        actions$.next(searchMultipleAccountsAction({ query: 'x' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('searchMultipleAccountsActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })

    it('getSelfRegistrationId: dispatches a real ApiError instead of nothing at all - was catchError(() => EMPTY)', () => {
        mainUsersService.getSelfRegistrationId.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.getSelfRegistrationId)
        actions$.next(getSelftRegistrationIdAction('person-1'))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getSelfRegistrationIdActionFailure')
        expect(results[0].error.message).toBe('Server error')
        expect(results[0].notify).toBe(false)
    })

    it('getSelfRegistrationDetail: dispatches a real ApiError instead of nothing at all - was catchError(() => EMPTY)', () => {
        mainUsersService.getSelfRegistrationDetail.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.getSelfRegistrationDetail)
        actions$.next(getSelfRegistrationDetailAction({ linkId: 'l1', accountId: 'a1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getSelfRegistrationDetailActionFailure')
        expect(results[0].error.message).toBe('Server error')
        expect(results[0].notify).toBe(false)
    })

    it('getCreditId: dispatches getCreditIdActionFailure with a normalized ApiError', () => {
        mainUsersService.getCreditIdCall.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.getCreditId)
        actions$.next(getCreditIdAction({ personId: 'p1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getCreditIdActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })

    it('getDiscoveryStatus: dispatches a real ApiError instead of nothing at all - was catchError(() => EMPTY)', () => {
        mainUsersService.getDiscoveryStatusCall.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.getDiscoveryStatus)
        actions$.next(getDiscoveryStatusAction({ creditId: 'c1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('getDiscoveredStatusActionFailure')
        expect(results[0].error.message).toBe('Server error')
        expect(results[0].notify).toBe(false)
    })

    it('saveUserToAccount: dispatches saveUserToAccountActionFailure with a normalized ApiError', () => {
        mainUsersService.saveUserToAccountCall.and.returnValue(throwError(() => httpError('Server error')))

        const results = collect(effect.saveUserToAccount)
        actions$.next(saveUserToAccountAction({ status: false, accountId: 'a1', personId: 'p1' }))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('saveUserToAccountActionFailure')
        expect(results[0].error.message).toBe('Server error')
    })
})
