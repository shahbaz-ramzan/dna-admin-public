import { TestBed } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { ConfirmationService } from 'primeng/api'
import { MsgService } from 'src/app/service/msg.service'
import { ParticipantAccountRemovalService, ParticipantAccountRemovalState } from './participant-account-removal.service'

function makeState(overrides: Partial<ParticipantAccountRemovalState> = {}): ParticipantAccountRemovalState {
    return {
        loggedInPersonId: 'me',
        accountId: 'a1',
        deleteUserLoading: false,
        userToDelete: { personID: 'p1' },
        tagUsersList: [],
        selectedPersons: [],
        usersList: [],
        selectedItems: [],
        currentPage: 1,
        route: { snapshot: { queryParams: {} } } as any,
        router: { navigate: jasmine.createSpy('navigate') } as any,
        searchParticipantsByFilters: jasmine.createSpy('searchParticipantsByFilters'),
        stepBackOnePageAndRefetch: jasmine.createSpy('stepBackOnePageAndRefetch'),
        ...overrides,
    }
}

describe('ParticipantAccountRemovalService', () => {
    let service: ParticipantAccountRemovalService
    let store: MockStore

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideMockStore({ initialState: { mainUserReducer: { usersListResponse: { userList: [] } } } }),
                { provide: MsgService, useValue: { successMessage: jasmine.createSpy(), errorMessage: jasmine.createSpy() } },
                { provide: ConfirmationService, useValue: { confirm: jasmine.createSpy() } },
            ],
        })
        service = TestBed.inject(ParticipantAccountRemovalService)
        store = TestBed.inject(MockStore)
    })

    describe('onUserDeletedFromAccount - last-row-on-page detection', () => {
        it('does not step back when the current page still has rows after the removal', () => {
            store.setState({ mainUserReducer: { usersListResponse: { userList: [{ personID: 'p2' }] } } })
            const state = makeState({ currentPage: 3 })

            service.onUserDeletedFromAccount(state)

            expect(state.stepBackOnePageAndRefetch).not.toHaveBeenCalled()
        })

        it('does not step back when the emptied page is page 1 (nothing to step back to)', () => {
            store.setState({ mainUserReducer: { usersListResponse: { userList: [] } } })
            const state = makeState({ currentPage: 1 })

            service.onUserDeletedFromAccount(state)

            expect(state.stepBackOnePageAndRefetch).not.toHaveBeenCalled()
        })

        it('steps back when the removal empties a page beyond page 1', () => {
            store.setState({ mainUserReducer: { usersListResponse: { userList: [] } } })
            const state = makeState({ currentPage: 3 })

            service.onUserDeletedFromAccount(state)

            expect(state.stepBackOnePageAndRefetch).toHaveBeenCalled()
        })

        // Regression test for the rapid-sequential-delete gap: two deletes fired back-to-back on
        // a 2-row page, each resolving independently. A click-time snapshot of state.usersList
        // would see 2 rows for BOTH deletes (neither one yet reflecting the other's removal) and
        // never trigger the step-back even though the page ends up empty. Reading the canonical,
        // already-reducer-patched store state at each resolution instead of a stale snapshot
        // means the second resolution correctly sees the page is now empty.
        it('correctly detects an emptied page on the second of two rapid sequential deletes', () => {
            const state = makeState({ currentPage: 2 })

            // First delete resolves: the reducer has already patched the store down to 1 row.
            store.setState({ mainUserReducer: { usersListResponse: { userList: [{ personID: 'p2' }] } } })
            service.onUserDeletedFromAccount(state)
            expect(state.stepBackOnePageAndRefetch).not.toHaveBeenCalled()

            // Second delete resolves: the reducer has now patched the store down to 0 rows.
            store.setState({ mainUserReducer: { usersListResponse: { userList: [] } } })
            service.onUserDeletedFromAccount(state)
            expect(state.stepBackOnePageAndRefetch).toHaveBeenCalled()
        })
    })
})
