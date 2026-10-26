import { CommonModule } from '@angular/common'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ConfirmationService, MessageService } from 'primeng/api'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { LoadingSpinnerComponent } from './components/common/loading-spinner/loading-spinner.component'
import { NavBarTourModalComponent } from './components/common/nav-bar/nav-bar-tour-modal/nav-bar-tour-modal.component'
import { NavBarComponent } from './components/common/nav-bar/nav-bar.component'
import { HomeComponent } from './components/home/home.component'
import { InterceptorService } from './components/loader/interceptor.service'
import { NotfoundComponent } from './components/notfound/notfound.component'
import { OnBoardingModule } from './components/onboarding/on-boarding/on-boarding.module'
import { ApiErrorInterceptor, ApiErrorNotificationEffects } from './service/api-error'
import { AuthErrorInterceptor } from './service/auth-error.interceptor'
import { CacheInterceptor } from './service/cache.interceptor'
import { SharedModule } from './shared/shared.module'
// import { GaugeChartModule } from 'angular-gauge-chart'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { NgCircleProgressModule } from 'ng-circle-progress'
// Root-scope PrimeNG modules: only what AppComponent/NavBarComponent/LoginComponent/
// ThankyouComponent/FidelityLoginComponent actually use in their templates. The full
// PrimengModule barrel (38 sub-modules) is imported directly by each lazy feature area
// (SettingsModule, the standalone MainUsers/Dashboard components) that needs it - it
// doesn't need to be duplicated here too.
import { AutoCompleteModule } from 'primeng/autocomplete'
import { AvatarModule } from 'primeng/avatar'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { DropdownModule } from 'primeng/dropdown'
import { MenuModule } from 'primeng/menu'
import { MenubarModule } from 'primeng/menubar'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { RadioButtonModule } from 'primeng/radiobutton'
import { RippleModule } from 'primeng/ripple'
import { SidebarModule } from 'primeng/sidebar'
import { ToastModule } from 'primeng/toast'

import { AuthModule } from '@auth0/auth0-angular'
import { MsalGuard, MsalInterceptor, MsalModule, MsalRedirectComponent } from '@azure/msal-angular'
import { InteractionType, PublicClientApplication } from '@azure/msal-browser'
import { msalConfig, protectedResources } from './auth/auth-config'
import { BannerComponent } from './components/common/banner/banner.component'
import { FooterComponent } from './components/common/footer/footer.component'
import { DashboardEffect } from './components/dashboard/dashboard.effect'
import { dashboardReducer } from './components/dashboard/dashboard.reducer'
import { FidelityLoginComponent } from './components/fidelity-login/fidelity-login.component'
import { LoginComponent } from './components/login/login/login.component'
import { LoginEffects } from './components/login/store/login.effects'
import { loginReducer } from './components/login/store/login.reducer'
import { ThankyouComponent } from './components/login/thankyou/thankyou.component'
import { OnboardingEffects } from './components/onboarding/store/onboarding.effects'
import { onboardingReducer } from './components/onboarding/store/onboarding.reducer'
import { SettingsEffects } from './components/settings/settingsStore/settings.effects'
import { settingsReducer } from './components/settings/settingsStore/settings.reducer'
import { TourEffects } from './components/tour/tour.effects'
import { tourReducer } from './components/tour/tour.reducer'
import { MainUsersListEffects, MainUsersReportsEffects } from './components/users/main-users/mainUserStore/main-users.effects'
import { DiscoveryStatusEffects } from './components/users/main-users/mainUserStore/discovery-status.effects'
import { mainUserReducer } from './components/users/main-users/mainUserStore/main-users.reducer'

import { SortablejsModule } from '@maksim_m/ngx-sortablejs'
import { MarkdownModule } from 'ngx-markdown'
import { environment } from 'src/environments/environment'

@NgModule({
    declarations: [AppComponent],
    imports: [
        HomeComponent,
        LoadingSpinnerComponent,
        NavBarComponent,
        NotfoundComponent,
        LoginComponent,
        FidelityLoginComponent,
        ThankyouComponent,
        NavBarTourModalComponent,
        FooterComponent,
        BannerComponent,
        MarkdownModule.forRoot(),
        SortablejsModule.forRoot({ animation: 150 }),
        OnBoardingModule,
        BrowserModule,
        StoreModule.forRoot({
            onboardingReducer: onboardingReducer,
            dashboardReducer: dashboardReducer,
            mainUserReducer: mainUserReducer,
            settingsReducer: settingsReducer,
            loginReducer: loginReducer,
            tourReducer: tourReducer,
        }),
        EffectsModule.forRoot([
            MainUsersListEffects,
            MainUsersReportsEffects,
            DiscoveryStatusEffects,
            SettingsEffects,
            OnboardingEffects,
            LoginEffects,
            TourEffects,
            DashboardEffect,
            ApiErrorNotificationEffects,
        ]),
        AppRoutingModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        CommonModule,
        HttpClientModule,
        FormsModule,
        // GaugeChartModule,
        AutoCompleteModule,
        AvatarModule,
        ButtonModule,
        DialogModule,
        DropdownModule,
        MenuModule,
        MenubarModule,
        ProgressSpinnerModule,
        RadioButtonModule,
        RippleModule,
        SidebarModule,
        ToastModule,
        SharedModule,
        AuthModule.forRoot({
            // domain: 'sandboxdnabehavior.us.auth0.com',
            // clientId: '8OKIxbavQzvfwEmUwoKkPwGJtc56OS4v',
            domain: environment.auth0Domain,
            clientId: environment.Auth0ClientId,

            skipRedirectCallback: true,
            authorizationParams: {
                redirect_uri: window.location.origin + '/inbound-sso-login',

                // Request this audience at user authentication time
                // audience: 'https://api-sandbox.dnabehavior.com',
                audience: environment.audience,

                // Request this scope at user authentication time
                scope: 'read:current_user',
            },

            // Specify configuration for the interceptor
            // httpInterceptor: {
            //     allowedList: [
            //         {
            //             // Match any request that starts 'https://sandboxdnabehavior.us.auth0.com/api/v2/' (note the asterisk)
            //             uri: 'https://dev-gu7gp2j5cugyns6a.us.auth0.com/api/v2/*',
            //             tokenOptions: {
            //                 authorizationParams: {
            //                     // The attached token should target this audience
            //                     audience: 'https://dev-gu7gp2j5cugyns6a.us.auth0.com/api/v2/',

            //                     // The attached token should have these scopes
            //                     scope: 'read:current_user',
            //                 },
            //             },
            //         },
            //         {
            //             // Match any request that starts 'https://sandboxdnabehavior.us.auth0.com/api/v2/' (note the asterisk)
            //             uri: 'https://api-sandbox.dnabehavior.com/sandbox-private-api-clone/*',
            //             tokenOptions: {
            //                 authorizationParams: {
            //                     // The attached token should target this audience
            //                     audience:
            //                         'https://api-sandbox.dnabehavior.com/sandbox-private-api-clone/Participants/ListParticipantAccountByPersonId/d2548677-3a4f-4530-a8bb-666dd548ef36/1',

            //                     // The attached token should have these scopes
            //                     scope: 'read:current_user',
            //                 },
            //             },
            //         },
            //     ],
            // },
        }),
        MsalModule.forRoot(
            new PublicClientApplication(msalConfig),
            {
                // The routing guard configuration.
                interactionType: InteractionType.Redirect,
                authRequest: {
                    scopes: protectedResources.todoListApi.scopes,
                },
            },
            {
                // MSAL interceptor configuration.
                // The protected resource mapping maps your web API with the corresponding app scopes. If your code needs to call another web API, add the URI mapping here.
                interactionType: InteractionType.Redirect,
                protectedResourceMap: new Map([[protectedResources.todoListApi.endpoint, protectedResources.todoListApi.scopes]]),
            }
        ),
        NgCircleProgressModule.forRoot({
            radius: 74,
            space: -8,
            outerStrokeWidth: 16,
            innerStrokeWidth: 16,
            outerStrokeColor: '#78C000',
            innerStrokeColor: '#C7E596',
            animationDuration: 300,
            titleFontSize: '20',
            titleFontWeight: 'bold',
            imageHeight: 74,
            imageWidth: 74,
        }),
    ],
    providers: [
        ConfirmationService,
        // The only provider of MessageService - PrimengModule used to also provide it, which
        // would have given any lazy feature module a shadowed instance (each lazy NgModule gets
        // its own child injector) disconnected from AppComponent's <p-toast>. That provider was
        // removed from PrimengModule so this root registration is now the single source of truth
        // for MsgService (providedIn: 'root') and anything else injecting MessageService directly.
        MessageService,
        MsalGuard,
        // Registration order matters: each interceptor's next.handle() invokes the next one in
        // this array, so the LAST entry is innermost (closest to the real HTTP call) and the
        // FIRST is outermost. AuthErrorInterceptor is a global error boundary and must sit right
        // after MsalInterceptor (which has to stay first, to attach the auth token) so it
        // uniformly catches errors from every interceptor after it (Loader, Cache), not just the
        // backend call itself.
        { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthErrorInterceptor, multi: true },
        // ApiErrorInterceptor normalizes any failure into an ApiError for everything after
        // AuthErrorInterceptor (Loader, Cache, the backend call itself). It explicitly skips
        // 401s that AuthErrorInterceptor already owns, so logout isn't double-handled.
        { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    ],
    bootstrap: [AppComponent, MsalRedirectComponent],
})
export class AppModule {}
