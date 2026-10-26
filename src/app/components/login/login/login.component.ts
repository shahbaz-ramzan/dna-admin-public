import { Component, OnInit, Inject, OnDestroy, ViewChild, ElementRef, Renderer2 } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalGuard } from '@azure/msal-angular'
import { EventMessage, EventType, InteractionStatus, RedirectRequest } from '@azure/msal-browser'
import { AppService } from 'src/app/service/app.service'
import { Subject } from 'rxjs'
import { filter, takeUntil } from 'rxjs/operators'
import { jwtDecode } from 'jwt-decode'
import K from 'src/app/constants'
import { Store } from '@ngrx/store'
import { getAllAccountsAction, getAllAccountsActionFailure, getAllAccountsActionSuccess } from '../store/login.actions'
import { Actions, ofType } from '@ngrx/effects'
import Encryption from 'src/app/util/Encryption'
import {
    getAccountSubscriptionDetailAction,
    getAccountSubscriptionDetailSuccessAction,
    getSubscriptionNameAction,
    getSubscriptionNameFailureAction,
    getSubscriptionNameSuccessAction,
    getUsersAction,
    successUsersAction,
} from '../../settings/settingsStore/settings.actions'
import { SettingsService } from '../../settings/settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { getParticipantsDetailAction, getParticipantsDetailFailureAction, getParticipantsDetailSuccessAction } from '../../users/main-users/mainUserStore/main-users.actions'
import { AuthService } from '@auth0/auth0-angular'
import { disableWonderchat, getWrongPlaceErrorMessage } from 'src/app/util/utils'

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, ProgressSpinnerModule, LoadingSpinnerComponent],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    providers: [MsalBroadcastService, MsalService, MsalGuard],
})
export class LoginComponent implements OnInit, OnDestroy {
    private readonly _destroying$: Subject<boolean> = new Subject<boolean>()
    currentYear = new Date().getFullYear()
    allAccounts: any[] = []
    loading: boolean
    redirecting = false
    currentElement: any
    errorMessage: any
    user_object: any
    personId: string
    uniqueStyle: string
    userType: string
    accountIds: any = []

    @ViewChild('chatbot') chatbot: ElementRef<HTMLInputElement>

    constructor(
        @Inject(MSAL_GUARD_CONFIG)
        private msalGuardConfig: MsalGuardConfiguration,
        private broadcastService: MsalBroadcastService,
        private authService: MsalService,
        private settingsService: SettingsService,
        private router: Router,
        private store: Store<{ loginReducer: any; settingsReducer: any }>,
        private actions: Actions,
        private msgService: MsgService,
        private appService: AppService,
        private mixpanelService: MixpanelService,
        private rd: Renderer2,
        private auth: AuthService
    ) {
        if (Encryption.decryptData(localStorage.getItem(K.APP.ACCESS_TOKEN) || '')) {
            this.router.navigate([''])
        }
        disableWonderchat()
    }

    ngOnInit(): void {
        // document.getElementById('abc').style.display = 'none'

        this.broadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.HandleRedirect),
                takeUntil(this._destroying$)
            )
            .subscribe(() => {
                this.redirecting = true
            })
        this.broadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.None),
                takeUntil(this._destroying$)
            )
            .subscribe(() => {
                this.redirecting = false
            })

        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntil(this._destroying$))
            .subscribe((store) => {
                // `store.subscriptionNamePayload` is already the unwrapped response body
                // (settings.reducer.ts stores `subscriptionNamePayload?.body`), and there's no
                // `statusCode` field on it anymore - a resolved response is already a real success.
                // This used to never fire at all, so PERMISSION_OBJECT was never written on login -
                // dashboard.component.ts then read it back as `{}` (no permissions), which is why the
                // whole dashboard rendered blank despite every API call succeeding.
                if (store?.subscriptionNamePayload?.data) {
                    const permissions: any = this.settingsService.transformSubscriptionFeatures(store?.subscriptionNamePayload?.data?.subscriptionFeatures)
                    localStorage.setItem(K.APP.PERMISSION_OBJECT, Encryption.encryptData(JSON.stringify(permissions)))
                } else if (store?.subscriptionNamePayload) {
                    // Resolved, but no subscription features to transform - fall back to the
                    // default permission set rather than leaving PERMISSION_OBJECT unset.
                    const permissions: any = K.APP.PERMISSIONS
                    localStorage.setItem(K.APP.PERMISSION_OBJECT, Encryption.encryptData(JSON.stringify(permissions)))
                }
            })
        this.actions.pipe(ofType(getSubscriptionNameSuccessAction), takeUntil(this._destroying$)).subscribe((response) => {
            // Same fix as above: classify on whether real data came back, not a `body.statusCode`
            // field that no longer exists.
            if (response?.subscriptionNamePayload?.body?.data) {
                this.mixpanelService.track('Get Subscription Features Success', {
                    ...this.user_object,
                    subscriptionFeatures: response?.subscriptionNamePayload,
                })
            } else {
                console.log('[Mixpanel test] Get Subscription Features Failed payload:', {
                    ...this.user_object,
                    errorMessage: response,
                })
                this.mixpanelService.track('Get Subscription Features Failed', {
                    ...this.user_object,
                    errorMessage: response,
                })
            }
            this.loading = false
            if (this.currentElement.isOnboardingComplete) {
                this.router.navigate([''])
            } else {
                this.router.navigate(['/on-boarding'])
            }
            return
        })

        this.actions.pipe(ofType(getSubscriptionNameFailureAction), takeUntil(this._destroying$)).subscribe((response) => {
            console.log('[Mixpanel test] Get Subscription Features Failed payload:', {
                ...this.user_object,
                errorMessage: response.error,
            })
            this.mixpanelService.track('Get Subscription Features Failed', {
                ...this.user_object,
                errorMessage: response.error,
            })
        })

        // ApiErrorNotificationEffects already toasts `error` app-wide; a generic login fallback
        // here would only double up, so this handler just terminates the flow.
        this.actions.pipe(ofType(getAllAccountsActionFailure), takeUntil(this._destroying$)).subscribe(({ error }) => {
            this.loading = true
            console.log('[Mixpanel test] Get All Accounts List Failed payload:', {
                ...this.user_object,
                errorMessage: error.message,
                statusCode: error.status,
            })
            this.mixpanelService.track('Get All Accounts List Failed', {
                ...this.user_object,
                errorMessage: error.message,
                statusCode: error.status,
            })
            setTimeout(() => {
                this.loading = false
                this.redirecting = false
                this.appService.logout()
            }, 1000)
        })

        // The effect (login.effects.ts) is the only place that reads the accounts envelope now -
        // this handler works purely off `accounts` / `noAccountsAvailable` and never touches
        // `body.statusCode` itself. See the "Backend response contract" README section.
        this.actions.pipe(ofType(getAllAccountsActionSuccess), takeUntil(this._destroying$)).subscribe(({ accounts, noAccountsAvailable }) => {
            this.loading = true

            if (noAccountsAvailable) {
                this.mixpanelService.track('Participant logged in to Admin System', this.user_object)
                this.loading = false
                this.errorMessage = getWrongPlaceErrorMessage()
                return
            }

            this.allAccounts = accounts ?? []
            // No accounts is not a usable session - and indexing [0] below would throw inside this
            // subscribe, killing it and hanging the spinner for good.
            if (!this.allAccounts?.length) {
                this.loading = false
                this.redirecting = false
                this.errorMessage = getWrongPlaceErrorMessage()
                return
            }

            let isDefaultAccountExists = false
            this.mixpanelService.track('Get All Accounts List Success', {
                ...this.user_object,
                accountsList: this.allAccounts,
            })
            this.allAccounts.forEach((element: any) => {
                if (element.isDefault) {
                    isDefaultAccountExists = true
                    return
                }
            })
            const accountsCopy = JSON.parse(JSON.stringify(this.allAccounts))
            if (!isDefaultAccountExists) {
                accountsCopy[0]['isDefault'] = true
                this.allAccounts = accountsCopy
            }
            this.allAccounts?.forEach((element: any) => {
                this.accountIds.push(element.accountId)
                if (element.isDefault) {
                    this.currentElement = element
                    this.mixpanelService.createProfile({ AccountName: element.accountName, AccountType: 'DNA' })
                    localStorage.setItem(K.APP.ACCOUNT_ID_KEY, Encryption.encryptData(element.accountId.toString()))
                    localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(element)))
                    this.store.dispatch(getParticipantsDetailAction([{ personId: this.personId }], element.accountId))
                }
            })
        })

        this.actions.pipe(ofType(getParticipantsDetailFailureAction), takeUntil(this._destroying$)).subscribe(() => {
            this.loading = false
            this.redirecting = false
            this.msgService.errorMessage(K.APP.GENERIC_LOGIN_ERROR)
        })

        this.actions.pipe(ofType(getParticipantsDetailSuccessAction), takeUntil(this._destroying$)).subscribe(({ response }) => {
            const participantDetail = response?.body?.data?.[0]
            if (!participantDetail) {
                return
            }
            // getParticipantsDetailSuccessAction is a global action type - ANY component in the app
            // that dispatches getParticipantsDetailAction (single-user-selection.component.ts does,
            // for example) fires this subscribe too. Without this check, that unrelated response
            // (for a different person) lands here and gets treated as our own request's data - or,
            // as happened here, as our own request failing when the stray response arrived before
            // ours. That's what caused "We could not load your account information" on the first
            // login click, clearing on a second click once the stray dispatch had already fired.
            // fidelity-login.component.ts has the same collision, guarded there with an
            // `isFidelityLogin` flag on the response instead.
            if (participantDetail.personId !== this.personId) {
                return
            }
            this.uniqueStyle = participantDetail?.uniqueStyle
            if (participantDetail.accountType === 'GoDNA') {
                this.loading = false
                this.errorMessage = getWrongPlaceErrorMessage()
            } else {
                this.store.dispatch(getUsersAction(this.currentElement.accountId, true))
            }
        })

        this.actions.pipe(ofType(successUsersAction), takeUntil(this._destroying$)).subscribe(({ usersPayload }) => {
            if (usersPayload?.body?.data) {
                usersPayload?.body?.data.forEach((user: any) => {
                    if (user.personId === this.personId) {
                        this.userType = user.userRoleType
                        this.mixpanelService.createProfile({
                            $name: this.user_object.fullName,
                            $email: this.user_object.email,
                            PersonId: this.personId,
                            UniqueStyle: this.uniqueStyle,
                            UserType: this.userType,
                            Accounts: this.accountIds,
                            AccountType: 'DNA',
                        })
                        this.mixpanelService.addUser(this.user_object.email)
                    }
                })
            } else {
                this.mixpanelService.createProfile({
                    $name: this.user_object.fullName,
                    $email: this.user_object.email,
                    PersonId: this.personId,
                    UniqueStyle: this.uniqueStyle,
                    UserType: this.userType,
                    Accounts: this.accountIds,
                    AccountType: 'DNA',
                })
                this.mixpanelService.addUser(this.user_object.email)
            }
            this.store.dispatch(getAccountSubscriptionDetailAction(this.currentElement.accountId))
        })

        this.actions.pipe(ofType(getAccountSubscriptionDetailSuccessAction), takeUntil(this._destroying$)).subscribe(() => {
            this.store.dispatch(getSubscriptionNameAction(this.currentElement.accountId))
        })

        this.store
            .select((state) => state.loginReducer)
            .pipe(takeUntil(this._destroying$))
            .subscribe((store) => {
                this.loading = store?.getAccountsLoading
            })

        this.broadcastService.msalSubject$
            .pipe(
                filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
                takeUntil(this._destroying$)
            )
            .subscribe((response: any) => {
            const tokenInfo = this.getDecodedAccessToken(response?.payload?.accessToken)
            this.personId = tokenInfo.oid
            const user_object: any = {
                fisrtName: tokenInfo.given_name,
                lastName: tokenInfo.family_name,
                fullName: tokenInfo.name,
                personId: tokenInfo.oid,
                email: tokenInfo.emails ? tokenInfo.emails[0] : 'noEmailFound',
            }
            this.user_object = user_object
            localStorage.setItem('isFidelityUser', 'false')

            this.mixpanelService.addUser(tokenInfo.emails ? tokenInfo.emails[0] : 'noEmailFound')
            this.mixpanelService.track('User Logged In', user_object)

            localStorage.setItem(K.APP.LOGGED_IN_PERSON_ID, Encryption.encryptData(tokenInfo.oid))
            localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify(user_object)))
            localStorage.setItem(K.APP.ACCESS_TOKEN, Encryption.encryptData(response?.payload?.accessToken))
            setTimeout(() => {
                this.redirecting = true
                this.store.dispatch(getAllAccountsAction(tokenInfo.oid))
            }, 100)
        })
    }

    getDecodedAccessToken(token: string): any {
        try {
            return jwtDecode(token)
        } catch (Error) {
            return null
        }
    }

    login() {
        // this.auth.loginWithRedirect()

        this.mixpanelService.track('Login Button clicked ')
        this.loading = true
        setTimeout(() => {
            this.loading = false
        }, 2000)
        if (this.msalGuardConfig.authRequest) {
            this.authService.loginRedirect({
                ...this.msalGuardConfig.authRequest,
            } as RedirectRequest)
        } else {
            this.authService.loginRedirect()
        }
        // this.router.navigate(['on-boarding'])
    }

    logout() {
        this.errorMessage = null
        this.appService.logout()
    }

    ngOnDestroy() {
        this._destroying$.next(true)
        this._destroying$.unsubscribe()
    }
}
