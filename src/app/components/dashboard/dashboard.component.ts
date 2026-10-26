import { CommonModule } from '@angular/common'
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import { Store } from '@ngrx/store'
import {} from 'ng2-charts'
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import { Observable } from 'rxjs'
import K from 'src/app/constants'
import { getLastCompletionsAction, getMarketMoodAction, getRecentActivitiesAction, getUniqueStyleGraphAction } from './dashboard.actions'
;(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs

import { ShepherdService } from 'angular-shepherd'
import { TourKey, TourStatus } from 'src/app/enums'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { SharedChartsModule } from 'src/app/shared/charts/shared-charts.module'
import { SharedModule } from 'src/app/shared/shared.module'
import Encryption from 'src/app/util/Encryption'
import { Color } from 'src/app/util/interfaces'
import { enableWonderchat } from 'src/app/util/utils'
import { TourManagerService } from 'tour-manager.service'
import { getUserRoleAction } from '../settings/settingsStore/settings.actions'
import { getActiveUserToursAction, upsertUserTourStateAction } from '../tour/tour.actions'
import { TourState } from '../tour/tour.reducer'
import { buildHomeTourSteps, removeHighlights } from './dashboard-home-tour.config'
import { RecentActivitiesComponent } from './recent-activities/recent-activities.component'
import { RecentCompletionsComponent } from './recent-completions/recent-completions.component'

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, SharedModule, SharedChartsModule, RecentActivitiesComponent, RecentCompletionsComponent],
})
export class DashboardComponent implements OnInit, OnDestroy {
    // @ViewChild('pdfTable')
    // pdfTable!: ElementRef;
    primaryColor: any
    marketMoodLaoding: boolean
    uniqueStyleGraphLaoding: boolean
    user_object: any
    lineChartColors: Color[]
    pieChartLabels: string[] = []
    pieChartData: number[] = []
    fullName: string
    pieChartColors: Color[]
    lineChartLabels: string[]
    chartPosition: string
    yAxisPosition: string
    barThicknessValue = 10
    expandCards: any
    lineChartData: {
        data: number[]
        label: string
        fillColor: string
        barThickness: number
    }[]
    user: Observable<{ name: string; email: string }>
    permissionObject: Record<string, boolean>
    selectedIdAccountId: string
    personId: string
    private destroyRef = inject(DestroyRef)
    private startTourListener?: (e: Event) => void

    // Dynamic tour ID from API
    private dashboardTourId: number | null = null
    private homeTourInitialized = false

    constructor(
        private router: Router,
        private store: Store<{ dashboardReducer: any; settingsReducer: any; tourReducer: TourState }>,
        private mixpanelService: MixpanelService,
        private shepherdService: ShepherdService,
        private tourManagerService: TourManagerService
    ) {}

    ngOnInit(): void {
        this.initializeUserContext()
        this.initializeChartDefaults()
        this.mixpanelService.track('Dashboard Viewed', this.user_object)

        enableWonderchat()
        this.store.dispatch(getActiveUserToursAction({ userId: this.personId }))
        this.store.dispatch(getMarketMoodAction(this.selectedIdAccountId))
        this.store.dispatch(getUniqueStyleGraphAction(this.selectedIdAccountId))
        this.store.dispatch(getLastCompletionsAction(this.selectedIdAccountId))
        this.store.dispatch(getRecentActivitiesAction(this.selectedIdAccountId))

        this.store.dispatch(getUserRoleAction(this.selectedIdAccountId, this.personId, true))

        this.store
            .select((state) => state.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.applyAccountColor(store)
                this.applyMarketMood(store)
                this.applyUniqueStyleGraph(store)
            })

        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.userRolePayload?.data) {
                    if (store.userRolePayload.data.userRoleTypeId === K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN) {
                        localStorage.setItem('isTopLevelAdmin', 'true')
                    } else {
                        localStorage.setItem('isTopLevelAdmin', 'false')
                    }
                }
            })

        // Subscribe to tour state - only for dashboard tour
        this.store
            .select((state) => state.tourReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((tourState: TourState) => {
                if (tourState?.tours && !tourState.loading && tourState.tours.data && Array.isArray(tourState.tours.data)) {
                    // Only process if this is dashboard tour data and we're on dashboard/home page
                    const dashboardTour = tourState.tours.data.find((tour: any) => tour.tourKey === TourKey.Dashboard)
                    if (dashboardTour) {
                        // Store dynamic tour ID from API response
                        this.dashboardTourId = dashboardTour.tourId

                        // Only wire up Shepherd's steps/listeners once we know a dashboard tour
                        // actually exists — avoids constructing tour state for every visit when
                        // the user has already completed/dismissed it.
                        if (!this.homeTourInitialized) {
                            this.homeTourInitialized = true
                            this.initializeHomeTour()
                        }

                        if (this.router.url === '/') {
                            this.maybeOpenWelcomeModal(tourState.tours)
                        }
                    }
                }
            })
    }

    ngOnDestroy(): void {
        // this._destroyed$.next(true)
        // this._destroyed$.unsubscribe()

        // Use centralized tour manager for cleanup
        this.tourManagerService.cleanupAllTours()

        if (this.startTourListener) {
            window.removeEventListener('start-home-tour', this.startTourListener as EventListener)
        }
    }

    private initializeUserContext(): void {
        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (this.user_object) {
            this.user_object = JSON.parse(this.user_object)
        }

        this.personId = this.user_object?.personId
        const decryptedPermissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        this.permissionObject = decryptedPermissionObject ? JSON.parse(decryptedPermissionObject) : {}
        this.fullName = this.user_object.fullName
        this.selectedIdAccountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
    }

    private setLineChartColor(color: string): void {
        this.primaryColor = color
        this.lineChartColors = [{ backgroundColor: color }]
        this.lineChartData = [
            {
                data: [],
                label: '',
                fillColor: color,
                barThickness: this.barThicknessValue,
            },
        ]
    }

    private initializeChartDefaults(): void {
        this.setLineChartColor(getComputedStyle(document.body).getPropertyValue('--primary-color'))

        this.chartPosition = 'right'
        this.yAxisPosition = 'right'
        this.expandCards = [{ recentActivity: false }, { recentCompletion: false }, { pieChart: false }, { lineGraph: false }]
        this.pieChartColors = [
            {
                backgroundColor: ['#E05534', '#E5E5E5', '#EEAD32', '#2E9B66'],
                pointBackgroundColor: ['#E05534', '#E5E5E5', '#EEAD32', '#2E9B66'],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: ['#E05534', '#E5E5E5', '#EEAD32', '#2E9B66'],
            },
        ]
    }

    private applyAccountColor(store: any): void {
        if (store?.accountColorPayload?.data?.primaryColor) {
            this.setLineChartColor(store?.accountColorPayload?.data?.primaryColor)
        }
    }

    private applyMarketMood(store: any): void {
        this.pieChartLabels = []
        this.pieChartData = []
        this.marketMoodLaoding = store?.getMarketMoodLoading
        if (store?.marketMoodPayload) {
            store?.marketMoodPayload?.data?.forEach((response: any) => {
                this.pieChartLabels.push(response?.mood)
                this.pieChartData.push(response?.percentage)
            })
        }
    }

    private applyUniqueStyleGraph(store: any): void {
        this.lineChartLabels = []
        this.lineChartData[0].data = []
        this.uniqueStyleGraphLaoding = store?.getUniqueStyleLoading
        if (store?.uniqueStyleGraphPayload) {
            const uniqueStyle = [...(store?.uniqueStyleGraphPayload?.data ?? [])]
            uniqueStyle?.sort((a: any, b: any) => {
                return a.uniqueStyle > b.uniqueStyle ? 1 : -1
            })
            uniqueStyle.forEach((response: any) => {
                this.lineChartLabels.push(response?.uniqueStyle), this.lineChartData[0].data.push(response?.count)
            })
        }
    }

    expandRecentActivity(value: any) {
        this.expandCards.recentActivity = value
    }

    expandRecentCompletion(value: any) {
        this.expandCards.recentCompletion = value
    }

    private maybeOpenWelcomeModal(tours: any): void {
        if (localStorage.getItem('subscriptionStatus') !== 'active') return
        const dashboardTour = tours?.data?.find((tour: any) => tour.tourKey === TourKey.Dashboard)

        if (dashboardTour) {
            // Ask navbar to open the existing video modal with Start/Close controls (3s delay)
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('open-nav-video-modal'))
            }, 2000)
        }

        // Only add the event listener once to prevent multiple listeners
        if (!this.startTourListener) {
            this.startTourListener = () => {
                this.startHomeTour()
            }
            window.addEventListener('start-home-tour', this.startTourListener)
        }
    }

    private initializeHomeTour(): void {
        this.shepherdService.modal = true
        this.shepherdService.confirmCancel = false
        this.shepherdService.defaultStepOptions = {
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: { enabled: true },
        }

        const steps = buildHomeTourSteps({
            next: () => this.shepherdService.next(),
            complete: () => this.shepherdService.complete(),
        })

        this.shepherdService.addSteps(steps as any)

        if (this.shepherdService.tourObject) {
            this.shepherdService.tourObject.on('complete', () => {
                removeHighlights()
                // Update tour state via API - mark Dashboard tour as completed
                const payload = {
                    userId: this.personId,
                    tourId: this.dashboardTourId, // Use dynamic ID from API
                    tourKey: TourKey.Dashboard,
                    tourStatus: TourStatus.Completed,
                }
                this.store.dispatch(upsertUserTourStateAction({ payload }))
            })
            this.shepherdService.tourObject.on('cancel', () => {
                removeHighlights()
                // Update tour state via API - mark Dashboard tour as dismissed
                const payload = {
                    userId: this.personId,
                    tourId: this.dashboardTourId, // Use dynamic ID from API
                    tourKey: TourKey.Dashboard,
                    tourStatus: TourStatus.Dismissed,
                }
                this.store.dispatch(upsertUserTourStateAction({ payload }))
            })
        }
    }

    private startHomeTour(): void {
        setTimeout(() => {
            this.tourManagerService.startTour('dashboard')
        }, 200)
    }
}
