import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SettingsComponent } from './settings.component'
import { AccountComponent } from './account/account.component'
import { InviteComponent } from './invite/invite.component'
import { MyProfileComponent } from './my-profile/my-profile.component'
import { RegistrationComponent } from './registration/registration.component'
import { SubscriptionsComponent } from './subscriptions/subscriptions.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { ReportsComponent } from './reports/reports.component'
import { ParticipantManagementComponent } from './participant-management/participant-management.component'
import { EmailSettingsComponent } from './email-settings/email-settings.component'
import { IntegrationsComponent } from './integrations/integrations.component'
import { AppcuesManagementComponent } from './appcues-management/appcues-management.component'
import { SharedModule } from '../../shared/shared.module'
import { SettingsRoutingModule } from './settings-routing.module'

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PrimengModule,
        ProgressSpinnerModule,
        SharedModule,
        SettingsRoutingModule,
        SettingsComponent,
        RegistrationComponent,
        SubscriptionsComponent,
        EmailSettingsComponent,
        IntegrationsComponent,
        AccountComponent,
        InviteComponent,
        MyProfileComponent,
        ReportsComponent,
        ParticipantManagementComponent,
        AppcuesManagementComponent,
    ],
})
export class SettingsModule {}
