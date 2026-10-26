import { selectGetUsersListLoading, selectUsersList, selectUsersListError } from './main-users.selectors'

/**
 * First coverage for these three selectors - added per USERS_TABLE_ERROR_HANDLING_PLAN.md Phase 5.
 * Purely additive plumbing (nothing consumes them yet), so these tests just pin down the field
 * they read off `mainUserReducer` and the safe-undefined behavior when the slice isn't there yet.
 */
describe('main-users.selectors - Phase 5 additions', () => {
    it('selectUsersList reads usersListResponse off the combined slice', () => {
        const state = { mainUserReducer: { usersListResponse: { userList: [{ personID: 'p1' }] } } }
        expect(selectUsersList(state as any)).toEqual({ userList: [{ personID: 'p1' }] })
    })

    it('selectGetUsersListLoading reads getUsersListLoading off the combined slice', () => {
        const state = { mainUserReducer: { getUsersListLoading: true } }
        expect(selectGetUsersListLoading(state as any)).toBe(true)
    })

    it('selectUsersListError reads usersListError off the combined slice', () => {
        const error = { status: 500, message: 'Server error', raw: undefined }
        const state = { mainUserReducer: { usersListError: error } }
        expect(selectUsersListError(state as any)).toEqual(error)
    })

    it('all three return undefined rather than throwing when the slice is missing', () => {
        const state = {}
        expect(() => selectUsersList(state as any)).not.toThrow()
        expect(selectUsersList(state as any)).toBeUndefined()
        expect(selectGetUsersListLoading(state as any)).toBeUndefined()
        expect(selectUsersListError(state as any)).toBeUndefined()
    })
})
