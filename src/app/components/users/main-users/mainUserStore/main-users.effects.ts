// This file is a thin re-export shim (see USERS_PAGE_OPTIMIZATION_PLAN.md §Phase 3 item 11).
// Real effects now live in:
//   - main-users-list.effects.ts    (MainUsersListEffects)
//   - main-users-reports.effects.ts (MainUsersReportsEffects)
// Kept so any existing import of './mainUserStore/main-users.effects' continues to work.
export { MainUsersListEffects } from './main-users-list.effects'
export { MainUsersReportsEffects } from './main-users-reports.effects'
