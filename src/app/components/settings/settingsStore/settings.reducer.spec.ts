import { getFacilitatorsSuccessAction, setEditRegistrationLinkSuccessAction, successSubscriptionAccountAction, topLevelAdminSearchUserActionSuccess } from './settings.actions'
import { initialState, settingsReducer } from './settings.reducer'

/**
 * First reducer coverage for this file. It exists specifically to pin down a hazard introduced by
 * D0 (SETTINGS_PAGE_STATUSCODE_MIGRATION_PLAN.md): five effects in settings.effects.ts used to
 * swallow failures into `catchError(() => EMPTY)`. They now dispatch their **success** action type
 * with an undefined payload plus a normalized `error`, so that the loading flag still resets
 * instead of hanging forever.
 *
 * The consequence is that every reducer handler for those five success actions is now reachable
 * with an undefined payload. `setEditRegistrationLinkSuccessAction` read `response.body.data`
 * unguarded and threw inside the reducer on that path - worse than the stuck loader it replaced,
 * because a throwing reducer breaks NgRx's state stream for the rest of the session. These tests
 * lock in the null-safety for all three payload-reading handlers of that group.
 */
describe('settingsReducer - undefined-payload safety for the former catchError(() => EMPTY) effects', () => {
    const apiError = { status: 500, message: 'Server error', raw: undefined } as any

    it('setEditRegistrationLinkSuccessAction: does not throw on the failure path, and still clears isRegistrationLoading', () => {
        const state = { ...initialState, isRegistrationLoading: true, registrationLinkToEdit: { id: 1 } as any }

        // Exactly what getSelfRegistrationLink's catchApiError branch dispatches.
        const action = { ...setEditRegistrationLinkSuccessAction(undefined), error: apiError } as any

        expect(() => settingsReducer(state, action)).not.toThrow()

        const result = settingsReducer(state, action) as any
        expect(result.isRegistrationLoading).toBe(false)
        expect(result.registrationLinkToEdit).toBeUndefined()
    })

    it('setEditRegistrationLinkSuccessAction: still stores the real link on a genuine success', () => {
        const state = { ...initialState, isRegistrationLoading: true }
        const link = { id: 7, name: 'Link' }

        const result = settingsReducer(state, setEditRegistrationLinkSuccessAction({ body: { data: link } })) as any

        expect(result.registrationLinkToEdit).toEqual(link)
        expect(result.isRegistrationLoading).toBe(false)
    })

    it('successSubscriptionAccountAction: does not throw on the failure path, and clears both loading flags', () => {
        const state = { ...initialState, getSubscriptionAccountLoading: true, getSubscriptionUrlDetailsLoading: true } as any

        const action = { ...successSubscriptionAccountAction(undefined), error: apiError } as any

        expect(() => settingsReducer(state, action)).not.toThrow()

        const result = settingsReducer(state, action) as any
        expect(result.subscriptionAccountPayload).toBeUndefined()
        expect(result['getSubscriptionAccountLoading']).toBe(false)
        expect(result['getSubscriptionUrlDetailsLoading']).toBe(false)
    })

    it('topLevelAdminSearchUserActionSuccess: does not throw on the failure path, and clears isTopLevelSearchLoading', () => {
        const state = { ...initialState, isTopLevelSearchLoading: true } as any

        const action = { ...topLevelAdminSearchUserActionSuccess(undefined), error: apiError } as any

        expect(() => settingsReducer(state, action)).not.toThrow()

        const result = settingsReducer(state, action) as any
        expect(result.topLevelUsersSearchResponse).toBeUndefined()
        expect(result['isTopLevelSearchLoading']).toBe(false)
    })

    it('getFacilitatorsSuccessAction: does not throw when response is undefined - latent hazard hardened defensively, not yet reachable (getFacilitators has no toFailureAction today)', () => {
        const state = { ...initialState }

        expect(() => settingsReducer(state, getFacilitatorsSuccessAction(undefined))).not.toThrow()

        const result = settingsReducer(state, getFacilitatorsSuccessAction(undefined)) as any
        expect(result.facilitators).toBeUndefined()
    })

    it('getFacilitatorsSuccessAction: still stores the real facilitators list on a genuine success', () => {
        const state = { ...initialState }
        const list = [{ id: 1 }, { id: 2 }]

        const result = settingsReducer(state, getFacilitatorsSuccessAction({ body: { data: list } })) as any

        expect(result.facilitators).toEqual(list)
    })
})
