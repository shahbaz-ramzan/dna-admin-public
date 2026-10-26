import { AfterViewInit, Component, DestroyRef, ElementRef, NgZone, OnInit, ViewChild, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { MsalService } from '@azure/msal-angular'
import { DropdownModule } from 'primeng/dropdown'
import { MenubarModule } from 'primeng/menubar'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { ButtonModule } from 'primeng/button'
import { RippleModule } from 'primeng/ripple'
import { MenuModule } from 'primeng/menu'
import { AvatarModule } from 'primeng/avatar'
import { SidebarModule } from 'primeng/sidebar'
import { DialogModule } from 'primeng/dialog'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { NavBarTourModalComponent } from './nav-bar-tour-modal/nav-bar-tour-modal.component'
import { Store } from '@ngrx/store'
import { MenuItem, SelectItem } from 'primeng/api'
import K from 'src/app/constants'
import { getAccountColorAction, getAllAccountsAction, getAllAccountsActionFailure, getAllAccountsActionSuccess } from '../../dashboard/dashboard.actions'
import {
    editAccountDetailSuccessAction,
    editProfileSuccessAction,
    getAccountSubscriptionDetailAction,
    getAccountSubscriptionDetailSuccessAction,
    getAccountSubscriptionDetailFailureAction,
    getDefaultToggleAction,
    getDefaultToggleActionSuccess,
    getProfilePictureAction,
    getSubscriptionNameAction,
    getSubscriptionNameSuccessAction,
    getUserRoleAction,
    successProfilePictureAction,
    SuccessUploadAccountLogo,
    SuccessUploadProfilePicture,
} from '../../settings/settingsStore/settings.actions'
import { Actions, ofType } from '@ngrx/effects'
import * as Chart from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Subject } from 'rxjs'
import { filter } from 'rxjs/operators'
import { AppService } from 'src/app/service/app.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import Encryption from 'src/app/util/Encryption'
import { environment } from 'src/environments/environment'
import { SettingsService } from '../../settings/settings.service'
import { searchMultipleAccountsAction } from '../../users/main-users/mainUserStore/main-users.actions'
import { ShepherdService } from 'angular-shepherd'
import { triggerAppWalkthroughAction } from '../../tour/tour.actions'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

interface City {
    name: string
    code: string
}

// Page top padding below the fixed header - see NavBarComponent.updatePagePadding().
const DESKTOP_HEADER_HEIGHT_PX = 68
const PAGE_GAP_BELOW_HEADER_PX = 28
const BANNER_OFFSET_PX = 20

@Component({
    selector: 'app-nav-bar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DropdownModule,
        MenubarModule,
        AutoCompleteModule,
        ButtonModule,
        RippleModule,
        MenuModule,
        AvatarModule,
        SidebarModule,
        DialogModule,
        LoadingSpinnerComponent,
        NavBarTourModalComponent,
    ],
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit, AfterViewInit {
    private destroyRef = inject(DestroyRef)
    image: any
    accountId: any
    user_object: any
    personId: string
    accountIdArray: any[] = []
    cities: City[] = []
    allAccountsLoading: boolean
    items: SelectItem[] = []
    item = ''
    bitems: SelectItem[] = []
    items1: MenuItem[] = []
    items2: MenuItem[] = []
    brand: MenuItem[] = []
    notify: MenuItem[] = []
    userName = ''
    allAccounts: any[] = []
    isAccountSubscriptionLoading = false
    users: any[] = [{ name: 'Abbott' }, { name: 'Donnie' }, { name: 'Jones' }, { name: 'John' }, { name: 'Adam' }]
    selectedUser: any
    filteredUsers: any[]
    selectedUsers: any[]
    coBrandLogo: any
    helpBar = false
    displayChatbotModal = false
    isBannerVisible = false
    // The fixed header - measured to size the page's top padding (--page-padding-top), see
    // updatePagePadding().
    @ViewChild('headerContainer') private headerContainer?: ElementRef<HTMLElement>
    private ngZone = inject(NgZone)
    private lastPagePadding = ''
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }
    permissionObject: any = {}
    currentElement: any
    query = ''
    errorMessage: any = null
    selectedPersons = ''
    selectedAccountId: any
    selectedAccount: any
    isLoading = true
    subscriptionData: any = null
    // showNavBarSpinner = true

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private appService: AppService,
        private authService: MsalService,
        private settingService: SettingsService,
        public store: Store<{ dashboardReducer: any; settingsReducer: any; tourReducer: any }>,
        private actions: Actions,
        private mixpanelService: MixpanelService,
        private shepherdService: ShepherdService
    ) {
        // if (!Encryption.decryptData(localStorage.getItem(K.APP.ACCESS_TOKEN) || '')) {
        //     this.router.navigate(['/login'])
        // }
        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (this.user_object) {
            this.user_object = JSON.parse(this.user_object)
        }

        this.personId = this.user_object.personId
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')

        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) this.permissionObject = JSON.parse(this.permissionObject)

        let accountObj: any = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')
        if (accountObj) {
            accountObj = JSON.parse(accountObj)
        }

        if (accountObj && accountObj.isDefault && !accountObj.isOnboardingComplete) {
            this.router.navigate(['/on-boarding'])
        }
    }

    ngOnInit(): void {
        // Chart.plugins.register(ChartDataLabels)
        Chart.registry.plugins.register(ChartDataLabels)
        this.systemLabels = this.settingService.parseSystemLabels()

        // Tour-ID extraction from this same tourReducer slice now lives in NavBarTourModalComponent
        // (see APPLICATION_ROADMAP.md Epic 3); this subscription stays here only for
        // updatePagePadding(), which is unrelated to tours but was piggybacking on this same
        // stream. Kept as its own subscription rather than moved, to avoid changing what triggers
        // a page-padding recalculation.
        this.store
            .select((state) => state.tourReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.updatePagePadding()
            })

        let accObj: any = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')
        this.actions.pipe(ofType(getAccountSubscriptionDetailFailureAction), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            this.subscriptionData = undefined
            console.log('[Mixpanel test] Get Account Subscription Details Failed payload:', {
                ...this.user_object,
                ...accObj,
                errorMessage: response.error,
            })
            this.mixpanelService.track('Get Account Subscription Details Failed', {
                ...this.user_object,
                ...accObj,
                errorMessage: response.error,
            })
        })

        this.actions.pipe(ofType(getAccountSubscriptionDetailSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            const subsData = response?.response?.body?.data
            this.subscriptionData = subsData
            if (!subsData) {
                return
            }

            this.mixpanelService.track('Get Account Subscription Details Success', {
                ...this.user_object,
                ...accObj,
                subscriptionData: subsData,
            })
            this.mixpanelService.createProfile({
                NamedUserSeats: response?.response?.body?.data?.namedUserSeat + 1,
                StaffUserSeats: response?.response?.body?.data?.staffUserSeat,
            })

            if (subsData?.subscriptionState) {
                localStorage.setItem('subscriptionStatus', 'active')
                //Subscription is active
                this.store.dispatch(getSubscriptionNameAction(this.accountId))
                this.store.dispatch(getDefaultToggleAction(this.personId, this.accountId))
            } else {
                localStorage.setItem('subscriptionStatus', 'inactive')
                //Subscription is not active
                this.errorMessage = `<p>This account, Account #:${this.accountId}, does not have an active subscription.</p>`
            }
        })

        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.subscriptionNamePayload?.data) {
                    const permissions: any = this.settingService.transformSubscriptionFeatures(store?.subscriptionNamePayload?.data?.subscriptionFeatures)
                    localStorage.setItem(K.APP.PERMISSION_OBJECT, Encryption.encryptData(JSON.stringify(permissions)))
                    this.permissionObject = permissions
                }
            })
        if (accObj) {
            accObj = JSON.parse(accObj)
        }
        if (accObj?.cobrandingLogoPath) {
            this.coBrandLogo = accObj.cobrandingLogoPath
        } else {
            this.coBrandLogo = `../../../../assets/images/logo.svg`
        }

        this.store
            .select((state) => state.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response?.accountColorPayload?.data?.primaryColor) {
                    document.documentElement.style.setProperty(`--primary-color`, response?.accountColorPayload?.data?.primaryColor)
                    document.documentElement.style.setProperty(`--secondary-color`, response?.accountColorPayload?.data?.secondaryColor)
                    localStorage.setItem('primaryColor', response?.accountColorPayload?.data?.primaryColor)
                    localStorage.setItem('secondaryColor', response?.accountColorPayload?.data?.secondaryColor)
                    if (response?.accountColorPayload?.data?.secondaryColor != K.APP.DEFAULT_SECONDARY_COLOR) {
                        document.documentElement.style.setProperty(`--secondary-color`, response?.accountColorPayload?.data?.secondaryColor)
                        document.documentElement.style.setProperty(`--secondary-color2`, response?.accountColorPayload?.data?.secondaryColor)
                        localStorage.setItem('secondaryColor2', response?.accountColorPayload?.data?.secondaryColor)
                    } else {
                        document.documentElement.style.setProperty(`--secondary-color`, K.APP.DEFAULT_SECONDARY_COLOR)
                        document.documentElement.style.setProperty(`--secondary-color2`, K.APP.DEFAULT_SECONDARY_COLOR2)
                        localStorage.setItem('secondaryColor2', K.APP.DEFAULT_SECONDARY_COLOR2)
                    }
                }
            })

        let retrievedUserInfo: any = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')

        let userInfo: any
        if (retrievedUserInfo) {
            userInfo = JSON.parse(retrievedUserInfo)
        }
        this.userName = userInfo?.fullName || ''

        this.actions.pipe(ofType(editAccountDetailSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.store.dispatch(getAllAccountsAction(this.personId))
        })
        this.actions.pipe(ofType(successProfilePictureAction), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            this.image = response?.profilePicturePayload?.body?.data ? response?.profilePicturePayload?.body?.data : '../../../../../assets/images/profile.svg'
        })
        this.actions.pipe(ofType(SuccessUploadProfilePicture), takeUntilDestroyed(this.destroyRef)).subscribe((uploadProfilePayload) => {
            this.image = null
            setTimeout(() => {
                this.image = uploadProfilePayload?.uploadProfilePayload?.body?.data
                    ? uploadProfilePayload?.uploadProfilePayload?.body?.data
                    : '../../../../../assets/images/profile.svg'
            }, 100)
        })

        this.actions.pipe(ofType(editProfileSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            setTimeout(() => {
                retrievedUserInfo = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')

                userInfo = JSON.parse(retrievedUserInfo)
                this.userName = userInfo.fullName || ''
            }, 100)
        })

        this.actions.pipe(ofType(SuccessUploadAccountLogo), takeUntilDestroyed(this.destroyRef)).subscribe(({ accountLogoPayload }) => {
            this.coBrandLogo = null
            setTimeout(() => {
                this.coBrandLogo = accountLogoPayload?.body?.data
            }, 100)
            this.store.dispatch(getAllAccountsAction(this.personId))
        })

        this.actions.pipe(ofType(getSubscriptionNameSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.subscriptionNamePayload?.body?.data) {
                localStorage.setItem(K.APP.SUBSCRIPTION_NAME, Encryption.encryptData(response.subscriptionNamePayload.body.data['productHandle']))
                this.mixpanelService.track('Get Subscription Features Success', {
                    ...this.user_object,
                    subscriptionFeatures: response.subscriptionNamePayload.body.data,
                })
                this.mixpanelService.createProfile({
                    SubscriptionName: response.subscriptionNamePayload.body.data['packageName'],
                })
            }
            if (this.currentElement) {
                if (!this.currentElement?.isOnboardingComplete) {
                    this.router.navigate(['/on-boarding'])
                } else this.router.navigate(['/k'])
                return
            }
        })

        this.actions.pipe(ofType(getDefaultToggleActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.getDefaultToggleResponse?.body?.data) {
                localStorage.setItem(K.APP.DEFAULT_IS_FDNA, Encryption.encryptData(response.getDefaultToggleResponse.body.data.isFDNA.toString()))
                this.mixpanelService.track('Get Default Toggle Success', {
                    ...this.user_object,
                    isFDNA: response.getDefaultToggleResponse.body.data,
                })
            }
        })

        this.actions.pipe(ofType(getAllAccountsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.allAccountsPayload) {
                this.isLoading = false
                // `?? []` so a 204/error-shaped payload can't leave this undefined - the template
                // binds `allAccounts.length` unguarded.
                this.allAccounts = response.allAccountsPayload?.body?.data?.namedUserAccountDtos ?? []
                this.mixpanelService.track('Get All Accounts List Success', { ...this.user_object, allAccounts: this.allAccounts })
                let isDefaultAccountExists = false
                this.allAccounts?.forEach((element: any) => {
                    if (element.isDefault) {
                        isDefaultAccountExists = true
                        return
                    }
                })
                if (this.allAccounts?.length) {
                    const accountsCopy = JSON.parse(JSON.stringify(this.allAccounts))

                    if (!isDefaultAccountExists) {
                        accountsCopy[0]['isDefault'] = true
                        this.allAccounts = accountsCopy
                    }
                }

                this.allAccounts?.forEach((element: any) => {
                    if (element.isDefault && !Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')) {
                        this.currentElement = element
                        this.selectedAccount = { ...element }
                        this.mixpanelService.createProfile({ AccountName: element.accountName })
                        localStorage.setItem(K.APP.ACCOUNT_ID_KEY, Encryption.encryptData(element.accountId.toString()))
                        localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(element)))
                        if (element?.cobrandingLogoPath) {
                            this.coBrandLogo = element.cobrandingLogoPath
                        } else {
                            this.coBrandLogo = `../../../../assets/images/logo.svg`
                        }
                        if (!element.isOnboardingComplete) {
                            this.router.navigate(['/on-boarding'])
                        }
                    }
                })
                this.brand = []
                this.accountIdArray = []
                const allAccountsCopy = this.allAccounts?.length ? [...this.allAccounts] : []
                allAccountsCopy?.sort((a, b) => {
                    const nameA = a.accountName.toUpperCase()
                    const nameB = b.accountName.toUpperCase()

                    if (nameA < nameB) {
                        return -1 // a should come before b
                    }
                    if (nameA > nameB) {
                        return 1 // a should come after b
                    }

                    return 0 // names are equal
                })
                this.allAccounts = allAccountsCopy

                this.allAccounts?.forEach((element: any) => {
                    if (element?.accountName != undefined) {
                        this.accountIdArray.push({
                            account: element?.accountId,
                        })

                        if (element?.accountId == Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')) {
                            this.selectedAccount = { ...element }
                        }
                    }
                })
            }
        })

        this.actions.pipe(ofType(getAllAccountsActionFailure), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            console.log('[Mixpanel test] Get All Accounts List Failed payload:', {
                ...this.user_object,
                errorMessage: response.error,
            })
            this.mixpanelService.track('Get All Accounts List Failed', {
                ...this.user_object,
                errorMessage: response.error,
            })
        })

        this.store
            .select((state) => state.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                // `getAllAccountsLoading` is what dashboard.reducer.ts actually sets - this read
                // was `response?.allAccountsLoading`, a field that has never existed on the slice, so
                // the flag was permanently undefined.
                this.allAccountsLoading = response?.getAllAccountsLoading
            })

        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((currentParams) => {
            const params = { ...currentParams }
            this.selectedPersons = params['selectedParticipants']
            this.selectedAccountId = params['accountId']
        })

        this.buildNavItems()
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {
                this.buildNavItems()
            })

        this.items = []
        for (let i = 0; i < 10000; i++) {
            this.items.push({ label: 'Item ' + i, value: 'Item ' + i })
        }

        this.cities = [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
        ]

        this.items2 = [
            {
                label: 'Profile',
                command: () => {
                    this.router.navigate(['/settings/profile'])
                },
            },
            {
                label: 'Logout',
                command: () => {
                    this.mixpanelService.track('Logout button clicked')
                    localStorage.clear()
                    this.authService.logoutRedirect({
                        postLogoutRedirectUri: `${environment.hosting_url}login`,
                    })
                },
            },
        ]

        this.notify = [
            {
                label:
                    '<div class="d-flex align-items-center"><img src="../../../../assets/images/user-thumbnail.png" />' +
                    '<div class="notify-cnt">' +
                    '<h5>John Travolta</h5><P class="mb-0 d-flex justify-content-between">Recent Activity<span>2 min</span></P></div>' +
                    '</div>',
                escape: false,
            },
            {
                label:
                    '<div class="d-flex align-items-center"><img src="../../../../assets/images/user-thumbnail.png" />' +
                    '<div class="notify-cnt">' +
                    '<h5>John Travolta</h5><P class="mb-0 d-flex justify-content-between">Recent Activity<span>2 min</span></P></div>' +
                    '</div>',
                escape: false,
            },
        ]
        // settings.effects.ts's editAccount effect merges the (partial) response onto the stored
        // account object and re-persists it in a tap() that runs before this success action is
        // mapped/dispatched, so localStorage is already up to date by the time this subscriber runs -
        // no setTimeout guess needed to "wait for" account.component.ts's own write to land.
        this.actions.pipe(ofType(editAccountDetailSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.data) return
            this.systemLabels = this.settingService.parseSystemLabels()
            const updatedLabelItem = {
                ...this.items1[1],
                label: this.systemLabels.participantLabelName + 's',
            }
            const tempItems = [...this.items1]
            tempItems[1] = updatedLabelItem
            this.items1 = [...tempItems]
        })

        // Every initial dispatch happens HERE, at the end of ngOnInit - after all of the
        // `this.actions.pipe(ofType(...))` subscriptions above are registered. These used to be
        // dispatched at the top of ngOnInit, which is only safe while the corresponding success
        // action arrives asynchronously.
        //
        // It isn't always. These GETs go through CacheInterceptor with a 30s TTL
        // (DASHBOARD_CACHE_TTL_MS), and a replay of an already-buffered shareReplay response is
        // emitted SYNCHRONOUSLY on subscribe. The effect then re-dispatches its success action
        // inside the same call stack as this dispatch - before the subscription that handles it
        // exists - and the response is silently lost forever.
        //
        // That is exactly the account-switch bug: switching accounts routes through '/k' (an
        // unmatched path -> '**' -> login -> back), which re-creates HomeComponent and this
        // nav-bar well within the 30s cache window, so `getAllAccountsByPersonIdActionSuccess`
        // fired into no subscriber, `allAccounts` stayed [], and the nav spinner
        // (`*ngIf="!allAccounts?.length"` in nav-bar.component.html) never went away.
        //
        // Do not move these back above the subscriptions. Same class of bug as the one documented
        // on withStaleWhileRevalidate's asapScheduler emission in util/stale-while-revalidate.ts.
        this.store.dispatch(getProfilePictureAction(this.personId))
        this.store.dispatch(getAccountColorAction(this.accountId))
        this.store.dispatch(getUserRoleAction(this.accountId, this.personId, true))
        if (Object.keys(this.permissionObject).length > 0 && this.accountId) {
            this.store.dispatch(getAccountSubscriptionDetailAction(this.accountId))
        }
        this.store.dispatch(getAllAccountsAction(this.personId))
    }

    onSelectionChanged(event: any) {
        this.currentElement = event.value

        const element = this.currentElement
        this.selectedAccount = { ...this.currentElement }
        localStorage.setItem(K.APP.ACCOUNT_ID_KEY, Encryption.encryptData(element?.accountId.toString()))
        this.mixpanelService.createProfile({ AccountName: element.accountName })

        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(element)))
        this.store.dispatch(getAccountSubscriptionDetailAction(element?.accountId))
        if (element?.cobrandingLogoPath) {
            this.coBrandLogo = element.cobrandingLogoPath
        } else {
            this.coBrandLogo = `../../../../assets/images/logo.svg`
        }
    }

    filterUser() {
        this.filteredUsers = []
    }

    // Rebuilt on every navigation (not just clicks on these menu items) so the highlighted tab
    // always matches the current URL, whether you got there by clicking a menu item, a direct
    // link, a browser refresh, or a redirect fired from elsewhere in the app.
    // Delegates to Router.isActive rather than hand-rolled string prefixing: it resolves the
    // candidate path against the current UrlTree segment-by-segment, so '/users' won't
    // false-match a hypothetical '/userSettings', query params (selectedParticipants, accountId,
    // page, filters, ...) never affect the result, and nested routes (e.g. the report pages
    // mounted under /users/... per home-routing.module.ts) still count as "Users is active".
    // 'subset' matching is what makes that nested-route case work - but it also means every path
    // is trivially a subset of the root, so '/' needs 'exact' or every tab would light up.
    private isRouteActive(path: string, exact = false): boolean {
        return this.router.isActive(this.router.createUrlTree([path]), {
            paths: exact ? 'exact' : 'subset',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
        })
    }

    private buildNavItems() {
        this.items1 = [
            {
                icon: 'icon-dashboard',
                label: 'Dashboard',
                styleClass: this.isRouteActive('/', true) || this.isRouteActive('/dashboard', true) ? 'active' : '',
                command: () => {
                    this.router.navigate([''])
                },
            },
            {
                icon: 'icon-user-alt',
                label: this.systemLabels.participantLabelName ? this.systemLabels.participantLabelName + 's' : 'Users',
                styleClass: this.isRouteActive('/users') ? 'active' : '',
                command: () => {
                    this.router.navigate(['/users'], {
                        queryParams: {
                            selectedParticipants: this.selectedPersons,
                            accountId: this.selectedAccountId,
                        },
                    })
                },
            },
            {
                icon: 'icon-userplus',
                label: 'My Team',
                styleClass: this.isRouteActive('/myTeam') ? 'active' : '',
                command: () => {
                    this.router.navigate(['/myTeam'], {
                        queryParams: {
                            selectedParticipants: this.selectedPersons,
                            accountId: this.selectedAccountId,
                        },
                    })
                },
            },
            {
                icon: 'icon-setting',
                label: 'Settings',
                styleClass: this.isRouteActive('/settings') ? 'active' : '',
                command: () => {
                    this.router.navigate(['/settings'])
                },
            },
        ]
    }

    logout() {
        this.errorMessage = null
        this.appService.logout()
    }
    searcMultipleAccounts() {
        const currPage = window.location.href.split('/')[3].split('?')[0]
        if (currPage !== 'myTeam' && currPage !== 'users') {
            this.router.navigate(['/users'])
        }
        this.store.dispatch(
            searchMultipleAccountsAction({
                accounts: this.accountIdArray,
                search: this.query,
                pageNumber: 1,
                pageSize: 10,
                sortBy: '',
                ascending: true,
            })
        )
        this.query = ''
    }

    private isAccountSwitching = false

    onErrorDialogAccountChange(event: any) {
        this.isAccountSwitching = true
        this.onSelectionChanged(event)
        this.errorMessage = null
    }

    onErrorDialogHide() {
        if (!this.isAccountSwitching) {
            this.logout()
        }
        this.isAccountSwitching = false
    }

    onManageSubscriptionClick() {
        window.open(this.subscriptionData?.url, '_blank')
    }

    displayChatbot() {
        this.helpBar = false
        this.displayChatbotModal = true
    }

    ngAfterViewInit(): void {
        // The header is position: fixed, so pages reserve its height via --page-padding-top. Its
        // height isn't constant - below 768px it wraps onto two rows, and anything added to it later
        // can change it too - so it's measured whenever it changes instead of assumed.
        this.updatePagePadding()
        const header = this.headerContainer?.nativeElement
        // Without ResizeObserver (very old browsers) the padding stays at the value set above.
        if (!header || typeof ResizeObserver === 'undefined') return
        // Outside Angular's zone: the observer fires on every header size change (every frame of a
        // window resize) and only sets a CSS variable - no change detection needed. The variable only
        // affects page padding, never the header itself, so it can't trigger an observer loop.
        this.ngZone.runOutsideAngular(() => {
            const observer = new ResizeObserver(() => this.updatePagePadding())
            observer.observe(header)
            this.destroyRef.onDestroy(() => observer.disconnect())
        })
    }

    // Header height + the gap pages have always had below it (96px = 68px header + 28px). Before the
    // header has rendered (or if it measures 0), falls back to the single-row desktop height.
    private updatePagePadding(): void {
        const measured = this.headerContainer?.nativeElement?.getBoundingClientRect().height
        const headerHeight = Math.ceil(measured || DESKTOP_HEADER_HEIGHT_PX)
        const bannerOffset = this.isBannerVisible ? BANNER_OFFSET_PX : 0
        const padding = `${headerHeight + PAGE_GAP_BELOW_HEADER_PX + bannerOffset}px`
        if (padding === this.lastPagePadding) return
        this.lastPagePadding = padding
        document.documentElement.style.setProperty('--page-padding-top', padding)
    }
}
