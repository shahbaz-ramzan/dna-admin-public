import { CommonModule } from '@angular/common'
import { Component, DestroyRef, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import colorVariants from 'color-variants'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import Encryption from 'src/app/util/Encryption'
import { MainUsersService } from '../../main-users.service'
import { selectMainUserState } from '../mainUserStore/main-users.selectors'
import { FinancialReportsComponent } from '../single-user-selection/financial-reports/financial-reports.component'
import { DiscoveryInprogressAlertComponent } from './discovery-inprogress-alert/discovery-inprogress-alert.component'
import { UniqueStyleComponent } from './unique-style/unique-style.component'

@Component({
    selector: 'app-three-user-selection',
    standalone: true,
    imports: [CommonModule, UniqueStyleComponent, DiscoveryInprogressAlertComponent, FinancialReportsComponent],
    templateUrl: './three-user-selection.component.html',
    styleUrls: ['./three-user-selection.component.scss'],
})
export class ThreeUserSelectionComponent implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef)
    @Input() selectedPersons: string[]
    @Input() status: boolean
    isSomeDiscoveryInProgress = false
    totalUsers: number
    chartLabels: string[]
    chartValues: number[]
    chartColors: string[] = []
    usersData: any[] = []
    accountId: string | null
    isUserDetailLoading: boolean
    isColorLoading: boolean
    permissionObject: any
    primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color')
    secondaryColor = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    loggedInPersonId: string
    discoveryInprogressMessage = ''
    numberOfDiscoveryInprogressUsers = 0

    constructor(
        private store: Store<any>,
        private mixpanelService: MixpanelService,
        private mainUsersService: MainUsersService
    ) {
        this.chartLabels = []
        this.chartValues = []
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
        this.loggedInPersonId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
    }

    private lastFetchedPersonsKey: string | null = null

    ngOnInit(): void {
        this.getParticipantsDetail()

        this.store
            .select((store) => store.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.accountColorPayload?.data?.secondaryColor && store?.accountColorPayload?.data?.primaryColor) {
                    this.primaryColor = store?.accountColorPayload?.data?.primaryColor
                    this.secondaryColor = store?.accountColorPayload?.data?.secondaryColor
                }
                this.isColorLoading = store?.getAccountColorLoading
            })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response?.userProfileUpdateStatus === 4) {
                    // The edit genuinely changed one of these participants' data, so the cached
                    // response (still valid for up to PARTICIPANTS_DETAIL_CACHE_TTL_MS) must
                    // not be replayed here - force a real network refetch.
                    this.mainUsersService.clearParticipantsDetailCache()
                    this.lastFetchedPersonsKey = null
                    this.getParticipantsDetail()
                }
            })
    }

    ngOnChanges(changes: SimpleChanges): void {
        // `status` (sidebar collapse/expand) also flows through this @Input - only a genuine
        // change to *which* people are selected should trigger a re-fetch.
        if (changes['selectedPersons']) {
            this.getParticipantsDetail()
        }
    }

    getParticipantsDetail() {
        const key = JSON.stringify([...(this.selectedPersons ?? [])].sort())
        if (key === this.lastFetchedPersonsKey) return
        this.lastFetchedPersonsKey = key

        const participantsList = this.selectedPersons?.map((item: any) => {
            return {
                personId: item,
            }
        })
        if (!participantsList?.length) return
        this.mixpanelService.track('Get Participant Details Request', {
            accountID: this.accountId,
            participantsList: participantsList,
        })
        this.isUserDetailLoading = true
        this.mainUsersService
            .getParticipantsDetail({ accountId: this.accountId, participants: participantsList })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                // The selected group may have changed again before this resolves - a stale
                // response for the previous group must not overwrite the current group's UI state.
                next: (response) => {
                    if (key !== this.lastFetchedPersonsKey) return
                    this.handleParticipantDetailResponse(response)
                },
                error: (response) => {
                    if (key !== this.lastFetchedPersonsKey) return
                    this.isUserDetailLoading = false
                    console.log('[Mixpanel test] Get Participant Details Failed payload:', {
                        accountID: this.accountId,
                        loggedInPersonId: this.loggedInPersonId,
                        errorMessage: response,
                    })
                    this.mixpanelService.track('Get Participant Details Failed', {
                        accountID: this.accountId,
                        loggedInPersonId: this.loggedInPersonId,
                        errorMessage: response,
                    })
                },
            })
    }

    private handleParticipantDetailResponse(response: any) {
        this.isUserDetailLoading = false
        // Only ever called from getParticipantsDetail's `next:` callback (routes through
        // NetworkService.httpCall -> ApiErrorInterceptor - a real transport failure goes to the
        // sibling `error:` callback instead). Classify on `data` presence, not the dead `statusCode`
        // field: that field doesn't exist on any response anymore, so this condition was permanently
        // false and the group chart/discovery-progress data below were never being applied on a
        // real load.
        if (response?.body?.data) {
            const participantDetail = response?.body?.data
            this.mixpanelService.track('Get Participant Details Success', {
                accountID: this.accountId,
                participantDetail: participantDetail,
            })
            this.isSomeDiscoveryInProgress = false
            this.usersData = []
            for (const pIndex in this.selectedPersons) {
                // Match the response entry by personId rather than by array position: this
                // request's dedupe key (and getParticipantsDetail's own cache key in
                // main-users.service.ts) is built from SORTED personIds, so the response array's
                // order is not guaranteed to match `selectedPersons` order. Indexing positionally
                // would attach one participant's name/uniqueStyle to another participant's `id`.
                const personId = this.selectedPersons[pIndex]
                const detail = participantDetail?.find((item: any) => item?.personId === personId)
                if (detail?.completionDate == undefined) {
                    this.isSomeDiscoveryInProgress = true
                }
                this.usersData[pIndex] = {
                    id: personId,
                    firstName: detail?.firstName,
                    lastName: detail?.lastName,
                    uniqueStyle: detail?.uniqueStyle,
                }
            }
            const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color')
            const secondaryColor = getComputedStyle(document.body).getPropertyValue('--secondary-color')
            const uniqueStyles: any = {}
            const primaryColors: any = this.getColorVariants(primaryColor)
            const secondaryColors: any = this.getColorVariants(secondaryColor)
            const discoveryInprogressUser: string[] = []
            this.chartColors = []
            let primaryIndex = 0
            let secondryIndex = 0
            this.usersData?.forEach((element: any, i: number) => {
                uniqueStyles[element.uniqueStyle] = (uniqueStyles[element.uniqueStyle] || 0) + 1
                if (i < 10) {
                    if (i % 2 == 0) {
                        this.chartColors.push(primaryColors[primaryIndex])
                        primaryIndex++
                    } else {
                        this.chartColors.push(secondaryColors[secondryIndex])
                        secondryIndex++
                    }
                }
                if (!element.uniqueStyle) {
                    discoveryInprogressUser.push(`${element.firstName} ${element.lastName}`)
                }
            })

            // discoveryInprogressUser.push('Test User')
            this.numberOfDiscoveryInprogressUsers = discoveryInprogressUser.length
            this.discoveryInprogressMessage = discoveryInprogressUser.join(', ')

            this.chartLabels = Object.keys(uniqueStyles)
            this.chartValues = Object.values(uniqueStyles)
        } else {
            // Reachable now only for a genuine empty-data edge case (resolved response, no
            // participant data in body.data) - a real transport failure never reaches here at all
            // (see the comment above).
            console.log('[Mixpanel test] Get Participant Details Failed payload:', {
                accountID: this.accountId,
                loggedInPersonId: this.loggedInPersonId,
                errorMessage: response,
            })
            this.mixpanelService.track('Get Participant Details Failed', {
                accountID: this.accountId,
                loggedInPersonId: this.loggedInPersonId,
                errorMessage: response,
            })
        }
    }

    getColorVariants(color: string) {
        color = color.trim()
        const colorsArr = colorVariants({
            base: color,
            dark: { steps: 2, darken: 0.9, hueShift: 20, saturate: -0.1 },
            light: { steps: 2, lighten: 0.5, hueShift: -10, saturate: 0.5 },
        })

        colorsArr.unshift(colorsArr.splice(2, 1)[0])
        return colorsArr
    }
}
