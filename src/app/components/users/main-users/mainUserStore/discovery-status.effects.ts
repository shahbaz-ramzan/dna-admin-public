import { Injectable } from '@angular/core'
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { of } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
import { catchApiError } from 'src/app/service/api-error'
import { MainUsersService } from '../../main-users.service'
import { getUniqueStyleFromResponse } from '../discovery-status.util'
import { discoveryStatusResolvedAction, getUniqueStyleAction, getUniqueStyleActionFailure, getUniqueStyleActionSuccess } from './main-users-list.actions'
import { selectDiscoveryCompletedPersonIds } from './main-users.selectors'

// The single place that decides whether a participant has completed DNA Discovery - see
// DISCOVERY_CHECK_SKIP_PLAN.md. Every gated page dispatches getUniqueStyleAction and acts only on
// discoveryStatusResolvedAction. Kept apart from MainUsersListEffects because it needs the Store.
@Injectable()
export class DiscoveryStatusEffects {
    constructor(
        private actions$: Actions,
        private store: Store,
        private mainUsersService: MainUsersService
    ) {}

    // Participants already known to be complete (from the users list, or an earlier check this
    // session) resolve immediately with no network call. Everyone else hits the API.
    getUniqueStyle = createEffect(() =>
        this.actions$.pipe(
            ofType(getUniqueStyleAction),
            concatLatestFrom(() => this.store.select(selectDiscoveryCompletedPersonIds)),
            mergeMap(([{ payload }, completedPersonIds]) => {
                const personId = payload?.personId
                if (completedPersonIds?.[personId]) return of(discoveryStatusResolvedAction(personId, true))
                return this.mainUsersService.getUniqueStyleCall(payload).pipe(
                    map((uniqueStyleResponse: any) => getUniqueStyleActionSuccess(uniqueStyleResponse, personId)),
                    catchApiError((error) => getUniqueStyleActionFailure(error, personId))
                )
            })
        )
    )

    resolveFromResponse = createEffect(() =>
        this.actions$.pipe(
            ofType(getUniqueStyleActionSuccess),
            map(({ uniqueStyleResponse, personId }) => discoveryStatusResolvedAction(personId, !!getUniqueStyleFromResponse(uniqueStyleResponse)))
        )
    )

    // Fail open: a failed check shouldn't block a participant who may well have data.
    resolveFromFailure = createEffect(() =>
        this.actions$.pipe(
            ofType(getUniqueStyleActionFailure),
            map(({ personId }) => discoveryStatusResolvedAction(personId, true))
        )
    )
}
