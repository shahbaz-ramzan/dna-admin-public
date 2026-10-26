import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { AuthService } from '@auth0/auth0-angular'
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular'
import { EventMessage, EventType, RedirectRequest } from '@azure/msal-browser'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { of, Subject } from 'rxjs'
import { catchError, filter, takeUntil } from 'rxjs/operators'
import K from 'src/app/constants'
import { jwtDecode } from 'jwt-decode'

import Encryption from 'src/app/util/Encryption'
import {
    checkIdpUserAction,
    checkIdpUserActionSuccess,
    getAllAccountsAction,
    getAllAccountsActionFailure,
    getAllAccountsActionSuccess,
    getIdpUserAction,
    getIdpUserActionSuccess,
    upsertIdpAction,
    upsertIdpActionSuccess,
} from '../login/store/login.actions'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { getParticipantsDetailAction, getParticipantsDetailSuccessAction } from '../users/main-users/mainUserStore/main-users.actions'
import { MsgService } from 'src/app/service/msg.service'
import { AppService } from 'src/app/service/app.service'
import {
    getSubscriptionNameAction,
    getSubscriptionNameFailureAction,
    getSubscriptionNameSuccessAction,
    getUsersAction,
    successUsersAction,
} from '../settings/settingsStore/settings.actions'
import { Router } from '@angular/router'
import { SettingsService } from '../settings/settings.service'
import { getWrongPlaceErrorMessage } from 'src/app/util/utils'

@Component({
    selector: 'app-fidelity-login',
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule],
    templateUrl: './fidelity-login.component.html',
    styleUrls: ['./fidelity-login.component.scss'],
})
export class FidelityLoginComponent implements OnInit {
    @ViewChild('mappingButton') mappingButton: ElementRef<HTMLButtonElement>
    userObj: any
    private readonly _destroying$: Subject<boolean> = new Subject<boolean>()
    opaqueId: string
    allAccounts: any[] = []
    loading: boolean
    currentElement: any
    errorMessage: any
    user_object: any
    personId: string
    uniqueStyle: string
    userType: string
    accountIds: any = []
    interacting = false
    isRedirecting = false
    redirectingMessage: string
    showTryAgainBtn = false
    showMappingButton = false
    arePopupsAllowed = false

    constructor(
        @Inject(MSAL_GUARD_CONFIG)
        private msalGuardConfig: MsalGuardConfiguration,
        private broadcastService: MsalBroadcastService,
        private authService: MsalService,
        public auth0: AuthService,
        private actions: Actions,
        private store: Store<{ loginReducer: any; settingsReducer: any }>,
        private mixpanelService: MixpanelService,
        private msgService: MsgService,
        private appService: AppService,
        private router: Router,
        private settingsService: SettingsService
    ) {
        // if (Encryption.decryptData(localStorage.getItem(K.APP.ACCESS_TOKEN) || '')) {
        //     this.router.navigate([''])
        // }
    }

    ngOnInit(): void {
        this.isRedirecting = true
        this.checkPopupStatus()

        if (this.arePopupsAllowed) {
            if (!this.interacting) {
                this.redirectingMessage = 'Authenticating...'
                this.auth0
                    .getAccessTokenSilently()
                    .pipe(
                        catchError(() => {
                            this.auth0.loginWithPopup()
                            return of(null)
                        })
                    )
                    .subscribe(() => {
                        this.isRedirecting = false
                    })
            }

            // const fullId = document.getElementById('wonderchat-wrapper') as HTMLElement
            // fullId.style.display = 'none'

            this.auth0.idTokenClaims$.subscribe((value) => {
                // console.log('auth0.idTokenClaims', value)
                if (value?.__raw) {
                    console.log('value: ', value)
                    localStorage.setItem(K.APP.ACCESS_TOKEN, Encryption.encryptData(value.__raw))
                    this.opaqueId = value.oid
                    localStorage.setItem(K.APP.OPAQUE_ID, value.oid)
                    localStorage.setItem('isFidelityUser', 'true')
                    this.showMappingButton = true

                    // const isMappingId = localStorage.getItem('mapping-id')
                    this.mapMyID()
                    // if (!isMappingId) {
                    // }
                }
            })

            // login.effects.ts's checkIdpUser interprets the envelope once - this handler gets
            // `data` (never `body.statusCode`) or `error`. A failure here used to have no `else` at
            // all, leaving the screen stuck with no feedback - the same bug class as the accounts call.
            this.actions.pipe(ofType(checkIdpUserActionSuccess), takeUntil(this._destroying$)).subscribe(({ data, error }) => {
                if (error) {
                    this.redirectingMessage = error.message
                    this.showTryAgainBtn = true
                    return
                }

                this.redirectingMessage = 'Checking connection...'
                if (!data) {
                    localStorage.setItem('interacting', this.interacting.toString())
                    if (!this.interacting) {
                        this.interacting = true
                        if (this.msalGuardConfig.authRequest) {
                            localStorage.setItem('authenticated', 'true')
                            this.authService.loginRedirect({
                                ...this.msalGuardConfig.authRequest,
                                redirectUri: '/inbound-sso-login',
                            } as RedirectRequest)
                        } else {
                            this.authService.loginRedirect({ redirectUri: '/inbound-sso-login' } as RedirectRequest)
                        }
                    }
                } else {
                    this.store.dispatch(getIdpUserAction(localStorage.getItem(K.APP.OPAQUE_ID)))
                }
            })

            this.broadcastService.msalSubject$.pipe(filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS)).subscribe((response: any) => {
                this.showMappingButton = false
                const tokenInfo = this.getDecodedAccessToken(response?.payload?.accessToken)
                console.log('LOGIN SUCCESS', tokenInfo)
                const payload = {
                    id: 0,
                    opaqueId: localStorage.getItem(K.APP.OPAQUE_ID),
                    userId: tokenInfo.oid,
                    isMappedToOriginal: true,
                }
                this.store.dispatch(upsertIdpAction(payload))
            })

            this.broadcastService.msalSubject$
                .pipe(filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS))
                .subscribe((response: any) => {
                    // console.log('ACQUIRE TOKEN SUCCESS')
                    this.showMappingButton = false
                    const tokenInfo = this.getDecodedAccessToken(response?.payload?.accessToken)
                    // this.interacting = false
                    const payload = {
                        id: 0,
                        opaqueId: localStorage.getItem(K.APP.OPAQUE_ID),
                        userId: tokenInfo.oid,
                        isMappedToOriginal: true,
                    }
                    this.store.dispatch(upsertIdpAction(payload))
                })

            // this.broadcastService.msalSubject$.subscribe((res) => {
            //     console.log('broadcasting: ', res)
            // })

            this.broadcastService.msalSubject$.pipe(filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_FAILURE)).subscribe(() => {
                this.redirectingMessage = 'Authentication failed!'
                this.showTryAgainBtn = true
            })

            // Same pattern: `success`/`error`, never `body.statusCode`. Previously a failure here
            // had no `else`, so mapping a Fidelity identity could silently go nowhere.
            this.actions.pipe(ofType(upsertIdpActionSuccess), takeUntil(this._destroying$)).subscribe(({ success, error }) => {
                if (error) {
                    this.redirectingMessage = error.message
                    this.showTryAgainBtn = true
                    return
                }
                if (success) {
                    this.store.dispatch(checkIdpUserAction(localStorage.getItem(K.APP.OPAQUE_ID)))
                }
            })

            // Same pattern: `data`/`error`, never `body.statusCode`. Previously a failure here had
            // no `else`, so the flow just stalled with nothing on screen.
            this.actions.pipe(ofType(getIdpUserActionSuccess), takeUntil(this._destroying$)).subscribe(({ data, error }) => {
                if (error) {
                    this.redirectingMessage = error.message
                    this.showTryAgainBtn = true
                    return
                }
                this.personId = data?.userId
                localStorage.setItem(K.APP.LOGGED_IN_PERSON_ID, Encryption.encryptData(this.personId))
                localStorage.setItem('isLoggedIn', 'true')
                this.store.dispatch(getAllAccountsAction(this.personId))
            })

            // getAllAccountsActionFailure carries notify: true, so ApiErrorNotificationEffects
            // already toasts error.message - a manual call here would double-toast.
            this.actions.pipe(ofType(getAllAccountsActionFailure), takeUntil(this._destroying$)).subscribe(({ error }) => {
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
                    this.isRedirecting = false
                    this.appService.logout()
                    this.redirectingMessage = 'Fetching Account Information...'
                }, 1000)
            })

            // login.effects.ts's getAllAccountsByPersonId interprets the accounts envelope once and
            // dispatches `accounts` / `noAccountsAvailable` - this handler never touches
            // `body.statusCode` itself. See the "Backend response contract" README section.
            this.actions.pipe(ofType(getAllAccountsActionSuccess), takeUntil(this._destroying$)).subscribe(({ accounts, noAccountsAvailable }) => {
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
                    this.isRedirecting = false
                    this.errorMessage = getWrongPlaceErrorMessage()
                    return
                }

                this.redirectingMessage = 'Fetching Account Information...'
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
                        this.mixpanelService.createProfile({ AccountName: element.accountName, AccountType: 'FidelitySSO' })
                        localStorage.setItem(K.APP.ACCOUNT_ID_KEY, Encryption.encryptData(element.accountId.toString()))
                        localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(element)))
                        this.store.dispatch(getParticipantsDetailAction([{ personId: this.personId }], element.accountId, true))
                    }
                })
            })
            this.actions.pipe(ofType(getParticipantsDetailSuccessAction), takeUntil(this._destroying$)).subscribe(({ response }) => {
                /**
                 * this check here is crucial to avoid execution of success action of 'getParticipantDetail' reducer dispatched from other components.
                 * Example: 'getParticipantDetail' reducer dispatched from 'single-user-selection.component.ts' is also executing here causing bugs in UI.
                 */
                if (response?.isFidelityLogin) {
                    const participantDetail = response?.body?.data[0]
                    this.uniqueStyle = participantDetail?.uniqueStyle

                    const user_object: any = {
                        fisrtName: participantDetail?.firstName,
                        lastName: participantDetail?.lastName,
                        fullName: participantDetail?.firstName + ' ' + participantDetail?.lastName,
                        personId: participantDetail?.personId,
                        email: participantDetail?.email,
                    }
                    this.user_object = user_object
                    localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify(user_object)))

                    this.store.dispatch(getUsersAction(this.currentElement.accountId, true, true))
                }
            })

            this.actions.pipe(ofType(successUsersAction), takeUntil(this._destroying$)).subscribe(({ usersPayload }) => {
                if (usersPayload?.isFidelityLogin) {
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
                                    AccountType: 'FidelitySSO',
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
                            AccountType: 'FidelitySSO',
                        })
                        this.mixpanelService.addUser(this.user_object.email)
                    }
                    this.store.dispatch(getSubscriptionNameAction(this.currentElement.accountId, true))
                }
            })

            this.actions.pipe(ofType(getSubscriptionNameSuccessAction), takeUntil(this._destroying$)).subscribe((response) => {
                if (response?.subscriptionNamePayload?.isFidelityLogin) {
                    // Same fix as elsewhere: classify on whether real data came back, not a
                    // `body.statusCode` field that no longer exists.
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
                        this.router.navigateByUrl('', { replaceUrl: true })
                    } else {
                        this.router.navigateByUrl('/on-boarding', { replaceUrl: true })
                    }

                    return
                }
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

            this.store
                .select((state) => state.settingsReducer)
                .subscribe((store) => {
                    // Same fix as login.component.ts: `store.subscriptionNamePayload` is already
                    // the unwrapped body, and there's no `statusCode` field on it anymore - this
                    // used to never fire, so PERMISSION_OBJECT was never written and the dashboard
                    // rendered blank despite every API call succeeding.
                    if (store?.subscriptionNamePayload?.data) {
                        const permissions: any = this.settingsService.transformSubscriptionFeatures(
                            store?.subscriptionNamePayload?.data?.subscriptionFeatures
                        )
                        localStorage.setItem(K.APP.PERMISSION_OBJECT, Encryption.encryptData(JSON.stringify(permissions)))
                    } else if (store?.subscriptionNamePayload) {
                        const permissions: any = K.APP.PERMISSIONS
                        localStorage.setItem(K.APP.PERMISSION_OBJECT, Encryption.encryptData(JSON.stringify(permissions)))
                    }
                })
        } else {
            this.redirectingMessage = 'Popups are blocked! Please enable popups to continue authentication.'
            this.showTryAgainBtn = true
        }
    }

    checkPopupStatus(): boolean {
        const popup = window.open()
        popup?.close()

        this.arePopupsAllowed = !!popup
        this.showTryAgainBtn = !this.arePopupsAllowed
        return !!popup
    }

    getDecodedAccessToken(token: string): any {
        try {
            return jwtDecode(token)
        } catch (Error) {
            return null
        }
    }

    login(): void {
        this.auth0.loginWithRedirect()
    }

    loginToB2c() {
        this.authService.loginRedirect()
    }

    mapMyID(): void {
        this.redirectingMessage = 'Fetching Account Information...'
        this.isRedirecting = true
        localStorage.setItem('mapping-id', 'true')
        this.store.dispatch(checkIdpUserAction(this.opaqueId))
    }

    reloadWindow(): void {
        window.location.reload()
    }
}
