import { CommonModule } from '@angular/common'
import { Component, DestroyRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { RadioButtonModule } from 'primeng/radiobutton'
import { RippleModule } from 'primeng/ripple'
import { TourKey, TourStatus } from 'src/app/enums'
import { AppcuesService } from 'src/app/service/appcues.service'
import {
    getActiveUserToursAction,
    openUsersWalkthroughAction,
    upsertUserTourStateAction,
    upsertUserTourStateFailureAction,
    upsertUserTourStateSuccessAction,
} from '../../../tour/tour.actions'
import { TourState } from '../../../tour/tour.reducer'

// Extracted from NavBarComponent (see APPLICATION_ROADMAP.md Epic 3): the product tour /
// walkthrough / tutorial-modal subsystem, previously ~250 lines interleaved with the app-shell
// chrome, account switcher, and subscription-loading concerns in one 997-line component. This is
// the most self-contained of those four concerns - its own dedicated actions, its own local
// flags, minimal cross-talk with the rest of the shell beyond personId/permissionObject.
@Component({
    selector: 'app-nav-bar-tour-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, RippleModule, RadioButtonModule],
    templateUrl: './nav-bar-tour-modal.component.html',
    styleUrls: ['./nav-bar-tour-modal.component.scss'],
})
export class NavBarTourModalComponent implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef)
    @Input() personId: string
    @Input() permissionObject: any = {}
    // Original NavBarComponent set `this.helpBar = false` as a side effect of displayTutorial(),
    // onAppWalkthroughClick(), and restartWalkthrough() - closing the help sidebar whenever a tour
    // action fires. helpBar itself stayed in NavBarComponent (it's a general help menu, not
    // tour-specific), so this emits instead of owning that field directly.
    @Output() closeHelpMenu = new EventEmitter<void>()

    displayTutorialModal = false
    displayAppWalkthroughModal = false
    showStartTourBtn = true
    modalMode: 'start' | 'finish' = 'start'
    selectedTourType: 'onboarding' | 'digitalScan' = 'onboarding'

    private isTakeTourClicked = false
    private isSkipClicked = false
    private isGetStartedClicked = false
    // Set to false on completion but never set true anywhere - preserved as-is from the original
    // NavBarComponent; the `if (this.waitingForAppWalkthrough && ...)` branch below is currently
    // unreachable. Not fixed here since that's a separate behavior question, not part of this move.
    private waitingForAppWalkthrough = false
    private isStatusUpdateFromOpenBtn = false
    private urlAtButtonClick = ''
    private lastPayloadData: any = null

    private dashboardTourId: number | null = null
    private digitalScanTourId: number | null = null

    private openVideoModalListener?: (e: Event) => void

    constructor(
        private router: Router,
        private store: Store<{ tourReducer: any }>,
        private actions: Actions,
        private appcuesService: AppcuesService
    ) {}

    ngOnInit(): void {
        this.store
            .select((state) => state.tourReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((tourState: TourState) => {
                if (tourState.tours && !tourState.loading && tourState.tours.data && Array.isArray(tourState.tours.data)) {
                    const dashboardTour = tourState.tours.data.find((tour: any) => tour.tourKey === TourKey.Dashboard)
                    if (dashboardTour) {
                        this.dashboardTourId = dashboardTour.tourId
                    }

                    const digitalScanTour = tourState.tours.data.find((tour: any) => tour.tourKey === TourKey.DigitalScan)
                    if (digitalScanTour) {
                        this.digitalScanTourId = digitalScanTour.tourId
                    }
                }
            })

        this.actions.pipe(ofType(upsertUserTourStateSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ result }) => {
            if (result?.tourKey === TourKey.Dashboard) {
                this.dashboardTourId = result.tourId
            }

            if (this.waitingForAppWalkthrough && result?.tourKey === TourKey.Dashboard) {
                this.waitingForAppWalkthrough = false // Reset flag
                this.displayTutorial()
            }

            if (this.isStatusUpdateFromOpenBtn) {
                this.isStatusUpdateFromOpenBtn = false

                if (this.selectedTourType === 'onboarding' && this.lastPayloadData?.tourKey === TourKey.Dashboard) {
                    if (this.urlAtButtonClick === '/') {
                        this.store.dispatch(getActiveUserToursAction({ userId: this.personId }))
                    } else {
                        this.router.navigate(['/'])
                    }
                } else if (
                    this.selectedTourType === 'digitalScan' &&
                    this.lastPayloadData?.tourKey === TourKey.DigitalScan &&
                    this.urlAtButtonClick === '/users'
                ) {
                    this.store.dispatch(getActiveUserToursAction({ userId: this.personId }))
                }
                this.urlAtButtonClick = ''
                this.lastPayloadData = null
            }
        })

        this.actions.pipe(ofType(upsertUserTourStateFailureAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ error }) => {
            console.error('Tour state update failed:', error)

            if (this.isStatusUpdateFromOpenBtn) {
                this.isStatusUpdateFromOpenBtn = false

                if (this.selectedTourType === 'onboarding') {
                    this.router.navigate(['/'])
                }

                this.urlAtButtonClick = ''
                this.lastPayloadData = null
            }
        })

        // Listen for request from home to open the tutorial video modal
        this.openVideoModalListener = (e: Event) => {
            const detail: any = (e as CustomEvent).detail || {}
            // Hide Start Tour button when triggered from tour finish, show otherwise
            this.showStartTourBtn = detail.mode !== 'finish'
            this.modalMode = detail.mode === 'finish' ? 'finish' : 'start'
            this.displayTutorialModal = true
        }
        window.addEventListener('open-nav-video-modal', this.openVideoModalListener as EventListener)
    }

    ngOnDestroy(): void {
        if (this.openVideoModalListener) {
            window.removeEventListener('open-nav-video-modal', this.openVideoModalListener as EventListener)
        }
    }

    displayTutorial() {
        this.closeHelpMenu.emit()
        this.showStartTourBtn = true
        this.modalMode = 'start'
        this.isTakeTourClicked = false
        this.isSkipClicked = false
        this.isGetStartedClicked = false
        this.displayTutorialModal = true
    }

    onSkipTour() {
        this.isSkipClicked = true
        const payload = {
            userId: this.personId,
            tourId: this.dashboardTourId,
            tourKey: TourKey.Dashboard,
            tourStatus: TourStatus.Skipped,
        }
        this.store.dispatch(upsertUserTourStateAction({ payload }))
        this.displayTutorialModal = false
    }

    restartWalkthrough() {
        this.closeHelpMenu.emit()
        const tourCompletionData = JSON.parse(localStorage.getItem('tour-completion') || '{}')
        tourCompletionData.digitalScan = false
        tourCompletionData.settings = false
        tourCompletionData.home = false
        localStorage.setItem('tour-completion', JSON.stringify(tourCompletionData))
    }

    onStartHomeTour() {
        this.isTakeTourClicked = true
        this.displayTutorialModal = false
        window.dispatchEvent(new CustomEvent('start-home-tour'))
    }

    onDismissTour() {
        if (this.isTakeTourClicked || this.isSkipClicked || this.isGetStartedClicked) {
            this.isTakeTourClicked = false // Reset flags
            this.isSkipClicked = false
            this.isGetStartedClicked = false
            this.displayTutorialModal = false
            return
        }

        if (!this.dashboardTourId) {
            this.displayTutorialModal = false
            return
        }

        const payload = {
            userId: this.personId,
            tourId: this.dashboardTourId,
            tourKey: TourKey.Dashboard,
            tourStatus: TourStatus.Dismissed,
        }
        this.store.dispatch(upsertUserTourStateAction({ payload }))
        this.displayTutorialModal = false
    }

    onGetStarted() {
        this.isGetStartedClicked = true
        this.displayTutorialModal = false
    }

    onAppWalkthroughClick() {
        this.closeHelpMenu.emit()

        if (!this.permissionObject['Digital-Scan']) {
            this.appcuesService.getAllToursCall().subscribe({
                next: (response) => {
                    if (response && response.body && (response.body as any).data && Array.isArray((response.body as any).data)) {
                        const dashboardTour = (response.body as any).data.find((tour: any) => tour.tourKey === TourKey.Dashboard && tour.isActive === true)
                        if (dashboardTour) {
                            this.dashboardTourId = dashboardTour.tourId

                            this.isStatusUpdateFromOpenBtn = true
                            this.urlAtButtonClick = this.router.url

                            const payload = {
                                userId: this.personId,
                                tourId: this.dashboardTourId,
                                tourKey: TourKey.Dashboard,
                                tourStatus: TourStatus.InProgress,
                            }
                            this.lastPayloadData = payload
                            this.store.dispatch(upsertUserTourStateAction({ payload }))
                        } else {
                            this.router.navigate(['/'])
                        }
                    }
                },
                error: (error) => {
                    console.error('getAllTours API error:', error)
                },
            })
        } else {
            this.displayAppWalkthroughModal = true

            this.appcuesService.getAllToursCall().subscribe({
                next: (response) => {
                    if (response && response.body && (response.body as any).data && Array.isArray((response.body as any).data)) {
                        const dashboardTour = (response.body as any).data.find((tour: any) => tour.tourKey === TourKey.Dashboard && tour.isActive === true)
                        if (dashboardTour) {
                            this.dashboardTourId = dashboardTour.tourId
                        }

                        const digitalScanTour = (response.body as any).data.find((tour: any) => tour.tourKey === TourKey.DigitalScan && tour.isActive === true)
                        if (digitalScanTour) {
                            this.digitalScanTourId = digitalScanTour.tourId
                        }
                    }
                },
                error: (error) => {
                    console.error('getAllTours API error:', error)
                },
            })
        }
    }

    onCloseAppWalkthroughModal() {
        this.displayAppWalkthroughModal = false
    }

    onSaveAppWalkthrough() {
        this.displayAppWalkthroughModal = false
        this.isStatusUpdateFromOpenBtn = true
        this.urlAtButtonClick = this.router.url

        if (this.selectedTourType === 'onboarding') {
            if (this.dashboardTourId) {
                const payload = {
                    userId: this.personId,
                    tourId: this.dashboardTourId,
                    tourKey: TourKey.Dashboard,
                    tourStatus: TourStatus.InProgress,
                }
                this.lastPayloadData = payload
                this.store.dispatch(upsertUserTourStateAction({ payload }))
            } else {
                this.router.navigate(['/'])
            }
        } else if (this.selectedTourType === 'digitalScan') {
            if (this.digitalScanTourId) {
                const payload = {
                    userId: this.personId,
                    tourId: this.digitalScanTourId,
                    tourKey: TourKey.DigitalScan,
                    tourStatus: TourStatus.InProgress,
                }
                this.lastPayloadData = payload
                this.store.dispatch(upsertUserTourStateAction({ payload }))
            }

            // navigate first: openUsersWalkthroughAction's window event is picked up by a
            // listener MainUsersComponent wires up in ngOnInit, so dispatching before that
            // component exists (e.g. a fresh SPA nav here) would fire with nothing listening -
            // same reason a page refresh "fixed" this before this action existed.
            this.router.navigate(['/users']).then(() => {
                this.store.dispatch(openUsersWalkthroughAction())
            })
        }
    }
}
