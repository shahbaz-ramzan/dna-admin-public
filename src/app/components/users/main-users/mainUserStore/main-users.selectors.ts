import { createFeatureSelector, createSelector } from '@ngrx/store'

// Pilot for the app-wide "no memoized selectors" gap (see APPLICATION_ROADMAP.md Epic 1).
// mainUserStore is the pilot target because it's already split into purpose-scoped reducers
// (main-users-list, main-users-reports, main-users) rather than one god-reducer like settings.
//
// Kept `any`-typed here to match how every current consumer already injects
// `Store<{ mainUserReducer: any }>` / `Store<any>` - introducing real typing for this state shape
// is a separate, larger effort (Epic 6) and out of scope for this pass.
//
// Only two fields are exposed as derived, memoized selectors: isUserDetailLoading and
// darkModeSwitch, used by consumers that read exactly one field each from the combined slice
// (three-user-selection.component.ts, customize-theme-modal.component.ts) - a memoized derived
// selector gives a real reduction in how often they re-evaluate (only on that field changing, not
// on every action touching any of the ~50 other fields in this slice).
//
// Every other former `.select((state) => state.mainUserReducer)` call site across the app has
// been swapped to `.select(selectMainUserState)` - same behavior (still the whole `any`-typed
// slice, no per-field memoization benefit), just centralizing the `'mainUserReducer'` string key
// in one place. Decomposing those many-fields-at-once consumers (main-users.component.ts, and the
// larger single-user-selection/double-user-selection components) into real per-field memoized
// selectors is separate, larger follow-up work - it would change emission/change-detection timing
// and wasn't attempted here.
export const selectMainUserState = createFeatureSelector<any>('mainUserReducer')

export const selectIsUserDetailLoading = createSelector(selectMainUserState, (state) => state?.isUserDetailLoading)

export const selectDarkModeSwitch = createSelector(selectMainUserState, (state) => state?.darkModeSwitch)

// Added per USERS_TABLE_ERROR_HANDLING_PLAN.md Phase 5 - store-only plumbing, purely additive.
// Nothing consumes these yet (main-users.component.ts still hand-copies the whole slice); they're
// groundwork for a future UI-approved slice that wires up inline error/retry UI for the users
// table, not a behavior change on their own.
export const selectUsersList = createSelector(selectMainUserState, (state) => state?.usersListResponse)

export const selectGetUsersListLoading = createSelector(selectMainUserState, (state) => state?.getUsersListLoading)

export const selectUsersListError = createSelector(selectMainUserState, (state) => state?.usersListError)

// personId -> true for participants known to have completed DNA Discovery - see
// discoveryCompletedPersonIds in main-users-list.reducer.ts.
export const selectDiscoveryCompletedPersonIds = createSelector(selectMainUserState, (state) => state?.discoveryCompletedPersonIds ?? {})
