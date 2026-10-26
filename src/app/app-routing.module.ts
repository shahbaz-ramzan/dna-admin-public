import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './auth/auth.guard'
import { NotfoundComponent } from './components/notfound/notfound.component'
import { OnBoardingComponent } from './components/onboarding/on-boarding/on-boarding.component'
import { LoginComponent } from './components/login/login/login.component'
import { ThankyouComponent } from './components/login/thankyou/thankyou.component'
import { FidelityLoginComponent } from './components/fidelity-login/fidelity-login.component'

const routes: Routes = [
    { path: 'login', component: LoginComponent },

    { path: 'thankyou', component: ThankyouComponent },
    { path: 'inbound-sso-login', component: FidelityLoginComponent },

    { path: 'on-boarding', component: OnBoardingComponent, canActivate: [AuthGuard] },
    {
        path: '',
        canActivate: [AuthGuard],
        loadChildren: () => import('./components/home/home.module').then((m) => m.HomeModule),
    },
    { path: '404', component: NotfoundComponent },
    { path: '**', redirectTo: 'login' },
]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
