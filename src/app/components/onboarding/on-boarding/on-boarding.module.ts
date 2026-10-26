import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UploadLogoComponent } from '../upload-logo/upload-logo.component'
import { OnboardingSetupTeamComponent } from '../onboarding-setup-team/onboarding-setup-team.component'
import { OnBoardingComponent } from './on-boarding.component'
import { GetLabelsComponent } from '../get-labels/get-labels.component'
import { OnboardingSetupAccountComponent } from '../onboarding-setup-account/onboarding-setup-account.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { AppRoutingModule } from 'src/app/app-routing.module'
import { ReviewsLabelsComponent } from '../reviews-labels/reviews-labels.component'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { SharedModule } from 'src/app/shared/shared.module'
@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        FormsModule,
        PrimengModule,
        ReactiveFormsModule,
        AppRoutingModule,
        ProgressSpinnerModule,
        SharedModule,
        OnBoardingComponent,
        OnboardingSetupAccountComponent,
        OnboardingSetupTeamComponent,
        UploadLogoComponent,
        GetLabelsComponent,
        ReviewsLabelsComponent,
    ],
})
export class OnBoardingModule {}
