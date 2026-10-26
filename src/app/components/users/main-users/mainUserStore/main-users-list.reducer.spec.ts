import {
    saveUserToAccountActionSuccess,
    saveUserToAccountActionFailure,
    UpdateColorAction,
    UpdateColorActionFailure,
    UpdateColorSuccessAction,
    getFacilitatorAction,
    getFaciliatorSuccessAction,
    getFacilitatorActionFailure,
    GetUsersListAction,
    GetUsersListActionFailure,
    GetUsersListActionSuccess,
    getUniqueStyleActionSuccess,
    searchMultipleAccountsActionSuccess,
} from './main-users.actions'
import { initialState, listReducer } from './main-users-list.reducer'

describe('listReducer - saveUserToAccountActionSuccess', () => {
    it('splices the removed participant out of usersListResponse.userList when removedPersonId is set', () => {
        const state = {
            ...initialState,
            usersListResponse: {
                userList: [{ personID: 'p1' }, { personID: 'p2' }],
                noOfPage: 3,
            },
        }

        const action = saveUserToAccountActionSuccess({ body: { statusCode: 200, data: {} } }, 'p1')
        const result = listReducer(state, action)

        expect(result.usersListResponse.userList).toEqual([{ personID: 'p2' }])
        // Approximate page-count field is intentionally left untouched - see
        // docs/USER_DELETE_CACHE_PLAN.md's "Pagination note".
        expect(result.usersListResponse.noOfPage).toBe(3)
    })

    it('leaves usersListResponse untouched when removedPersonId is undefined (add-to-account / settings removal / unknown shape)', () => {
        const state = {
            ...initialState,
            usersListResponse: {
                userList: [{ personID: 'p1' }, { personID: 'p2' }],
                noOfPage: 3,
            },
        }

        const action = saveUserToAccountActionSuccess({ body: { statusCode: 200, data: {} } })
        const result = listReducer(state, action)

        expect(result.usersListResponse).toEqual(state.usersListResponse)
    })

    it('always resets deleteUserLoading and stores deleteUserResponse regardless of removedPersonId', () => {
        const state = { ...initialState, deleteUserLoading: true }

        const action = saveUserToAccountActionSuccess({ body: { statusCode: 200, data: { ok: true } } }, 'p1')
        const result = listReducer(state, action)

        expect(result.deleteUserLoading).toBe(false)
        expect(result.deleteUserResponse).toEqual({ ok: true })
    })

    it('does not throw when usersListResponse is empty/undefined at delete time', () => {
        const state = { ...initialState, usersListResponse: undefined as any }

        const action = saveUserToAccountActionSuccess({ body: { statusCode: 200, data: {} } }, 'p1')
        expect(() => listReducer(state, action)).not.toThrow()
    })
})

/**
 * `UpdateColorAction` and `UpdateColorSuccessAction` used to share the same action type
 * (`UPDATE_COLOR_ACTION`), so the "success" handler below actually fired on dispatch, writing the
 * outgoing request payload's `?.body` (always undefined) into `accountColorPayload` and resetting
 * `getAccountColorLoading` back to `false` synchronously - see
 * docs/USERS_TABLE_ERROR_HANDLING_PLAN.md Phase 1. These tests cover the three real transitions now
 * that the types are separated.
 */
describe('listReducer - updateColor (Phase 1: type-string collision fix)', () => {
    it('sets getAccountColorLoading true and clears any previous error on dispatch', () => {
        const state = { ...initialState, getAccountColorLoading: false, accountColorError: { status: 500, message: 'old error', raw: undefined } as any }

        const result = listReducer(state, UpdateColorAction({ accountId: 'acc-1', primaryColor: '#000', secondaryColor: '#111' }))

        expect(result.getAccountColorLoading).toBe(true)
        expect(result.accountColorError).toBeUndefined()
    })

    it('stores the real response body and clears loading/error on a genuine success', () => {
        const state = { ...initialState, getAccountColorLoading: true }
        const response = { body: { data: { primaryColor: '#000' } } }

        const result = listReducer(state, UpdateColorSuccessAction(response))

        expect(result.accountColorPayload).toEqual(response.body)
        expect(result.getAccountColorLoading).toBe(false)
        expect(result.accountColorError).toBeUndefined()
    })

    it('records the ApiError and clears loading on a real failure, without touching accountColorPayload', () => {
        const state = { ...initialState, getAccountColorLoading: true, accountColorPayload: { data: { primaryColor: '#existing' } } }
        const error = { status: 500, message: 'Server error', raw: undefined } as any

        const result = listReducer(state, UpdateColorActionFailure(error))

        expect(result.getAccountColorLoading).toBe(false)
        expect(result.accountColorError).toEqual(error)
        expect(result.accountColorPayload).toEqual(state.accountColorPayload)
    })
})

/**
 * Phase 4 (docs/USERS_TABLE_ERROR_HANDLING_PLAN.md): error fields recorded per call, cleared on
 * trigger/success, loading flags always reset on failure - including the two that previously had
 * no failure case at all (getFacilitatorActionFailure, and getUsersListLoading already had one but
 * never recorded an error).
 */
describe('listReducer - Phase 4 error recording', () => {
    const error = { status: 500, message: 'Server error', raw: undefined } as any

    it('getFacilitatorActionFailure resets isUserDetailLoading and records facilitatorsError - previously had no case at all', () => {
        const state = { ...initialState, isUserDetailLoading: true }

        const result = listReducer(state, getFacilitatorActionFailure(error))

        expect(result.isUserDetailLoading).toBe(false)
        expect(result.facilitatorsError).toEqual(error)
    })

    it('getFacilitatorAction clears any previous facilitatorsError on a fresh dispatch', () => {
        const state = { ...initialState, facilitatorsError: error }

        const result = listReducer(state, getFacilitatorAction('acc-1'))

        expect(result.isUserDetailLoading).toBe(true)
        expect(result.facilitatorsError).toBeUndefined()
    })

    it('getFaciliatorSuccessAction clears facilitatorsError alongside resetting loading', () => {
        const state = { ...initialState, isUserDetailLoading: true, facilitatorsError: error }

        const result = listReducer(state, getFaciliatorSuccessAction({ body: { data: [{ id: 1 }] } }))

        expect(result.isUserDetailLoading).toBe(false)
        expect(result.facilitatorsError).toBeUndefined()
    })

    it('GetUsersListActionFailure records usersListError without touching usersListResponse', () => {
        const state = { ...initialState, usersListResponse: { userList: [{ personID: 'p1' }] } }

        const result = listReducer(state, GetUsersListActionFailure(error))

        expect(result.getUsersListLoading).toBe(false)
        expect(result.usersListError).toEqual(error)
        expect(result.usersListResponse).toEqual(state.usersListResponse)
    })

    it('GetUsersListAction clears any previous usersListError on a fresh dispatch', () => {
        const state = { ...initialState, usersListError: error }

        const result = listReducer(state, GetUsersListAction({ accountId: 'acc-1' }))

        expect(result.usersListError).toBeUndefined()
    })

    it('GetUsersListActionSuccess clears usersListError', () => {
        const state = { ...initialState, usersListError: error }

        const result = listReducer(state, GetUsersListActionSuccess({ body: { data: { userList: [] } } }))

        expect(result.usersListError).toBeUndefined()
    })

    it('saveUserToAccountActionFailure resets deleteUserLoading and records deleteUserError', () => {
        const state = { ...initialState, deleteUserLoading: true }

        const result = listReducer(state, saveUserToAccountActionFailure(error))

        expect(result.deleteUserLoading).toBe(false)
        expect(result.deleteUserError).toEqual(error)
    })

    it('saveUserToAccountActionSuccess clears deleteUserError without disturbing the splice behavior', () => {
        const state = {
            ...initialState,
            deleteUserLoading: true,
            deleteUserError: error,
            usersListResponse: { userList: [{ personID: 'p1' }, { personID: 'p2' }] },
        }

        const result = listReducer(state, saveUserToAccountActionSuccess({ body: { data: {} } }, 'p1'))

        expect(result.deleteUserError).toBeUndefined()
        expect(result.usersListResponse.userList).toEqual([{ personID: 'p2' }])
    })
})

describe('listReducer - discoveryCompletedPersonIds', () => {
    const listResponse = (userList: any[]) => ({ body: { data: { userList, noOfPage: 1 } } })
    const uniqueStyleResponse = (uniqueStyle: string | null) => ({ body: { message: 'Success', data: { uniqueStyle } } })

    it('starts empty', () => {
        expect(initialState.discoveryCompletedPersonIds).toEqual({})
    })

    it('records users-list rows that have a unique style, and only those', () => {
        const result = listReducer(
            initialState,
            GetUsersListActionSuccess(listResponse([{ personID: 'p1', uniqueStyle: 'Strategist' }, { personID: 'p2', uniqueStyle: '' }, { personID: 'p3' }]))
        )

        expect(result.discoveryCompletedPersonIds).toEqual({ p1: true })
    })

    it('records rows from a cross-account search the same way', () => {
        const result = listReducer(initialState, searchMultipleAccountsActionSuccess(listResponse([{ personID: 'p1', uniqueStyle: 'Adapter' }])))

        expect(result.discoveryCompletedPersonIds).toEqual({ p1: true })
    })

    it('merges across list loads instead of replacing (participant from page 1 stays known on page 3)', () => {
        const state = { ...initialState, discoveryCompletedPersonIds: { p1: true as const } }
        const result = listReducer(state, GetUsersListActionSuccess(listResponse([{ personID: 'p9', uniqueStyle: 'Engager' }])))

        expect(result.discoveryCompletedPersonIds).toEqual({ p1: true, p9: true })
    })

    it('keeps the same reference when a list load adds nobody new', () => {
        const state = { ...initialState, discoveryCompletedPersonIds: { p1: true as const } }
        const result = listReducer(state, GetUsersListActionSuccess(listResponse([{ personID: 'p1', uniqueStyle: 'Engager' }, { personID: 'p2' }])))

        expect(result.discoveryCompletedPersonIds).toBe(state.discoveryCompletedPersonIds)
    })

    it('handles a 204 / empty list response without throwing', () => {
        const result = listReducer(initialState, GetUsersListActionSuccess({ body: null }))

        expect(result.discoveryCompletedPersonIds).toEqual({})
    })

    it('records a GetUniqueStyle response with a style', () => {
        const result = listReducer(initialState, getUniqueStyleActionSuccess(uniqueStyleResponse('Strategist'), 'p1'))

        expect(result.discoveryCompletedPersonIds).toEqual({ p1: true })
    })

    it('never records an incomplete participant (null style)', () => {
        const result = listReducer(initialState, getUniqueStyleActionSuccess(uniqueStyleResponse(null), 'p1'))

        expect(result.discoveryCompletedPersonIds).toEqual({})
    })
})
