import { CommonModule } from '@angular/common'
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router'
import { Store } from '@ngrx/store'
import { ShepherdService } from 'angular-shepherd'
import { MenuItem } from 'primeng/api'
import { MenuModule } from 'primeng/menu'
import { filter } from 'rxjs/operators'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import { LoaderService } from '../loader/loader.service'
import { buildSettingsTourSteps, removeHighlights } from './settings-tour.config'
import { SettingsService } from './settings.service'
import { getLegalTextAction } from './settingsStore/settings.actions'
// Sidebar item id -> the child route it opens (settings-routing.module.ts). Drives which item is
// highlighted - see SettingsComponent.highlightActiveItem().
const SETTINGS_MENU_PATHS: Record<string, string> = {
    'settings-account': 'account',
    'settings-profile': 'profile',
    'settings-registration': 'self-registration',
    'settings-subscriptions': 'subscriptions',
    'settings-admins': 'invite',
    'settings-reports': 'reports',
    'settings-email': 'email-settings',
    'settings-webhooks': 'email-settings',
    'settings-integrations': 'integrations',
    'settings-support': 'participant-management',
    'settings-appcues-management': 'appcues-management',
}

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, RouterModule, MenuModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef)
    items: MenuItem[] = []
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }

    accountId: any

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private settingService: SettingsService,
        private shepherdService: ShepherdService,
        private store: Store<{ settingsReducer: any }>,
        public loaderService: LoaderService
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
    }

    ngOnInit(): void {
        this.loaderService.isLoading.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((loading: boolean) => {
            if (!loading) {
                // API has finished — safe to start the tour
                // this.checkAndStartTour()
            }
        })

        this.store.dispatch(getLegalTextAction(this.accountId))

        this.systemLabels = this.settingService.parseSystemLabels()
        this.items = [
            {
                label: 'Account',
                icon: 'icon-user',
                id: 'settings-account',
                command: () => {
                    this.router.navigate(['account'], {
                        relativeTo: this.route,
                    })
                },
            },
            {
                label: 'Profile',
                icon: 'icon-user-o',
                id: 'settings-profile',
                command: () => {
                    this.router.navigate(['profile'], {
                        relativeTo: this.route,
                    })
                },
            },
            {
                label: 'Self Registration',
                icon: 'icon-registeration',
                id: 'settings-registration',
                command: () => {
                    this.router.navigate(['self-registration'], {
                        relativeTo: this.route,
                    })
                },
            },
            {
                label: 'Subscriptions',
                icon: 'icon-subscription',
                id: 'settings-subscriptions',
                command: () => {
                    this.router.navigate(['subscriptions'], {
                        relativeTo: this.route,
                    })
                },
            },
            {
                label: 'Add Admins',
                icon: 'icon-invite',
                id: 'settings-admins',
                command: () => {
                    this.router.navigate(['invite'], {
                        relativeTo: this.route,
                    })
                },
            },
            {
                label: 'Reports & Customization',
                icon: 'icon-reports',
                id: 'settings-reports',
                command: () => {
                    this.router.navigate(['reports'], {
                        relativeTo: this.route,
                    })
                },
            },
            {
                label: 'Email Settings',
                icon: 'icon-envelope',
                id: 'settings-email',
                command: () => {
                    this.router.navigate(['email-settings'], {
                        relativeTo: this.route,
                    })
                },
            },
            {
                label: 'Webhooks',
                icon: 'icon-envelope',
                id: 'settings-webhooks',
                command: () => {
                    this.router.navigate(['email-settings'], {
                        relativeTo: this.route,
                    })
                },
            },
        ]
        this.highlightActiveItem()
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => this.highlightActiveItem())
        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.userRolePayload?.data) {
                    // Common items for both cases
                    this.items = [
                        {
                            label: 'Account',
                            icon: 'icon-user',
                            id: 'settings-account',
                            command: () => {
                                this.router.navigate(['account'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                        {
                            label: 'Profile',
                            icon: 'icon-user-o',
                            id: 'settings-profile',
                            command: () => {
                                this.router.navigate(['profile'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                        {
                            label: 'Self Registration',
                            icon: 'icon-registeration',
                            id: 'settings-registration',
                            command: () => {
                                this.router.navigate(['self-registration'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                        {
                            label: 'Subscriptions',
                            icon: 'icon-subscription',
                            id: 'settings-subscriptions',
                            command: () => {
                                this.router.navigate(['subscriptions'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                        {
                            label: 'Add Admins',
                            icon: 'icon-invite',
                            id: 'settings-admins',
                            command: () => {
                                this.router.navigate(['invite'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                        {
                            label: 'Reports & Customization',
                            icon: 'icon-reports',
                            id: 'settings-reports',
                            command: () => {
                                this.router.navigate(['reports'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                        {
                            label: 'Email Settings',
                            icon: 'icon-envelope',
                            id: 'settings-email',
                            command: () => {
                                this.router.navigate(['email-settings'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                        {
                            label: 'Integrations',
                            icon: 'icon-Integration',
                            id: 'settings-integrations',
                            command: () => {
                                this.router.navigate(['integrations'], {
                                    relativeTo: this.route,
                                })
                            },
                        },
                    ]
                    // if (store?.subscriptionNamePayload?.data) {
                    //     let permissions: any = this.settingService.transformSubscriptionFeatures(
                    //         store?.subscriptionNamePayload?.data
                    //             ?.subscriptionFeatures
                    //     );
                    //     if (permissions['Email-Setting']) {
                    //         this.items.push({
                    //             label: 'Email Settings',
                    //             icon: 'icon-envelope',
                    //             command: () => {
                    //                 this.router.navigate(['email-settings'], {
                    //                     relativeTo: this.route
                    //                 });
                    //             }
                    //         });
                    //     }
                    // }

                    // Additional item based on user role
                    if (store.userRolePayload.data.userRoleTypeId === K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN) {
                        this.items.push(
                            {
                                label: 'DNA Behavior Support',
                                icon: 'icon-support',
                                id: 'settings-support',
                                command: () => {
                                    this.router.navigate(['participant-management'], {
                                        relativeTo: this.route,
                                    })
                                },
                            },
                            {
                                label: 'Appcues Management',
                                icon: 'icon-dashboard',
                                id: 'settings-appcues-management',
                                command: () => {
                                    this.router.navigate(['appcues-management'], {
                                        relativeTo: this.route,
                                    })
                                },
                            }
                        )
                    }
                    this.highlightActiveItem()
                }
            })

        // Initialize tour configuration
        this.initializeSettingsTour()
    }

    // The sidebar item for the page being shown, derived from the URL - not from clicks - so it's right
    // on first load, refresh, Back/Forward and deep links too. Only the first matching item is marked
    // (the pre-role menu's Email Settings and Webhooks both point at email-settings). A fresh array of
    // fresh items so p-menu (OnPush) re-renders.
    private highlightActiveItem() {
        const page = this.currentSettingsPage()
        let matched = false
        this.items = (this.items ?? []).map((item: MenuItem) => {
            const isActive = !matched && !!item.id && SETTINGS_MENU_PATHS[item.id] === page
            if (isActive) matched = true
            return { ...item, styleClass: isActive ? 'active' : undefined }
        })
    }

    // Child route under /settings; the bare /settings route renders the Account page.
    private currentSettingsPage(): string {
        const segments = this.router.parseUrl(this.router.url).root.children['primary']?.segments.map((segment) => segment.path) ?? []
        const settingsIndex = segments.indexOf('settings')
        return (settingsIndex >= 0 && segments[settingsIndex + 1]) || 'account'
    }

    private initializeSettingsTour(): void {
        this.shepherdService.modal = false
        this.shepherdService.confirmCancel = false
        this.shepherdService.defaultStepOptions = {
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
                enabled: false,
            },
        }

        const completeTour = () => {
            this.shepherdService.complete()
            const tourCompletionData = JSON.parse(localStorage.getItem('tour-completion') || '{}')
            tourCompletionData.settings = true
            localStorage.setItem('tour-completion', JSON.stringify(tourCompletionData))
        }

        const steps = buildSettingsTourSteps({
            onSkip: completeTour,
            onFinish: completeTour,
        })

        this.shepherdService.addSteps(steps as any)

        if (this.shepherdService.tourObject) {
            this.shepherdService.tourObject.on('complete', () => {
                removeHighlights()
            })

            this.shepherdService.tourObject.on('cancel', () => {
                removeHighlights()
            })
        }
    }

    private checkAndStartTour(): void {
        if (this.router.url.includes('/settings')) {
            const tourCompletionData = JSON.parse(localStorage.getItem('tour-completion') || '{}')
            if (!tourCompletionData.settings) {
                setTimeout(() => {
                    this.shepherdService.start()
                }, 200)
            }
        }
    }

    ngOnDestroy(): void {
        if (this.shepherdService.isActive) {
            this.shepherdService.cancel()
        }
    }
}
