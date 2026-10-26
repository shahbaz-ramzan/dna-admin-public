import { Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { map, mergeMap } from 'rxjs/operators'
import { catchApiError } from 'src/app/service/api-error'

import { OnboardingService } from 'src/app/service/onboarding.service'
import {
    GET_ONBOARDING_PARTICIPANTS_LABELS,
    GET_ONBOARDING_USERS_LABELS,
    UPDATE_ACCOUNT_ACTION,
    UPLOAD_LOGO_ACTION,
} from './onboarding-actions-constants'
import {
    getOnboardingParticipantLabelsFailure,
    getOnboardingUserLabelsFailure,
    successOnboardingParticipantLabels,
    successOnboardingUserLabels,
    updateAccountActionFailure,
    updateAccountActionSuccess,
    uploadLogoActionFailure,
    uploadLogoActionSuccess,
} from './onboarding.actions'
@Injectable()
export class OnboardingEffects {
    onboardingUserLabelsData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ONBOARDING_PARTICIPANTS_LABELS),
            mergeMap(() =>
                this.onboardingService.getOnboardingParticipantLabelsCall().pipe(
                    map((response) => successOnboardingParticipantLabels(response)),
                    catchApiError((error) => getOnboardingParticipantLabelsFailure(error))
                )
            )
        )
    )
    onboardingParticipantLabelsData = createEffect(() =>
        this.actions$.pipe(
            ofType(GET_ONBOARDING_USERS_LABELS),
            mergeMap(() =>
                this.onboardingService.getOnboardingUserLabelsCall().pipe(
                    map((response) => successOnboardingUserLabels(response)),
                    catchApiError((error) => getOnboardingUserLabelsFailure(error))
                )
            )
        )
    )

    updateAccountDetails = createEffect(() =>
        this.actions$.pipe(
            ofType(UPDATE_ACCOUNT_ACTION),
            mergeMap(({ payload }) =>
                this.onboardingService.updateAccountDetails(payload).pipe(
                    map((response) => updateAccountActionSuccess(response)),
                    catchApiError((error) => updateAccountActionFailure(error))
                )
            )
        )
    )

    uploadLogo = createEffect(() =>
        this.actions$.pipe(
            ofType(UPLOAD_LOGO_ACTION),
            mergeMap(({ payload }) =>
                this.onboardingService.uploadAccountLogo(payload).pipe(
                    map((response) => uploadLogoActionSuccess(response)),
                    catchApiError((error) => uploadLogoActionFailure(error))
                )
            )
        )
    )
    constructor(
        private actions$: Actions,
        private onboardingService: OnboardingService
    ) {}
}
