import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { of } from 'rxjs'
import { catchError, concatMap, map, mergeMap, switchMap } from 'rxjs/operators'
import { GET_ACCOUNT_COLOR_ACTION } from 'src/app/components/dashboard/dashboard-actions-constants'
import K from 'src/app/constants'
import { catchApiError, ensureApiError } from 'src/app/service/api-error'
import { UsersCacheStorageService } from 'src/app/service/users-cache-storage.service'
import Encryption from 'src/app/util/Encryption'
import { SwrCache, withStaleWhileRevalidate } from 'src/app/util/stale-while-revalidate'
import { MainUsersService } from '../../main-users.service'
import {
    // getDigitalScanAccessData (below) is deliberately left on its original hand-typed pattern -
    // client-confirmed "do not change this flow" (see docs/USERS_TABLE_ERROR_HANDLING_PLAN.md
    // Phase 3 note). DIGITAL_SCAN_ACCESS_DATA_ACTION_SUCCESS is still needed for it.
    DIGITAL_SCAN_ACCESS_DATA_ACTION,
    DIGITAL_SCAN_ACCESS_DATA_ACTION_SUCCESS,
    EDIT_PARTICIPANT_FACILITATOR_ACTION,
    EDIT_PARTICIPANT_PROFILE_ACTION,
    EDIT_PARTICIPANT_PROFILE_PICTURE_ACTION,
    EDIT_PARTICIPANT_TAGS_ACTION,
    EXPORT_USERS_LIST_ACTION,
    GET_CREDIT_ID_ACTION,
    GET_DISCOVERY_STATUS_ACTION,
    GET_FACILITATORS_ACTION,
    GET_SELF_REGISTRATION_DETAIL_ACTION,
    GET_SELF_REGISTRATION_DETAIL_ACTION_SUCCESS,
    GET_SELF_REGISTRATION_ID_ACTION,
    GET_SELF_REGISTRATION_ID_ACTION_SUCCESSS,
    GET_TAGS_ACTION,
    GET_USERS_LIST_ACTION,
    SAVE_USER_TO_ACCOUNT_ACTION,
    SEARCH_MULTIPLE_ACCOUNT_ACTION,
    UPDATE_COLOR_ACTION,
} from './main-users-actions-constants'
import {
    GetTagsActionFailure,
    GetTagsActionSuccess,
    GetUsersListActionFailure,
    GetUsersListActionSuccess,
    UpdateColorActionFailure,
    UpdateColorSuccessAction,
    editParticipantFacilitatorFailureAction,
    editParticipantFacilitatorSuccessAction,
    editParticipantProfileFailureAction,
    editParticipantProfilePictureFailureAction,
    editParticipantProfilePictureSuccessAction,
    editParticipantProfileSuccessAction,
    editParticipantTagsFailureAction,
    editParticipantTagsSuccessAction,
    exportUsersListActionFailure,
    exportUsersListActionSuccess,
    getCreditIdActionFailure,
    getCreditIdActionSuccess,
    getDiscoveryStatusActionFailure,
    getDiscoveryStatusActionSuccess,
    getFaciliatorSuccessAction,
    getFacilitatorActionFailure,
    getSelfRegistrationDetailActionFailure,
    getSelftRegistrationIdActionFailure,
    saveUserToAccountActionFailure,
    saveUserToAccountActionSuccess,
    searchMultipleAccountsActionFailure,
    searchMultipleAccountsActionSuccess,
} from './main-users-list.actions'

@Injectable()
export class MainUsersListEffects {
    private inFlightRefreshes = new Set<string>()
    private lastRefreshedAt = new Map<string, number>()

    constructor(
        private actions$: Actions,
        private mainUsersService: MainUsersService,
        private usersCache: UsersCacheStorageService
    ) {}

    updateColor = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_COLOR_ACTION),
            mergeMap((body) =>
                this.mainUsersService.getUpdateColorCall(body).pipe(
                    mergeMap((response) =>
                        of(UpdateColorSuccessAction(response), {
                            type: GET_ACCOUNT_COLOR_ACTION,
                            accountId: Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || ''),
                        })
                    ),
                    catchApiError((error) => UpdateColorActionFailure(error))
                )
            )
        )
    )

    getUsersList = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_USERS_LIST_ACTION),
            // switchMap (not mergeMap): a newer request must cancel any still-in-flight prior
            // request, otherwise a stale /users response can resolve after navigating to
            // /myTeam (or vice versa) and overwrite the current page's list with the wrong data.
            // This also tears down any still-running background SWR revalidation from the
            // previous dispatch (regardless of its cache key) - that's fine here: the cached
            // value it was refreshing was already rendered synchronously, and inFlightRefreshes
            // is cleaned up via finalize() on that cancellation, so nothing leaks.
            switchMap((body: any) => {
                const accountId = body.getUsersPayload?.accountId
                return withStaleWhileRevalidate(
                    this.usersCache.buildKey(body.getUsersPayload),
                    // Closure adapter (not this.usersCache directly): records the accountId this
                    // page was fetched for on every write, so a later delete can scope its cache
                    // patch to the account the participant was actually removed from - see
                    // UsersCacheStorageService.removeUserFromAllCachedPages().
                    {
                        get: (key) => this.usersCache.get(key),
                        setIfChanged: (key, data) => this.usersCache.setIfChanged(key, data, accountId),
                    } as SwrCache<any>,
                    this.inFlightRefreshes,
                    (silent) => this.mainUsersService.getUsersListCall(body, silent),
                    (usersListResponse) => GetUsersListActionSuccess(usersListResponse),
                    // withStaleWhileRevalidate passes the raw thrown error straight through - it
                    // doesn't normalize it itself (stale-while-revalidate.ts's contract), so that's
                    // done here at the call site instead.
                    (error) => GetUsersListActionFailure(ensureApiError(error)),
                    this.lastRefreshedAt
                )
            })
        )
    )

    exportUsersList = createEffect(() =>
        this.actions$.pipe(
            ofType(EXPORT_USERS_LIST_ACTION),
            mergeMap((body) =>
                this.mainUsersService.exportUsersListCall(body).pipe(
                    map((response) => exportUsersListActionSuccess(response)),
                    catchApiError((error) => exportUsersListActionFailure(error))
                )
            )
        )
    )

    getTags = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_TAGS_ACTION),
            mergeMap((body) =>
                this.mainUsersService.getTagsCall(body).pipe(
                    map((response) => GetTagsActionSuccess(response)),
                    catchApiError((error) => GetTagsActionFailure(error))
                )
            )
        )
    )

    getFacilitators = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_FACILITATORS_ACTION),
            mergeMap((payload) =>
                this.mainUsersService.getFacilitators(payload).pipe(
                    map((response) => getFaciliatorSuccessAction(response)),
                    catchApiError((error) => getFacilitatorActionFailure(error))
                )
            )
        )
    )

    editParticipantProfile = createEffect(() =>
        this.actions$.pipe(
            ofType(EDIT_PARTICIPANT_PROFILE_ACTION),
            // concatMap (not mergeMap): queue edits in dispatch order instead of running them
            // concurrently with no guaranteed response order (e.g. a double-click Save, or edits
            // for two different participants fired in quick succession, could otherwise resolve
            // out of order and let a stale response overwrite a newer one).
            concatMap((payload) =>
                this.mainUsersService.editParticipantProfile(payload).pipe(
                    map((response) => {
                        this.usersCache.purgeAll()
                        this.mainUsersService.clearParticipantsDetailCache()
                        return editParticipantProfileSuccessAction(response)
                    }),
                    catchApiError((error) => editParticipantProfileFailureAction(error))
                )
            )
        )
    )

    editParticipantProfilePicture = createEffect(() =>
        this.actions$.pipe(
            ofType(EDIT_PARTICIPANT_PROFILE_PICTURE_ACTION),
            // concatMap (not mergeMap): same ordering guarantee as editParticipantProfile.
            concatMap((payload) =>
                this.mainUsersService.editParticipantProfilePicture(payload).pipe(
                    map((response) => {
                        this.usersCache.purgeAll()
                        this.mainUsersService.clearParticipantsDetailCache()
                        return editParticipantProfilePictureSuccessAction(response)
                    }),
                    catchApiError((error) => editParticipantProfilePictureFailureAction(error))
                )
            )
        )
    )

    editParticipantTags = createEffect(() =>
        this.actions$.pipe(
            ofType(EDIT_PARTICIPANT_TAGS_ACTION),
            // concatMap (not mergeMap): same ordering guarantee as editParticipantProfile.
            concatMap((payload) =>
                this.mainUsersService.editParticipantTags(payload).pipe(
                    map((response) => {
                        this.usersCache.purgeAll()
                        this.mainUsersService.clearParticipantsDetailCache()
                        return editParticipantTagsSuccessAction(response)
                    }),
                    catchApiError((error) => editParticipantTagsFailureAction(error))
                )
            )
        )
    )

    editParticipantFacilitator = createEffect(() =>
        this.actions$.pipe(
            ofType(EDIT_PARTICIPANT_FACILITATOR_ACTION),
            // concatMap (not mergeMap): same ordering guarantee as editParticipantProfile.
            concatMap((payload) =>
                this.mainUsersService.editParticipantFacilitator(payload).pipe(
                    map((response) => {
                        this.usersCache.purgeAll()
                        this.mainUsersService.clearParticipantsDetailCache()
                        return editParticipantFacilitatorSuccessAction(response)
                    }),
                    catchApiError((error) => editParticipantFacilitatorFailureAction(error))
                )
            )
        )
    )

    searchMultipleAccounts = createEffect(() =>
        this.actions$.pipe(
            ofType(SEARCH_MULTIPLE_ACCOUNT_ACTION),
            switchMap((body) =>
                this.mainUsersService.searchMultipleAccountsCall(body).pipe(
                    map((response) => searchMultipleAccountsActionSuccess(response)),
                    catchApiError((error) => searchMultipleAccountsActionFailure(error))
                )
            )
        )
    )

    getSelfRegistrationId = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SELF_REGISTRATION_ID_ACTION),
            mergeMap(({ personId }) =>
                this.mainUsersService.getSelfRegistrationId(personId).pipe(
                    // Not using the getSelftRegistrationIdActionSuccess creator here: it spreads
                    // `response`'s own fields onto the action (`(response) => response`), but
                    // single-user-selection.component.ts:438 reads the dispatched action's nested
                    // `.response.body...` - switching to the creator would silently break that
                    // consumer. Keeping the original hand-typed shape to match what's actually
                    // consumed; the creator's shape is a pre-existing inconsistency, not something
                    // to paper over by changing the real consumer.
                    map((response) => ({
                        type: GET_SELF_REGISTRATION_ID_ACTION_SUCCESSS,
                        response,
                    })),
                    catchApiError((error) => getSelftRegistrationIdActionFailure(error))
                )
            )
        )
    )
    getSelfRegistrationDetail = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_SELF_REGISTRATION_DETAIL_ACTION),
            mergeMap((payload) =>
                this.mainUsersService.getSelfRegistrationDetail(payload).pipe(
                    // Same reasoning as getSelfRegistrationId above - no current consumer, but keep
                    // the shape consistent with its sibling action instead of introducing the
                    // creator's inconsistent spread shape.
                    map((response) => ({
                        type: GET_SELF_REGISTRATION_DETAIL_ACTION_SUCCESS,
                        response,
                    })),
                    catchApiError((error) => getSelfRegistrationDetailActionFailure(error))
                )
            )
        )
    )

    getCreditId = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_CREDIT_ID_ACTION),
            mergeMap(({ payload }) =>
                this.mainUsersService.getCreditIdCall(payload).pipe(
                    map((creditIdResponse: any) => getCreditIdActionSuccess(creditIdResponse)),
                    catchApiError((error) => getCreditIdActionFailure(error))
                )
            )
        )
    )

    getDiscoveryStatus = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_DISCOVERY_STATUS_ACTION),
            mergeMap(({ payload }) =>
                this.mainUsersService.getDiscoveryStatusCall(payload).pipe(
                    map((discoveryStatusResponse: any) => getDiscoveryStatusActionSuccess(discoveryStatusResponse)),
                    catchApiError((error) => getDiscoveryStatusActionFailure(error))
                )
            )
        )
    )

    saveUserToAccount = createEffect(() =>
        this.actions$.pipe(
            ofType(SAVE_USER_TO_ACCOUNT_ACTION),
            // concatMap (not mergeMap): this fires per-participant (e.g. removing several
            // different users from an account in quick succession) - queueing in dispatch order
            // avoids overlapping in-flight requests resolving out of order, without ever dropping
            // a legitimate request the way exhaustMap would for a second, different participant.
            concatMap((body: any) =>
                this.mainUsersService.saveUserToAccountCall(body).pipe(
                    map((response) => {
                        // This action is shared by two flows with different payload shapes:
                        // the Users-table "remove from account" flow (participant-account-
                        // removal.service.ts: { status: false, accountId, personId }) and the
                        // Settings "add/remove participant" flow, which also sends status:false
                        // for a removal but under a differently-cased field (personID) and can
                        // also send status:true for an add. A surgical cache patch only makes
                        // sense when we know exactly which single participant left which single
                        // account, so it's opted into only for that exact known shape; every
                        // other case (add, settings removal, anything unexpected) keeps the
                        // existing full purge rather than guessing at field names.
                        const { status, accountId, personId } = body?.data ?? {}
                        const isKnownAccountRemoval = status === false && !!accountId && !!personId
                        if (isKnownAccountRemoval) {
                            this.usersCache.removeUserFromAllCachedPages(accountId, personId)
                        } else {
                            this.usersCache.purgeAll()
                        }
                        this.mainUsersService.clearParticipantsDetailCache()
                        return saveUserToAccountActionSuccess(response, isKnownAccountRemoval ? personId : undefined)
                    }),
                    catchApiError((error) => saveUserToAccountActionFailure(error))
                )
            )
        )
    )

    getDigitalScanAccessData = createEffect(() =>
        this.actions$.pipe(
            ofType(DIGITAL_SCAN_ACCESS_DATA_ACTION),
            mergeMap(() =>
                this.mainUsersService.getDigitalScanAccessData().pipe(
                    map((response: any) => ({
                        type: DIGITAL_SCAN_ACCESS_DATA_ACTION_SUCCESS,
                        response,
                    })),
                    catchError((err) =>
                        of({
                            type: DIGITAL_SCAN_ACCESS_DATA_ACTION_SUCCESS,
                            response: err,
                        })
                    )
                )
            )
        )
    )
}
