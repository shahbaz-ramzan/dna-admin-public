import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AccountComponent } from './account/account.component'
import { AppcuesManagementComponent } from './appcues-management/appcues-management.component'
import { EmailSettingsComponent } from './email-settings/email-settings.component'
import { IntegrationsComponent } from './integrations/integrations.component'
import { InviteComponent } from './invite/invite.component'
import { MyProfileComponent } from './my-profile/my-profile.component'
import { ParticipantManagementComponent } from './participant-management/participant-management.component'
import { RegistrationComponent } from './registration/registration.component'
import { ReportsComponent } from './reports/reports.component'
import { SettingsComponent } from './settings.component'
import { SubscriptionsComponent } from './subscriptions/subscriptions.component'

const routes: Routes = [
    {
        path: '',
        component: SettingsComponent,
        children: [
            { path: '', component: AccountComponent },
            { path: 'account', component: AccountComponent },
            { path: 'profile', component: MyProfileComponent },
            {
                path: 'self-registration',
                component: RegistrationComponent,
            },
            {
                path: 'subscriptions',
                component: SubscriptionsComponent,
            },
            { path: 'invite', component: InviteComponent },
            {
                path: 'email-settings',
                component: EmailSettingsComponent,
            },
            { path: 'reports', component: ReportsComponent },
            {
                path: 'participant-management',
                component: ParticipantManagementComponent,
            },
            {
                path: 'integrations',
                component: IntegrationsComponent,
            },
            {
                path: 'appcues-management',
                component: AppcuesManagementComponent,
            },
        ],
    },
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SettingsRoutingModule {}
