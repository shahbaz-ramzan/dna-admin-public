import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { map, mergeMap } from 'rxjs/operators'
import { catchApiError } from 'src/app/service/api-error'
import K from 'src/app/constants'
import { LoginService } from 'src/app/service/login.service'
import {
    CHECK_IDP_USER_ACTION,
    GET_ALL_ACCOUNTS_ACTION,
    GET_IDP_USER_ACTION,
    UPSERT_IDP_USER_ACTION,
} from './login-actions-constants'
import { checkIdpUserActionSuccess, getAllAccountsActionFailure, getAllAccountsActionSuccess, getIdpUserActionSuccess, upsertIdpActionSuccess } from './login.actions'
@Injectable()
export class LoginEffects {
    /**
     * Classifies on `response.status` - the real HTTP status Angular always gives us - never a
     * body field. There is no envelope status field to read anymore: the backend signals success
     * or failure with the actual HTTP status, and the interceptor already turns any non-2xx into
     * an ApiError via `catchApiError` below, so there's nothing bespoke to do for the failure case.
     * The component only ever sees `accounts` (real data), `noAccountsAvailable` (a real HTTP 204 -
     * "wrong app", a business state, not a failure), or `error`.
     */
    getAllAccountsByPersonId = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ALL_ACCOUNTS_ACTION),
            mergeMap(({ personId }) =>
                this.loginService.getAccountsByPersonIdCall(personId).pipe(
                    map((response) => {
                        if (response?.status === K.NETWORK.STATUS_CODE.NO_CONTENT) {
                            return getAllAccountsActionSuccess(undefined, true)
                        }
                        return getAllAccountsActionSuccess((response?.body as any)?.data?.namedUserAccountDtos ?? [], false)
                    }),
                    catchApiError((error) => getAllAccountsActionFailure(error))
                )
            )
        )
    )

    /**
     * Same pattern as getAllAccountsByPersonId: a resolved response is a success, a thrown
     * HttpErrorResponse is a failure - `catchApiError` handles that centrally, so there's no
     * `response.status === 200` check needed here at all.
     */
    checkIdpUser = createEffect(() =>
        this.actions$.pipe(
            ofType(CHECK_IDP_USER_ACTION),
            mergeMap(({ opaqueId }) =>
                this.loginService.checkIdpUserCall(opaqueId).pipe(
                    map((response) => checkIdpUserActionSuccess((response?.body as any)?.data, undefined)),
                    catchApiError((error) => checkIdpUserActionSuccess(undefined, error))
                )
            )
        )
    )

    upsertIdpUser = createEffect(() =>
        this.actions$.pipe(
            ofType(UPSERT_IDP_USER_ACTION),
            mergeMap(({ payload }) =>
                this.loginService.upsertIdpUserCall(payload).pipe(
                    map(() => upsertIdpActionSuccess(true, undefined)),
                    catchApiError((error) => upsertIdpActionSuccess(false, error))
                )
            )
        )
    )

    getIdpUser = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_IDP_USER_ACTION),
            mergeMap(({ opaqueId }) =>
                this.loginService.getIdpUserCall(opaqueId).pipe(
                    map((response) => getIdpUserActionSuccess((response?.body as any)?.data, undefined)),
                    catchApiError((error) => getIdpUserActionSuccess(undefined, error))
                )
            )
        )
    )

    constructor(
        private actions$: Actions,
        private loginService: LoginService
    ) {}
}
