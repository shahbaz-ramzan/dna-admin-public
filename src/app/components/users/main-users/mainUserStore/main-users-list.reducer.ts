import { createReducer, on } from '@ngrx/store'
import { ApiError } from 'src/app/service/api-error'
import {
    dontSetParticipantFaciliatorAction,
    dontUpdateParticipantProfilePictureAction,
    editParticipantFacilitatorAction,
    editParticipantFacilitatorFailureAction,
    editParticipantFacilitatorSuccessAction,
    editParticipantProfileAction,
    editParticipantProfileFailureAction,
    editParticipantProfilePictureAction,
    editParticipantProfilePictureFailureAction,
    editParticipantProfilePictureSuccessAction,
    editParticipantProfileSuccessAction,
    editParticipantTagsAction,
    editParticipantTagsFailureAction,
    editParticipantTagsSuccessAction,
    exportUsersListAction,
    exportUsersListActionFailure,
    exportUsersListActionSuccess,
    getCreditIdAction,
    getCreditIdActionFailure,
    getCreditIdActionSuccess,
    getDarkModeStatus,
    getFaciliatorSuccessAction,
    getFacilitatorAction,
    getFacilitatorActionFailure,
    GetTagsAction,
    GetTagsActionFailure,
    GetTagsActionSuccess,
    GetUsersListAction,
    GetUsersListActionFailure,
    GetUsersListActionSuccess,
    ResetUsersListAction,
    saveUserToAccountAction,
    saveUserToAccountActionFailure,
    saveUserToAccountActionSuccess,
    searchMultipleAccountsAction,
    searchMultipleAccountsActionFailure,
    searchMultipleAccountsActionSuccess,
    getUniqueStyleActionSuccess,
    UpdateColorAction,
    UpdateColorActionFailure,
    UpdateColorSuccessAction,
    updateTagsAction,
} from './main-users.actions'
import { getUniqueStyleFromResponse } from '../discovery-status.util'

// State interface is intentionally shared between the Users-list and Reports slices
// (see main-users.reducer.ts composition) - do not split it.
export interface State {
    riskBehaviorPayload: any
    FDNAScorePayload: any
    FDNAScorePayload2: any
    searchListLoading: boolean
    financialStyleMatchPayload: any
    workStyleMatchPayload: any
    tScorePaylaod: any
    tScorePaylaod2: any
    oldReportsLoading: boolean
    oldReportsPayload: any
    oldReportsLoading2: boolean
    oldReportsPayload2: any
    behaviralBiasesPayload: any
    behaviralBiasesPayload2: any
    communicationInsightsLoading: boolean
    communicationInsightsLoading2: boolean
    workPlaceInsightPayload: any
    workTalentsPayload: any
    careersInsightsPayload: any
    careersInsightsPayload2: any
    workPlaceInsightPayload2: any
    getAccountColorLoading: boolean
    environmentKeysPayload: any
    tagsResponse: any
    communicationInsightPayload: any
    communicationInsightPayload2: any
    isUserDetailLoading: boolean
    digitalScanLoading: boolean
    userProfileUpdateStatus: number
    facilitators: any[]
    usersListResponse: any
    searchListResponse: any
    // Identity of the participant each "slot" (base = person 1, *2 = person 2) is currently
    // showing data for. Every slot-paired insights widget's SUCCESS reducer checks the
    // response's personId against these before applying it, so a late-arriving response for a
    // participant that has since been deselected/replaced in that slot cannot overwrite the
    // correct participant's data - see main-users-reports.reducer.ts.
    activePersonId1: any
    activePersonId2: any
    // Previously only present via the index signature below (untyped) - declared explicitly per
    // USERS_TABLE_ERROR_HANDLING_PLAN.md Phase 4 item 4.
    exportUsersListLoading: boolean
    getTagsLoading: boolean
    getCreditIdLoading: boolean
    deleteUserLoading: boolean
    // Error fields added per Phase 4 - one per call, following dashboard.reducer.ts's
    // `<thing>Error` naming (no `get` prefix). Cleared on the corresponding trigger and success
    // actions, set on failure, so a stale error never outlives a subsequent successful retry.
    usersListError: ApiError | undefined
    exportUsersListError: ApiError | undefined
    tagsError: ApiError | undefined
    searchListError: ApiError | undefined
    creditIdError: ApiError | undefined
    deleteUserError: ApiError | undefined
    facilitatorsError: ApiError | undefined
    accountColorError: ApiError | undefined
    editProfileError: ApiError | undefined
    editProfilePictureError: ApiError | undefined
    editTagsError: ApiError | undefined
    editFacilitatorError: ApiError | undefined
    // personIds known to have completed DNA Discovery, collected from data already loaded (users list
    // rows' uniqueStyle, GetUniqueStyle responses). Lets DiscoveryStatusEffects skip the
    // GetUniqueStyle call for anyone reached by clicking through the app. Only "completed" is ever
    // recorded - completion is one-way, while an incomplete participant may finish at any moment
    // and must always be re-checked. In-memory only, so a refresh or new tab starts empty.
    discoveryCompletedPersonIds: Record<string, true>
    [key: string]: any
}

export const initialState: State = {
    activePersonId1: undefined,
    activePersonId2: undefined,
    riskBehaviorPayload: undefined,
    FDNAScorePayload: undefined,
    FDNAScorePayload2: undefined,
    searchListLoading: false,
    financialStyleMatchPayload: undefined,
    workStyleMatchPayload: undefined,
    tScorePaylaod: undefined,
    tScorePaylaod2: undefined,
    oldReportsLoading: false,
    oldReportsPayload: undefined,
    oldReportsLoading2: false,
    oldReportsPayload2: undefined,
    behaviralBiasesPayload: undefined,
    behaviralBiasesPayload2: undefined,
    communicationInsightsLoading: false,
    communicationInsightsLoading2: false,
    workPlaceInsightPayload: undefined,
    workTalentsPayload: undefined,
    careersInsightsPayload: undefined,
    careersInsightsPayload2: undefined,
    workPlaceInsightPayload2: undefined,
    getAccountColorLoading: false,
    environmentKeysPayload: undefined,
    tagsResponse: undefined,
    communicationInsightPayload: undefined,
    communicationInsightPayload2: undefined,
    isUserDetailLoading: false,
    digitalScanLoading: false,
    getUsersListLoading: true,
    userProfileUpdateStatus: 0,
    facilitators: [],
    usersListResponse: {},
    searchListResponse: {},
    exportUsersListLoading: false,
    getTagsLoading: false,
    getCreditIdLoading: false,
    deleteUserLoading: false,
    usersListError: undefined,
    exportUsersListError: undefined,
    tagsError: undefined,
    searchListError: undefined,
    creditIdError: undefined,
    deleteUserError: undefined,
    facilitatorsError: undefined,
    accountColorError: undefined,
    editProfileError: undefined,
    editProfilePictureError: undefined,
    editTagsError: undefined,
    editFacilitatorError: undefined,
    discoveryCompletedPersonIds: {},
}

// Merges into (never replaces) the known-complete set - a participant selected from page 1 stays
// known while browsing page 3. Returns the same reference when nothing new was added.
function withDiscoveryCompleted(state: State, personIds: string[]): Record<string, true> {
    const current = state.discoveryCompletedPersonIds ?? {}
    const added = personIds.filter((personId) => personId && !current[personId])
    if (!added.length) return current
    return added.reduce((acc, personId) => ({ ...acc, [personId]: true as const }), { ...current })
}

// Users-list / search rows carry uniqueStyle - the same field that enables a row's checkbox.
function completedRowIds(response: any): string[] {
    const rows = response?.body?.data?.userList
    return Array.isArray(rows) ? rows.filter((row: any) => row?.uniqueStyle).map((row: any) => row.personID) : []
}

export const listReducer = createReducer(
    initialState,
    on(GetUsersListAction, (state) => ({
        ...state,
        getUsersListLoading: true,
        userProfileUpdateStatus: 0,
        usersListError: undefined,
        // Keep the previous usersListResponse in place while the new request is in flight —
        // the table stays showing existing rows (with the loading spinner overlaid) instead
        // of flashing blank until the new response arrives.
    })),

    on(GetUsersListActionSuccess, (state, { usersListResponse }) => ({
        ...state,
        getUsersListLoading: false,
        // A 204 (search genuinely found zero participants) has a null body, so
        // `usersListResponse?.body?.data` is undefined - falling back to an empty-shaped object
        // (instead of leaving it undefined) matters because main-users.component.ts's subscriber
        // only updates the table when `store.usersListResponse` is truthy. Without this fallback
        // a real "no results" response was silently ignored and the table kept showing whatever
        // the previous search had rendered.
        usersListResponse: usersListResponse?.body?.data ?? { userList: [], noOfPage: 0 },
        usersListError: undefined,
        discoveryCompletedPersonIds: withDiscoveryCompleted(state, completedRowIds(usersListResponse)),
    })),

    on(GetUsersListActionFailure, (state, { error }) => ({
        ...state,
        getUsersListLoading: false,
        usersListError: error,
    })),

    // See ResetUsersListAction's own comment: only dispatched on a fresh MainUsersComponent
    // mount (route switch between /users and /myTeam), not on same-page refreshes.
    on(ResetUsersListAction, (state) => ({
        ...state,
        usersListResponse: [],
    })),

    on(exportUsersListAction, (state) => ({
        ...state,
        exportUsersListLoading: true,
        exportedUsersListResponse: [],
        exportUsersListError: undefined,
    })),

    on(exportUsersListActionSuccess, (state, { exportedUsersListResponse }) => ({
        ...state,
        exportUsersListLoading: false,
        exportedUsersListResponse: exportedUsersListResponse?.body?.data,
        exportUsersListError: undefined,
    })),

    on(exportUsersListActionFailure, (state, { error }) => ({
        ...state,
        exportUsersListLoading: false,
        exportUsersListError: error,
    })),

    on(GetTagsAction, (state) => ({
        ...state,
        getTagsLoading: true,
        tagsError: undefined,
    })),
    on(GetTagsActionSuccess, (state, { tagsResponse }) => ({
        ...state,
        getTagsLoading: false,
        tagsResponse: tagsResponse?.body?.data,
        tagsError: undefined,
    })),

    on(GetTagsActionFailure, (state, { error }) => ({
        ...state,
        getTagsLoading: false,
        tagsError: error,
    })),

    on(updateTagsAction, (state, { tagsResponse }) => ({
        ...state,
        tagsResponse: tagsResponse,
    })),
    on(getFacilitatorAction, (state) => ({
        ...state,
        isUserDetailLoading: true,
        facilitatorsError: undefined,
    })),
    on(getFaciliatorSuccessAction, (state, { response }) => ({
        ...state,
        facilitators: response?.body?.data,
        isUserDetailLoading: false,
        facilitatorsError: undefined,
    })),
    // Previously missing entirely - a real failure left isUserDetailLoading stuck true forever
    // (see USERS_TABLE_ERROR_HANDLING_PLAN.md Phase 4 item 3).
    on(getFacilitatorActionFailure, (state, { error }) => ({
        ...state,
        isUserDetailLoading: false,
        facilitatorsError: error,
    })),
    on(editParticipantProfileAction, (state) => ({
        ...state,
        editProfileError: undefined,
    })),
    // Counter moved here from the trigger action above: incrementing on dispatch let the
    // refetch (triggered once the counter hits 4) fire before this specific edit's own network
    // call had resolved, so the refetched participant could still carry the old name - see
    // single-user-selection.component.ts's handling of userProfileUpdateStatus === 4. Matches
    // the success/failure-increment pattern already used by every other edit action below.
    on(editParticipantProfileSuccessAction, (state) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editProfileError: undefined,
    })),
    on(editParticipantProfileFailureAction, (state, { error }) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editProfileError: error,
    })),
    on(editParticipantProfilePictureAction, (state) => ({
        ...state,
        editProfilePictureError: undefined,
    })),
    on(editParticipantProfilePictureSuccessAction, (state) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editProfilePictureError: undefined,
    })),
    // Failure still advances the counter (like the "dont" companion actions below) so a failed
    // request doesn't leave isProfileUpdateLoading stuck true forever - see
    // user-info-bar.component.ts's handleProfileUpdateStatus(), which only resolves at count 4.
    on(editParticipantProfilePictureFailureAction, (state, { error }) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editProfilePictureError: error,
    })),
    on(dontUpdateParticipantProfilePictureAction, (state) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
    })),
    on(editParticipantTagsAction, (state) => ({
        ...state,
        editTagsError: undefined,
    })),
    on(editParticipantTagsSuccessAction, (state) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editTagsError: undefined,
    })),
    on(editParticipantTagsFailureAction, (state, { error }) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editTagsError: error,
    })),
    on(editParticipantFacilitatorAction, (state) => ({
        ...state,
        editFacilitatorError: undefined,
    })),
    on(editParticipantFacilitatorSuccessAction, (state) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editFacilitatorError: undefined,
    })),
    on(editParticipantFacilitatorFailureAction, (state, { error }) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
        editFacilitatorError: error,
    })),
    on(dontSetParticipantFaciliatorAction, (state) => ({
        ...state,
        userProfileUpdateStatus: state.userProfileUpdateStatus + 1,
    })),
    on(searchMultipleAccountsAction, (state) => ({
        ...state,
        searchListLoading: true,
        searchListError: undefined,
    })),

    on(searchMultipleAccountsActionSuccess, (state, { searchListResponse }) => ({
        ...state,
        searchListLoading: false,
        // Same 204/null-body fallback as GetUsersListActionSuccess above - a genuine
        // zero-result search must not leave this undefined.
        searchListResponse: searchListResponse?.body?.data ?? { userList: [], noOfPage: 0 },
        searchListError: undefined,
        discoveryCompletedPersonIds: withDiscoveryCompleted(state, completedRowIds(searchListResponse)),
    })),

    on(getUniqueStyleActionSuccess, (state, { uniqueStyleResponse, personId }) => ({
        ...state,
        discoveryCompletedPersonIds: getUniqueStyleFromResponse(uniqueStyleResponse)
            ? withDiscoveryCompleted(state, [personId])
            : state.discoveryCompletedPersonIds,
    })),
    on(searchMultipleAccountsActionFailure, (state, { error }) => ({
        ...state,
        searchListLoading: false,
        searchListError: error,
    })),
    on(getCreditIdAction, (state) => ({
        ...state,
        getCreditIdLoading: true,
        creditIdError: undefined,
    })),
    on(getCreditIdActionSuccess, (state, { creditIdResponse }) => ({
        ...state,
        getCreditIdLoading: false,
        creditIdResponse: creditIdResponse?.body?.data,
        creditIdError: undefined,
    })),
    on(getCreditIdActionFailure, (state, { error }) => ({
        ...state,
        getCreditIdLoading: false,
        creditIdError: error,
    })),
    on(saveUserToAccountAction, (state) => ({
        ...state,
        deleteUserLoading: true,
        deleteUserError: undefined,
    })),
    on(saveUserToAccountActionSuccess, (state, { response, removedPersonId }) => ({
        ...state,
        deleteUserLoading: false,
        deleteUserResponse: response?.body?.data,
        deleteUserError: undefined,
        // Splices the removed participant out of the currently-loaded page immediately, so the
        // table updates with zero loader and zero re-fetch. Only runs when the effect identified
        // this as a known single-participant removal (see main-users-list.effects.ts) - for any
        // other saveUserToAccount usage (add, settings removal) removedPersonId is undefined and
        // usersListResponse is left as-is, matching prior behavior for those flows.
        usersListResponse: removedPersonId
            ? {
                  ...state.usersListResponse,
                  userList: (state.usersListResponse?.userList ?? []).filter((u: any) => u?.personID !== removedPersonId),
              }
            : state.usersListResponse,
    })),
    on(saveUserToAccountActionFailure, (state, { error }) => ({
        ...state,
        deleteUserLoading: false,
        deleteUserError: error,
    })),
    on(getDarkModeStatus, (state, { darkModePayload }) => {
        return {
            ...state,
            darkModeSwitch: darkModePayload,
        }
    }),
    on(UpdateColorSuccessAction, (state, { accountColorPayload }) => ({
        ...state,
        accountColorPayload: accountColorPayload?.body,
        getAccountColorLoading: false,
        accountColorError: undefined,
    })),

    on(UpdateColorAction, (state) => ({
        ...state,
        getAccountColorLoading: true,
        accountColorError: undefined,
    })),

    on(UpdateColorActionFailure, (state, { error }) => ({
        ...state,
        getAccountColorLoading: false,
        accountColorError: error,
    }))
)
