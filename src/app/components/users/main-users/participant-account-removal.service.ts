import { Injectable } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Store } from '@ngrx/store'
import { ConfirmationService } from 'primeng/api'
import { take } from 'rxjs/operators'
import { MsgService } from 'src/app/service/msg.service'
import { saveUserToAccountAction } from './mainUserStore/main-users.actions'
import { selectMainUserState } from './mainUserStore/main-users.selectors'

// Fields read/written by MainUsersComponent's delete-participant-from-account flow.
// MainUsersComponent passes itself (`this`) as the state argument to every method below, so all
// mutations here happen directly on the component instance's own fields. `route` is passed via
// state (not injected fresh into this root-provided service) since ActivatedRoute must reflect
// the calling component's own position in the route tree, not whatever context this singleton
// service happens to be constructed in.
export interface ParticipantAccountRemovalState {
    loggedInPersonId: any
    accountId: any
    deleteUserLoading: boolean
    userToDelete: any
    tagUsersList: any[]
    selectedPersons: string[]
    usersList: any[]
    selectedItems: any[]
    currentPage: number
    route: ActivatedRoute
    router: Router
    searchParticipantsByFilters(): void
    // Steps currentPage back by one, updates the page query param, and re-fetches - used only
    // when a removal empties the current (non-first) page, since the table then has nothing to
    // show from a page that no longer exists. See onUserDeletedFromAccount below.
    stepBackOnePageAndRefetch(): void
}

// Store shape read back in onUserDeletedFromAccount to check whether a removal emptied the
// current page - see that method's comment for why this is read from the store's own
// (already-reducer-patched) state rather than from state.usersList.
interface MainUserStoreSlice {
    usersListResponse?: { userList?: any[] }
}

@Injectable({ providedIn: 'root' })
export class ParticipantAccountRemovalService {
    constructor(
        private store: Store<{ mainUserReducer: any }>,
        private msgService: MsgService,
        private confirmationService: ConfirmationService
    ) {}

    deleteUserConfirmation(state: ParticipantAccountRemovalState, event: any, user: any) {
        this.confirmationService.confirm({
            target: event.target,
            message: 'Are you sure you want to remove this user from this account? This cannot be undone.',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.deleteUserFromAccount(state, user)
            },
        })
    }

    deleteUserFromAccount(state: ParticipantAccountRemovalState, user: any) {
        if (state.loggedInPersonId != user?.personID) {
            state.userToDelete = { ...user }
            state.deleteUserLoading = true
            this.store.dispatch(
                saveUserToAccountAction({
                    id: 0,
                    status: false,
                    accountId: state.accountId,
                    personId: user.personID,
                    relationship: 'S',
                    reason: 'Removing from account',
                    isDefault: false,
                })
            )
        } else {
            this.msgService.errorMessage('You cannot remove yourself')
        }
    }

    onUserDeletedFromAccount(state: ParticipantAccountRemovalState): void {
        state.deleteUserLoading = false
        // This is only ever invoked from the saveUserToAccountActionSuccess listener
        // (main-users.component.ts) - failures are routed separately to
        // saveUserToAccountActionFailure via catchApiError and surfaced by the generic
        // notification effect, so reaching here always means the removal succeeded.

        // The removed row is already gone from the table via the store patch that runs off this
        // same success action (see main-users-list.reducer.ts's saveUserToAccountActionSuccess
        // case) - no re-fetch needed for the normal case. The one exception: if that was the
        // last row on a page beyond page 1, the page now has nothing to show, so step back to the
        // previous page and fetch that instead (a real UX necessity, not a cache workaround).
        //
        // Read directly from the store (via take(1), which for NgRx's Store always emits the
        // CURRENT value synchronously to a fresh subscriber) rather than from state.usersList:
        // the reducer's patch to usersListResponse has already run by the time this method is
        // called (reducers apply synchronously inside dispatch(), before any subscriber - store
        // selector or Actions listener - is notified), so this is always the authoritative
        // post-patch count. state.usersList, by contrast, is synced via the component's own
        // separate store subscription and its update relative to this callback isn't guaranteed
        // - and worse, on a rapid second delete fired before the first one's round-trip
        // completes, a click-time snapshot of state.usersList.length would already be stale.
        // Reading the canonical store state fresh, every time, avoids both problems.
        this.store.select(selectMainUserState).pipe(take(1)).subscribe((mainUserState: MainUserStoreSlice) => {
            const remainingRows = mainUserState?.usersListResponse?.userList?.length ?? 0
            if (remainingRows === 0 && state.currentPage > 1) {
                state.stepBackOnePageAndRefetch()
            }
        })

        this.msgService.successMessage('Participant removed successfully')

        const res = state.route.snapshot.queryParams
        if (!res?.selectedParticipants) return

        const participants = res?.selectedParticipants?.split(',')

        let accountId
        let remainingParticipant
        if (participants.length >= 2) {
            remainingParticipant = participants.filter((v: any) => v != state.userToDelete?.personID)
        }
        if (participants.length == 1) {
            accountId = state.accountId
        }

        // Filtering records to remove deleted participant
        state.tagUsersList = state.tagUsersList?.filter((t: any) => t.personID != state.userToDelete.personID)
        state.selectedPersons = state.selectedPersons.filter((p: string) => p != state.userToDelete.personID)
        state.usersList = state.usersList.filter((u: any) => u.personID != state.userToDelete.personID)
        state.selectedItems = state.selectedItems.filter((s: any) => s.personID != state.userToDelete.personID)

        // Updating routing params
        const queryParams = { ...res, selectedParticipants: remainingParticipant?.join(','), accountId }
        state.router.navigate([], {
            queryParams,
            relativeTo: state.route,
        })
    }
}
