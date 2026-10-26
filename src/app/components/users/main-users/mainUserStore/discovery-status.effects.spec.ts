import { HttpErrorResponse } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { Observable, ReplaySubject, of, throwError } from 'rxjs'
import { MainUsersService } from '../../main-users.service'
import { DiscoveryStatusEffects } from './discovery-status.effects'
import { discoveryStatusResolvedAction, getUniqueStyleAction, getUniqueStyleActionFailure, getUniqueStyleActionSuccess } from './main-users-list.actions'
import { selectDiscoveryCompletedPersonIds } from './main-users.selectors'

describe('DiscoveryStatusEffects', () => {
    let actions$: ReplaySubject<any>
    let effects: DiscoveryStatusEffects
    let store: MockStore
    let mainUsersService: jasmine.SpyObj<MainUsersService>

    function collect(source$: Observable<any>): any[] {
        const results: any[] = []
        source$.subscribe((action) => results.push(action))
        return results
    }

    beforeEach(() => {
        actions$ = new ReplaySubject(1)
        mainUsersService = jasmine.createSpyObj('MainUsersService', ['getUniqueStyleCall'])

        TestBed.configureTestingModule({
            providers: [
                DiscoveryStatusEffects,
                provideMockActions(() => actions$),
                provideMockStore({ selectors: [{ selector: selectDiscoveryCompletedPersonIds, value: { known: true } }] }),
                { provide: MainUsersService, useValue: mainUsersService },
            ],
        })

        effects = TestBed.inject(DiscoveryStatusEffects)
        store = TestBed.inject(MockStore)
    })

    afterEach(() => store.resetSelectors())

    it('resolves a participant already known to be complete without calling the API', () => {
        actions$.next(getUniqueStyleAction({ personId: 'known' }))

        expect(collect(effects.getUniqueStyle)).toEqual([discoveryStatusResolvedAction('known', true)])
        expect(mainUsersService.getUniqueStyleCall).not.toHaveBeenCalled()
    })

    it('calls the API once for an unknown participant and dispatches the success action', () => {
        const response = { body: { data: { uniqueStyle: 'Strategist' } } }
        mainUsersService.getUniqueStyleCall.and.returnValue(of(response) as any)
        actions$.next(getUniqueStyleAction({ personId: 'unknown' }))

        expect(collect(effects.getUniqueStyle)).toEqual([getUniqueStyleActionSuccess(response, 'unknown')])
        expect(mainUsersService.getUniqueStyleCall).toHaveBeenCalledOnceWith({ personId: 'unknown' })
    })

    it('dispatches the failure action (with the personId) when the API call fails', () => {
        mainUsersService.getUniqueStyleCall.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })))
        actions$.next(getUniqueStyleAction({ personId: 'unknown' }))

        const [action] = collect(effects.getUniqueStyle)
        expect(action.type).toBe(getUniqueStyleActionFailure.type)
        expect(action.personId).toBe('unknown')
    })

    it('resolves completed when the response has a unique style', () => {
        actions$.next(getUniqueStyleActionSuccess({ body: { data: { uniqueStyle: 'Adapter' } } }, 'p1'))

        expect(collect(effects.resolveFromResponse)).toEqual([discoveryStatusResolvedAction('p1', true)])
    })

    it('resolves incomplete when the unique style is null', () => {
        actions$.next(getUniqueStyleActionSuccess({ body: { message: 'Success', data: { uniqueStyle: null } } }, 'p1'))

        expect(collect(effects.resolveFromResponse)).toEqual([discoveryStatusResolvedAction('p1', false)])
    })

    it('fails open: a failed check resolves as completed', () => {
        actions$.next(getUniqueStyleActionFailure({ status: 500, message: 'Server error' } as any, 'p1'))

        expect(collect(effects.resolveFromFailure)).toEqual([discoveryStatusResolvedAction('p1', true)])
    })
})
