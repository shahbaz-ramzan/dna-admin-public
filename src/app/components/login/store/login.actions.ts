import { createAction } from '@ngrx/store'
import { ApiError } from 'src/app/service/api-error'
import {
    CHECK_IDP_USER_ACTION,
    CHECK_IDP_USER_ACTION_SUCCESS,
    GET_ALL_ACCOUNTS_ACTION,
    GET_ALL_ACCOUNTS_ACTION_SUCCESS,
    GET_ALL_ACCOUNTS_ACTION_FAILURE,
    GET_IDP_USER_ACTION,
    GET_IDP_USER_ACTION_SUCCESS,
    UPSERT_IDP_USER_ACTION,
    UPSERT_IDP_USER_ACTION_SUCCESS,
} from './login-actions-constants'

export const getAllAccountsAction = createAction(GET_ALL_ACCOUNTS_ACTION, (personId: any) => ({
    personId,
}))
// Payload is already interpreted by login.effects.ts's getAllAccountsByPersonId - never the raw
// envelope. See the "Backend response contract" README section for why that split exists.
export const getAllAccountsActionSuccess = createAction(GET_ALL_ACCOUNTS_ACTION_SUCCESS, (accounts: any[] | undefined, noAccountsAvailable: boolean) => ({
    accounts,
    noAccountsAvailable,
}))

export const getAllAccountsActionFailure = createAction(GET_ALL_ACCOUNTS_ACTION_FAILURE, (error: ApiError) => ({ error, notify: true }))

export const checkIdpUserAction = createAction(CHECK_IDP_USER_ACTION, (opaqueId: any) => ({
    opaqueId,
}))
// Payload is already interpreted by login.effects.ts's checkIdpUser - never the raw envelope.
export const checkIdpUserActionSuccess = createAction(CHECK_IDP_USER_ACTION_SUCCESS, (data: any, error: ApiError | undefined) => ({ data, error }))

export const upsertIdpAction = createAction(UPSERT_IDP_USER_ACTION, (payload: any) => ({
    payload,
}))
// Payload is already interpreted by login.effects.ts's upsertIdpUser - never the raw envelope.
export const upsertIdpActionSuccess = createAction(UPSERT_IDP_USER_ACTION_SUCCESS, (success: boolean, error: ApiError | undefined) => ({ success, error }))

export const getIdpUserAction = createAction(GET_IDP_USER_ACTION, (opaqueId: any) => ({
    opaqueId,
}))
// Payload is already interpreted by login.effects.ts's getIdpUser - never the raw envelope.
export const getIdpUserActionSuccess = createAction(GET_IDP_USER_ACTION_SUCCESS, (data: any, error: ApiError | undefined) => ({ data, error }))
