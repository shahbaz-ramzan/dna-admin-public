import { Injectable } from '@angular/core'
import { Store } from '@ngrx/store'
import K from 'src/app/constants'
import { MainUsersService } from '../../main-users.service'
import { updateSortingOrderAction } from '../mainUserStore/main-users.actions'

// Fields read/written by SingleUserSelectionComponent's card-sorting-preference (financial
// behavior / work talents tab order) methods. SingleUserSelectionComponent passes itself (`this`)
// as the state argument to every method below, so all mutations here happen directly on the
// component instance's own fields. double-user-selection has no equivalent feature — this is not
// a deduplication, just an SRP split within single-user-selection.
export interface SortingPreferencesState {
    displaySortingModal: boolean
    financialBehaviorTabSorter: any[]
    workTalentsTabSorter: any[]
    accountId: string | null
    permissionObject: any
    showLegacyReports: boolean
}

@Injectable({ providedIn: 'root' })
export class SortingPreferencesService {
    constructor(
        private store: Store<any>,
        private mainUserService: MainUsersService
    ) {}

    sortDialog(state: SortingPreferencesState) {
        state.displaySortingModal = true
    }

    resetSorting(state: SortingPreferencesState, id: string) {
        if (id == 'single0') {
            state.financialBehaviorTabSorter = this.mainUserService.getFinancialBehaviorTabSorter(
                state.permissionObject,
                state.showLegacyReports,
                K.APP.INITIAL_FINANCIAL_BEHAVIOR_TAB_SORTER
            )
        }

        if (id == 'single1') {
            state.workTalentsTabSorter = this.mainUserService.getWorkTalentsTabSorter(
                state.permissionObject,
                state.showLegacyReports,
                K.APP.INITIAL_WORK_TALENT_TAB_SORTER
            )
        }
        this.updateSorting(state)
    }

    updateSorting(state: SortingPreferencesState) {
        state.displaySortingModal = false
        this.store.dispatch(
            updateSortingOrderAction({
                accountId: state.accountId,
                status: true,
                financialBehaviorCardOrder: state.financialBehaviorTabSorter,
                workTalentsCardOrder: state.workTalentsTabSorter,
            })
        )
    }
}
