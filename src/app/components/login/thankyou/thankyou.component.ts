import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { MsalBroadcastService, MsalGuardConfiguration, MsalService, MSAL_GUARD_CONFIG } from '@azure/msal-angular'
import { EventMessage, EventType, InteractionStatus, RedirectRequest } from '@azure/msal-browser'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { jwtDecode } from 'jwt-decode'
import { Subject } from 'rxjs'
import { filter, takeUntil } from 'rxjs/operators'
import K from 'src/app/constants'
import { AppService } from 'src/app/service/app.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { SettingsService } from '../../settings/settings.service'
import {
    getSubscriptionNameAction,
    getSubscriptionNameFailureAction,
    getSubscriptionNameSuccessAction,
    getUsersAction,
    successUsersAction,
} from '../../settings/settingsStore/settings.actions'
import { getParticipantsDetailAction, getParticipantsDetailFailureAction, getParticipantsDetailSuccessAction } from '../../users/main-users/mainUserStore/main-users.actions'
import { getAllAccountsAction, getAllAccountsActionFailure, getAllAccountsActionSuccess } from '../store/login.actions'
import { disableWonderchat, getWrongPlaceErrorMessage } from 'src/app/util/utils'
@Component({
    selector: 'app-thankyou',
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule, LoadingSpinnerComponent],
    templateUrl: './thankyou.component.html',
    styleUrls: ['./thankyou.component.scss'],
})
export class ThankyouComponent implements OnInit, OnDestroy {
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
        private mixpanelService: MixpanelService
    ) {
        if (Encryption.decryptData(localStorage.getItem(K.APP.ACCESS_TOKEN))) {
            this.router.navigate([''])
        }
        disableWonderchat()
    }

    ngOnInit(): void {
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
                // Same fix as login.component.ts: `store.subscriptionNamePayload` is already the
                // unwrapped body, and there's no `statusCode` field on it anymore - this used to
                // never fire, so PERMISSION_OBJECT was never written and the dashboard rendered
                // blank despite every API call succeeding.
                if (store?.subscriptionNamePayload?.data) {
                    const permissions: any = this.settingsService.transformSubscriptionFeatures(store?.subscriptionNamePayload?.data?.subscriptionFeatures)
                    localStorage.setItem(K.APP.PERMISSION_OBJECT, Encryption.encryptData(JSON.stringify(permissions)))
                } else if (store?.subscriptionNamePayload) {
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
                    errorMessage: response?.subscriptionNamePayload,
                })
                this.mixpanelService.track('Get Subscription Features Failed', {
                    ...this.user_object,
                    errorMessage: response?.subscriptionNamePayload,
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

        // getAllAccountsActionFailure carries notify: true, so ApiErrorNotificationEffects already
        // toasts error.message - a manual call here would double-toast.
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

        // login.effects.ts's getAllAccountsByPersonId interprets the accounts envelope once and
        // dispatches `accounts` / `noAccountsAvailable` - this handler never touches
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
                this.errorMessage = getWrongPlaceErrorMessage()
                return
            }

            this.mixpanelService.track('Get All Accounts List Success', { ...this.user_object, accountsList: this.allAccounts })
            let isDefaultAccountExists = false
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
                    this.mixpanelService.createProfile({ AccountName: element.accountName })
                    localStorage.setItem(K.APP.ACCOUNT_ID_KEY, Encryption.encryptData(element.accountId.toString()))
                    localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(element)))
                    this.store.dispatch(getParticipantsDetailAction([{ personId: this.personId }], element.accountId))
                }
            })
        })

        this.actions.pipe(ofType(getParticipantsDetailFailureAction), takeUntil(this._destroying$)).subscribe(() => {
            this.loading = false
            this.msgService.errorMessage(K.APP.GENERIC_LOGIN_ERROR)
        })

        this.actions.pipe(ofType(getParticipantsDetailSuccessAction), takeUntil(this._destroying$)).subscribe(({ response }) => {
            const participantDetail = response?.body?.data?.[0]
            if (!participantDetail) {
                return
            }
            // getParticipantsDetailSuccessAction is a global action type - ANY component in the app
            // that dispatches getParticipantsDetailAction fires this subscribe too, so a response for
            // a different person must be ignored rather than treated as our own. See the matching
            // comment in login.component.ts for the full explanation.
            if (participantDetail.personId !== this.personId) {
                return
            }
            this.uniqueStyle = participantDetail?.uniqueStyle
            this.store.dispatch(getUsersAction(this.currentElement.accountId, true))
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
                })
                this.mixpanelService.addUser(this.user_object.email)
            }
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
