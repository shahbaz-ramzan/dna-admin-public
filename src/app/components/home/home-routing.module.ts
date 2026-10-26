import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { HomeComponent } from './home.component'

const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        children: [
            {
                path: '',
                loadComponent: () => import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
            },
            {
                path: 'dashboard',
                loadComponent: () => import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
            },
            {
                path: 'users',
                loadChildren: () => import('../users/main-users/main-users.routes').then((m) => m.MAIN_USERS_ROUTES),
            },
            {
                path: 'myTeam',
                loadChildren: () => import('../users/main-users/main-users.routes').then((m) => m.MAIN_USERS_ROUTES),
            },
            {
                path: 'settings',
                loadChildren: () => import('../settings/settings.module').then((m) => m.SettingsModule),
            },
        ],
    },
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HomeRoutingModule {}
