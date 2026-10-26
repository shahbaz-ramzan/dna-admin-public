import { DestroyRef, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { take } from 'rxjs/operators'
import { ShepherdService } from 'angular-shepherd'
import { TourManagerService } from 'tour-manager.service'
import { TourKey, TourStatus } from 'src/app/enums'
import { getActiveUserToursAction, getActiveUserToursSuccessAction, upsertUserTourStateAction, upsertUserTourStateSuccessAction } from '../../tour/tour.actions'
import {
    getCreditIdAction,
    getCreditIdActionSuccess,
    getDigitalScanAccessDataAction,
    getDigitalScanAccessDataActionSuccess,
    getDiscoveryStatusAction,
    getDiscoveryStatusActionSuccess,
} from './mainUserStore/main-users.actions'
import { buildMainUsersTourSteps } from './main-users-tour.config'

// Fields read/written by MainUsersComponent's Digital Scan onboarding tour/popover orchestration.
// MainUsersComponent passes itself (`this`) as the state argument to every method below, so all
// mutations here happen directly on the component instance's own fields. `loggedInPersonDiscoveryStatus`
// is also read by an unrelated discovery-reminder feature elsewhere on the component - preserved
// as a shared field, not duplicated.
export interface DigitalScanTourState {
    visible: boolean
    showInfoDialog: boolean
    openUsersPopoverListener?: () => void
    digitalScanTourState: any
    digitalScanTourId: number | null
    isSkippingTour: boolean
    hasShownPopoverOnInit: boolean
    pendingPopoverTimeout?: ReturnType<typeof setTimeout>
    showCompletionDialog: boolean
    showDigitalScanBtn: boolean
    loggedInPersonDiscoveryStatus: boolean
    digitalScan: any
    loggedInPersonId: any
    accountId: any
    permissionObject: any
    destroyRef: DestroyRef
}

@Injectable({ providedIn: 'root' })
export class DigitalScanTourService {
    constructor(
        private store: Store<{ mainUserReducer: any }>,
        private tourStore: Store<{ tourReducer: any }>,
        private actions: Actions,
        private router: Router,
        private shepherdService: ShepherdService,
        private tourManagerService: TourManagerService
    ) {}

    initializeTour(state: DigitalScanTourState): void {
        this.shepherdService.modal = true
        this.shepherdService.confirmCancel = false
        this.shepherdService.defaultStepOptions = {
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
                enabled: true,
            },
        }

        if (this.shepherdService.tourObject) {
            this.shepherdService.tourObject.on('complete', () => {
                const payload = {
                    userId: state.loggedInPersonId,
                    tourId: state.digitalScanTourId,
                    tourKey: TourKey.DigitalScan,
                    tourStatus: TourStatus.Completed,
                }
                this.store.dispatch(upsertUserTourStateAction({ payload }))
                setTimeout(() => {
                    this.showCompletionPopover(state)
                }, 100)
            })

            this.shepherdService.tourObject.on('cancel', () => {
                const payload = {
                    userId: state.loggedInPersonId,
                    tourId: state.digitalScanTourId,
                    tourKey: TourKey.DigitalScan,
                    tourStatus: TourStatus.Dismissed,
                }
                this.store.dispatch(upsertUserTourStateAction({ payload }))
                this.tourManagerService.forceCleanupForTourSwitch()
                state.showInfoDialog = false
            })
        }

        const steps = buildMainUsersTourSteps({
            next: () => this.shepherdService.next(),
            onDigitalScanStepNext: () => {
                this.showDialog(state)
                // Complete the main users tour and start digital scan form tour
                this.shepherdService.complete()
                // Start digital scan form tour after a short delay
                setTimeout(() => {
                    this.startDigitalScanFormTour(state)
                }, 200)
            },
        })

        this.shepherdService.addSteps(steps as any)
    }

    startTour(state: DigitalScanTourState): void {
        state.showInfoDialog = false
        setTimeout(() => {
            if (this.router.url === '/users') {
                this.initializeTour(state)
                this.tourManagerService.startTour('users')
                this.attachTourEventListeners(state)
            }
        }, 100)
    }

    private startDigitalScanFormTour(state: DigitalScanTourState): void {
        if (state.digitalScan && state.digitalScanTourId) {
            state.digitalScan.initializeTour()
            state.digitalScan.startTour()
        }
    }

    private attachTourEventListeners(state: DigitalScanTourState): void {
        if (this.shepherdService.tourObject) {
            this.shepherdService.tourObject.on('cancel', () => {
                const payload = {
                    userId: state.loggedInPersonId,
                    tourId: state.digitalScanTourId,
                    tourKey: TourKey.DigitalScan,
                    tourStatus: TourStatus.Dismissed,
                }
                this.store.dispatch(upsertUserTourStateAction({ payload }))
                this.tourManagerService.forceCleanupForTourSwitch()
                state.showInfoDialog = false
            })
        }
    }

    private findDigitalScanTour(tours: any[] | undefined | null): any {
        if (!Array.isArray(tours)) return null
        return tours.find((tour: any) => tour.tourKey === TourKey.DigitalScan)
    }

    // Bootstraps everything the Digital Scan feature needs: the user's tour progress (so the
    // one-time walkthrough popover knows whether to show), whether this account even has
    // Digital Scan access, and the credit/discovery-status chain that access depends on.
    initializeDigitalScanAccess(state: DigitalScanTourState): void {
        this.tourStore
            .select((s) => s.tourReducer)
            .pipe(take(1))
            .subscribe(() => {
                this.store.dispatch(
                    getActiveUserToursAction({
                        userId: state.loggedInPersonId,
                    })
                )
            })

        this.store.dispatch(getCreditIdAction({ personId: state.loggedInPersonId }))

        this.tourStore
            .select((s) => s.tourReducer)
            .pipe(takeUntilDestroyed(state.destroyRef))
            .subscribe((tourState: any) => {
                if (tourState?.tours && !tourState.loading && tourState.tours.data && Array.isArray(tourState.tours.data)) {
                    const digitalScanTour = this.findDigitalScanTour(tourState.tours.data)
                    state.digitalScanTourState = digitalScanTour

                    if (digitalScanTour) {
                        state.digitalScanTourId = digitalScanTour.tourId

                        if (this.router.url === '/users' && state.permissionObject['Digital-Scan'] && !state.hasShownPopoverOnInit) {
                            state.hasShownPopoverOnInit = true
                            state.pendingPopoverTimeout = setTimeout(() => {
                                this.showPopover(state)
                            }, 3000)
                        }
                    } else {
                        state.hasShownPopoverOnInit = false
                    }
                }
            })

        this.actions.pipe(ofType(getActiveUserToursSuccessAction), takeUntilDestroyed(state.destroyRef)).subscribe(({ tours }) => {
            const digitalScanTour = this.findDigitalScanTour(tours?.data)
            state.digitalScanTourState = digitalScanTour
            if (digitalScanTour) {
                state.digitalScanTourId = digitalScanTour.tourId
            }
        })

        this.actions.pipe(ofType(upsertUserTourStateSuccessAction), takeUntilDestroyed(state.destroyRef)).subscribe(({ result }) => {
            if (!state.isSkippingTour) {
                this.store.dispatch(getActiveUserToursAction({ userId: state.loggedInPersonId }))
            } else {
                state.isSkippingTour = false
            }

            const digitalScanTour = this.findDigitalScanTour(result?.data)
            state.digitalScanTourId = digitalScanTour ? digitalScanTour.tourId : null
        })

        this.store.dispatch(getDigitalScanAccessDataAction())

        state.openUsersPopoverListener = () => {
            this.initializeTour(state)
            // Cancel any 3s auto-show still in flight from the initial-load subscription above -
            // otherwise it can fire later (unconditionally, no re-check) and reopen the popover
            // after this retake has already been shown and dismissed.
            if (state.pendingPopoverTimeout) {
                clearTimeout(state.pendingPopoverTimeout)
                state.pendingPopoverTimeout = undefined
            }
            state.hasShownPopoverOnInit = false
            const checkTourState = () => {
                if (state.digitalScanTourState && state.permissionObject['Digital-Scan']) {
                    // Mirror the tourReducer subscription's own bookkeeping (line ~176): mark
                    // shown before a later emission on that same long-lived subscription sees
                    // hasShownPopoverOnInit still false (reset above) and reschedules another
                    // popup - this was reappearing ~3s after Skip for that reason.
                    state.hasShownPopoverOnInit = true
                    this.showPopover(state)
                } else {
                    setTimeout(checkTourState, 100)
                }
            }
            checkTourState()
        }
        window.addEventListener('open-users-popover', state.openUsersPopoverListener)

        this.actions.pipe(ofType(getDigitalScanAccessDataActionSuccess), takeUntilDestroyed(state.destroyRef)).subscribe(({ response }) => {
            response.body.value.forEach((el: any) => {
                if (el.AccountID == state.accountId) {
                    state.showDigitalScanBtn = true
                }
            })
        })
        this.actions.pipe(ofType(getCreditIdActionSuccess), takeUntilDestroyed(state.destroyRef)).subscribe((response) => {
            // success action only dispatches when the request succeeded, so a creditId is sufficient to proceed
            if (response?.creditIdResponse?.body?.data?.creditId) {
                this.store.dispatch(
                    getDiscoveryStatusAction({
                        creditId: response?.creditIdResponse?.body?.data.creditId,
                    })
                )
            }
        })

        this.actions.pipe(ofType(getDiscoveryStatusActionSuccess), takeUntilDestroyed(state.destroyRef)).subscribe((response) => {
            // success action only dispatches when the request succeeded, so data presence is sufficient
            if (response?.discoveryStatusResponse?.body?.data) {
                state.loggedInPersonDiscoveryStatus = response?.discoveryStatusResponse?.body?.data?.completed
            }
        })
    }

    showDialog(state: DigitalScanTourState) {
        state.digitalScan?.form.reset()
        state.digitalScan?.tags.forEach((t: any) => {
            t.value = false
        })
        state.visible = true
    }

    closeModal(state: DigitalScanTourState) {
        state.visible = false
    }

    showPopover(state: DigitalScanTourState) {
        state.showInfoDialog = true
    }

    onPopoverButtonClick(state: DigitalScanTourState, action: string): void {
        if (action === 'skip') {
            state.isSkippingTour = true

            const payload = {
                userId: state.loggedInPersonId,
                tourId: state.digitalScanTourId,
                tourKey: TourKey.DigitalScan,
                tourStatus: TourStatus.Skipped,
            }
            this.store.dispatch(upsertUserTourStateAction({ payload }))
            state.showInfoDialog = false
        } else if (action === 'start-tour') {
            this.startTour(state)
        } else if (action === 'close-completion') {
            state.showCompletionDialog = false
        }
    }

    showCompletionPopover(state: DigitalScanTourState): void {
        state.showCompletionDialog = true
    }

    onDigitalScanCompleted(state: DigitalScanTourState): void {
        setTimeout(() => {
            this.showCompletionPopover(state)
        }, 1000)
    }

    cleanup(state: DigitalScanTourState): void {
        this.tourManagerService.cleanupAllTours()

        if (state.openUsersPopoverListener) {
            window.removeEventListener('open-users-popover', state.openUsersPopoverListener)
        }

        state.hasShownPopoverOnInit = false
    }
}
