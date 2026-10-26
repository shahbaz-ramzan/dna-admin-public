import { createReducer, on } from '@ngrx/store'
import {
    getAllAccountsAction,
    getAllAccountsActionSuccess,
    getAllAccountsActionFailure,
    checkIdpUserAction,
    checkIdpUserActionSuccess,
    getIdpUserAction,
    getIdpUserActionSuccess,
    upsertIdpAction,
    upsertIdpActionSuccess,
} from './login.actions'

export const initialState = {}

export const loginReducer = createReducer(
    initialState,
    on(getAllAccountsAction, (state) => ({
        ...state,
        getAccountsLoading: true,
    })),
    on(getAllAccountsActionSuccess, (state, { accounts, noAccountsAvailable }) => ({
        ...state,
        getAccountsLoading: false,
        accounts,
        noAccountsAvailable,
        accountsError: undefined,
    })),
    on(getAllAccountsActionFailure, (state, { error }) => ({
        ...state,
        getAccountsLoading: false,
        accounts: undefined,
        noAccountsAvailable: false,
        accountsError: error,
    })),
    on(checkIdpUserAction, (state) => ({
        ...state,
        checkIdpUserLoading: true,
    })),
    on(checkIdpUserActionSuccess, (state, { data, error }) => ({
        ...state,
        checkIdpResponse: data,
        checkIdpError: error,
        checkIdpUserLoading: false,
    })),

    on(upsertIdpAction, (state) => ({
        ...state,
        upsertIdpUserLoading: true,
    })),
    on(upsertIdpActionSuccess, (state, { success, error }) => ({
        ...state,
        upsertIdpSuccess: success,
        upsertIdpError: error,
        upsertIdpUserLoading: false,
    })),

    on(getIdpUserAction, (state) => ({
        ...state,
        getIdpUserLoading: true,
    })),
    on(getIdpUserActionSuccess, (state, { data, error }) => ({
        ...state,
        getIdpUserResponse: data,
        getIdpUserError: error,
        getIdpUserLoading: false,
    }))
)
