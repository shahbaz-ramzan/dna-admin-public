// This file is a thin composition shim (see USERS_PAGE_OPTIMIZATION_PLAN.md §Phase 3 item 11).
// Real reducer logic now lives in:
//   - main-users-list.reducer.ts    (Users-list slice)
//   - main-users-reports.reducer.ts (Reports slice)
// Both slices share the same `State` interface/shape - kept together here so
// `state.mainUserReducer` resolves at the exact same top-level path as before.
import { Action } from '@ngrx/store'
import { listReducer, initialState, State } from './main-users-list.reducer'
import { reportsReducer } from './main-users-reports.reducer'

export { initialState, State }

export function mainUserReducer(state: State | undefined, action: Action): State {
    return reportsReducer(listReducer(state, action), action)
}
