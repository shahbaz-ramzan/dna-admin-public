import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { Router } from '@angular/router'
import { concatMap, map, switchMap, tap } from 'rxjs/operators'
import { catchApiError } from 'src/app/service/api-error'
import {
    openHomeWalkthroughAction,
    openUsersWalkthroughAction,
    triggerAppWalkthroughAction,
    getActiveUserToursAction,
    getActiveUserToursSuccessAction,
    getActiveUserToursFailureAction,
    upsertUserTourStateAction,
    upsertUserTourStateSuccessAction,
    upsertUserTourStateFailureAction,
    getActiveUserBannersAction,
    getActiveUserBannersSuccessAction,
    getActiveUserBannersFailureAction,
    upsertUserBannerStateAction,
    upsertUserBannerStateSuccessAction,
    upsertUserBannerStateFailureAction,
} from './tour.actions'
import { TourService } from 'src/app/service/tour.service'

@Injectable()
export class TourEffects {
    constructor(
        private actions$: Actions,
        private router: Router,
        private tourService: TourService
    ) {}

    // Map trigger to specific route requests
    trigger$ = createEffect(() =>
        this.actions$.pipe(
            ofType(triggerAppWalkthroughAction),
            map(() => {
                const url = this.router.url
                if (url === '/' || url === '' || url.startsWith('/home') || url === '/dashboard') {
                    return openHomeWalkthroughAction()
                }
                if (url.startsWith('/users')) {
                    return openUsersWalkthroughAction()
                }
                return openHomeWalkthroughAction()
            })
        )
    )

    openHome$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(openHomeWalkthroughAction),
                tap(() => {
                    // Ask navbar to open the existing video modal; user can start or skip
                    window.dispatchEvent(new CustomEvent('open-nav-video-modal'))
                })
            ),
        { dispatch: false }
    )

    openUsers$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(openUsersWalkthroughAction),
                tap(() => {
                    // Ask MainUsers page to show the popover that controls the digital scan tour
                    window.dispatchEvent(new CustomEvent('open-users-popover'))
                })
            ),
        { dispatch: false }
    )

    // API Effects
    getActiveUserTours$ = createEffect(() =>
        this.actions$.pipe(
            ofType(getActiveUserToursAction),
            switchMap(({ userId }) =>
                this.tourService.getActiveUserToursCall(userId).pipe(
                    map((response: any) => {
                        // API already returns only active tours, no need to filter
                        return getActiveUserToursSuccessAction({ tours: response.body })
                    }),
                    catchApiError((error) => getActiveUserToursFailureAction({ error }))
                )
            )
        )
    )

    // This is a mutation, not a read - switchMap would cancel an in-flight save the moment a
    // second, DIFFERENT tour/banner completes close behind it (13 dispatch sites across 5
    // components cover different tours), silently dropping that save so the tour is never marked
    // complete server-side and reappears on next login. concatMap queues them in dispatch order
    // instead, so no completion is ever lost.
    upsertUserTourState$ = createEffect(() =>
        this.actions$.pipe(
            ofType(upsertUserTourStateAction),
            concatMap(({ payload }) =>
                this.tourService.upsertUserTourStateCall(payload).pipe(
                    map((response: any) => upsertUserTourStateSuccessAction({ result: response.body })),
                    catchApiError((error) => upsertUserTourStateFailureAction({ error }))
                )
            )
        )
    )

    getActiveUserBanners$ = createEffect(() =>
        this.actions$.pipe(
            ofType(getActiveUserBannersAction),
            switchMap(({ userId }) =>
                this.tourService.getActiveUserBannersCall(userId).pipe(
                    map((response: any) => getActiveUserBannersSuccessAction({ banners: response.body })),
                    catchApiError((error) => getActiveUserBannersFailureAction({ error }))
                )
            )
        )
    )

    // Same reasoning as upsertUserTourState$ above - a mutation, queued with concatMap so a second
    // banner's save is never silently cancelled by switchMap.
    upsertUserBannerState$ = createEffect(() =>
        this.actions$.pipe(
            ofType(upsertUserBannerStateAction),
            concatMap(({ payload }) =>
                this.tourService.upsertUserBannerStateCall(payload).pipe(
                    map((response: any) => upsertUserBannerStateSuccessAction({ result: response.body })),
                    catchApiError((error) => upsertUserBannerStateFailureAction({ error }))
                )
            )
        )
    )
}
