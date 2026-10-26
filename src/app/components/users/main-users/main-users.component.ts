import { CommonModule } from '@angular/common'
import { Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import * as moment from 'moment'
import { AvatarModule } from 'primeng/avatar'
import { ButtonModule } from 'primeng/button'
import { ConfirmPopupModule } from 'primeng/confirmpopup'
import { DialogModule } from 'primeng/dialog'
import { InputTextModule } from 'primeng/inputtext'
import { RippleModule } from 'primeng/ripple'
import { TableModule } from 'primeng/table'
import { TooltipModule } from 'primeng/tooltip'
import K from 'src/app/constants'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component'
import { PopoverButton, PopoverComponent, PopoverContent } from '../../common/popover/popover.component'
import { onBoardingCompleteAction } from '../../onboarding/store/onboarding.actions'
import { SettingsService } from '../../settings/settings.service'
import { MainUsersService } from '../main-users.service'
import { CustomizeThemeModalComponent } from './customize-theme-modal/customize-theme-modal.component'
import { DigitalScanFormComponent } from './digital-scan-form/digital-scan-form.component'
import { DoubleUserSelectionComponent } from './double-user-selection/double-user-selection.component'
import {
    dontSetParticipantFaciliatorAction,
    dontUpdateParticipantProfilePictureAction,
    editParticipantFacilitatorSuccessAction,
    editParticipantProfilePictureSuccessAction,
    editParticipantProfileSuccessAction,
    editParticipantTagsSuccessAction,
    exportUsersListAction,
    exportUsersListActionSuccess,
    GetTagsAction,
    GetUsersListAction,
    ResetUsersListAction,
    saveUserToAccountActionSuccess,
    searchMultipleAccountsActionSuccess,
} from './mainUserStore/main-users.actions'
import { SingleUserSelectionComponent } from './single-user-selection/single-user-selection.component'
import { ThreeUserSelectionComponent } from './three-user-selection/three-user-selection.component'
import { UserFiltersPayload, UserFiltersSidebarComponent } from './user-filters-sidebar/user-filters-sidebar.component'

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TableLazyLoadEvent } from 'primeng/table'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { getSelfRegistrationLinksAction } from '../../settings/settingsStore/settings.actions'
import { DigitalScanTourService } from './digital-scan-tour.service'
import { selectMainUserState } from './mainUserStore/main-users.selectors'
import { ParticipantAccountRemovalService } from './participant-account-removal.service'

@Component({
    selector: 'app-main-users',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        InputTextModule,
        AvatarModule,
        TableModule,
        TooltipModule,
        DialogModule,
        ConfirmPopupModule,
        LoadingSpinnerComponent,
        PopoverComponent,
        SingleUserSelectionComponent,
        DoubleUserSelectionComponent,
        ThreeUserSelectionComponent,
        UserFiltersSidebarComponent,
        CustomizeThemeModalComponent,
        DigitalScanFormComponent,
    ],
    templateUrl: './main-users.component.html',
    styleUrls: ['./main-users.component.scss'],
})
export class MainUsersComponent implements OnInit, OnDestroy {
    destroyRef = inject(DestroyRef)
    @ViewChild('usersTable') usersTable: any
    @ViewChild(SingleUserSelectionComponent)
    singleUserComponent: SingleUserSelectionComponent
    user_object: any
    loggedInPersonId: any
    selectedPersonId1: any
    selectedPersonId2: any
    accountId: any
    @ViewChild(DoubleUserSelectionComponent)
    doubleUserComponent: DoubleUserSelectionComponent
    colorApiLoading: boolean
    getTagsLoading: boolean
    search: string
    filtersModal: any = false
    customizeModal = false
    showTutorial: boolean = false
    tutorialLink: string
    status: boolean = false
    displayTutorialModal = false
    tScoreBackgroundColor = '#ffffff'
    inviteButtonValue: boolean = false
    getUsersListLoading: boolean
    exportUsersListLoading: boolean
    digitalScanLoading: boolean
    searchListLoading: boolean
    deleteUserLoading: boolean
    rawTags: any[] | null = null
    private currentFiltersPayload: UserFiltersPayload = {
        tagIds: [],
        isTagIdsFilterApplied: false,
        uniqueStyle: [],
        isUniqueStyleFilterApplied: false,
        scheduled: false,
        inProgress: false,
        completed: false,
        isStatusFilterApplied: false,
        isDateFilterApplied: false,
        fromDate: '',
        toDate: '',
        isFactorAndSubFactorFilterApplied: false,
        factorAndSubFactor: {},
    }
    selectedItems: any = []
    selectedPersons: string[] = []
    usersList: {
        personID: string
        firstName: string
        lastName: string
        uniqueStyle: string
        accountName: string
        profilePictureUrl: string
    }[] = []
    tagUsersList: any[] = []
    header: string[] = ['First Name', 'Last Name', 'Unique Style', 'Account', '']
    dataKeys: string[] = ['firstName', 'lastName', 'uniqueStyle', 'accountName']
    displayModal: boolean
    searchUserFilter: string = ''
    totalPages: number
    currentPage: number = 1
    totalRecords: number = 0
    sortyBy = ''
    ascending: boolean = false
    isFirstRender = true
    // Guards the page-number hydration in the queryParamMap subscriber below so it only runs
    // once per component mount (initial load / full browser reload) - that subscription stays
    // alive for the component's whole lifetime, so without this guard it would re-fire (and
    // incorrectly force currentPage back to 1) on every subsequent in-app URL change too,
    // including the ones loadMoreUsers() itself makes via updatePageQueryParam() while paginating.
    private hasHydratedPageFromUrl = false
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }
    permissionObject: any
    isAllaccountsList = false
    isUpdateSuccess = 0
    loggedInPersonDiscoveryStatus = true
    discoveryStatusModal = false
    selfRegistrationLink = ''
    timer: any = null
    DISCOVERY_STATUS_MODAL_SHOW_AFTER = 20000
    showDigitalScanBtn = false
    visible: boolean = false
    showInfoDialog: boolean = false
    openUsersPopoverListener?: () => void
    subscriptionStatus: boolean = false

    digitalScanTourState: any = null

    digitalScanTourId: number | null = null
    isSkippingTour = false
    hasShownPopoverOnInit = false

    popoverContent: PopoverContent = {
        title: 'Instantly Understand Your Client’s Behavior​',
        description: `The Digital Scan helps you quickly assess your client’s natural behavior using just their basic details - no questionnaires or forms required.`,
    }

    popoverButtons: PopoverButton[] = [
        {
            label: 'Skip for now',
            action: 'skip',
            class: 'p-button-secondary',
        },
        {
            label: 'Show Me How',
            action: 'start-tour',
            class: 'p-button-primary',
        },
    ]

    showCompletionDialog: boolean = false
    completionPopoverContent: PopoverContent = {
        title: 'Nice! You’re All Set.​',
        description: `Congrats — now you know how to run a Digital Scan like a pro. It's fast, simple, and gives you instant behavioral insights, a single digital scan can usually takes under a minute. Feel free to scan another client — just don't refresh the page.​`,
    }

    completionPopoverButtons: PopoverButton[] = [
        {
            label: 'Close',
            action: 'close-completion',
            class: 'p-button-primary',
        },
    ]

    constructor(
        readonly route: ActivatedRoute,
        public router: Router,
        private readonly msgService: MsgService,
        private readonly actions: Actions,
        private readonly mixpanelService: MixpanelService,
        private readonly store: Store<{ mainUserReducer: any }>,
        private readonly onBoardingStore: Store<{ onboardingReducer: any }>,
        private readonly settingsStore: Store<{ settingsReducer: any }>,
        private readonly settingService: SettingsService,
        private readonly mainUsersService: MainUsersService,
        private readonly digitalScanTourService: DigitalScanTourService,
        private readonly participantAccountRemovalService: ParticipantAccountRemovalService
    ) {}

    initializeTour(): void {
        this.digitalScanTourService.initializeTour(this)
    }

    // Bootstraps everything the Digital Scan feature needs: the user's tour progress (so the
    // one-time walkthrough popover knows whether to show), whether this account even has
    // Digital Scan access, and the credit/discovery-status chain that access depends on.
    initializeDigitalScanAccess(): void {
        this.digitalScanTourService.initializeDigitalScanAccess(this)
    }

    ngOnInit(): void {
        // /users and /myTeam both route to this component and share this same store slice.
        // Angular destroys/recreates the component on that route switch, but the store
        // doesn't - without this, the freshly-mounted page would briefly render the other
        // page's leftover list until its own fetch completes. Dispatched before the store
        // subscription below so that subscription's first (synchronous) emission already
        // reflects the reset, not the stale cross-page data.
        this.store.dispatch(ResetUsersListAction())

        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (this.user_object) this.user_object = JSON.parse(this.user_object)

        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) this.permissionObject = JSON.parse(this.permissionObject)
        this.loggedInPersonId = this.user_object.personId
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')

        this.subscriptionStatus = localStorage.getItem('subscriptionStatus') === 'active'
        this.systemLabels = this.settingService.parseSystemLabels()
        this.store.dispatch(GetTagsAction({ accountId: this.accountId }))
        this.store.dispatch(getSelfRegistrationLinksAction(this.accountId))
        // The initial list fetch is now driven by the filter sidebar's (filtersHydrated) event
        // once it finishes reading filters from the URL (see onFiltersHydrated) - not from here,
        // since at this point the sidebar hasn't hydrated yet and searchParticipantsByFilters()
        // would use the default (no-filters) payload even if the URL has filters applied.

        this.initializeDigitalScanAccess()

        this.actions.pipe(ofType(exportUsersListActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            const exportedUsersList = this.mainUsersService.downloadParticipantsCsv(response?.exportedUsersListResponse?.body?.data)
            if (exportedUsersList.length) {
                this.mixpanelService.track('Participants Exported', {
                    accountID: this.accountId,
                    personId: this.loggedInPersonId,
                    users: exportedUsersList,
                })
            }
        })

        this.settingsStore
            .select((store) => store.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.selfRegistrationLinkPayload) {
                    if (store.selfRegistrationLinkPayload?.data.length > 0) {
                        this.selfRegistrationLink = store.selfRegistrationLinkPayload?.data[0]?.selfRegistrationlink
                    }
                }
            })

        this.actions
            .pipe(ofType(dontUpdateParticipantProfilePictureAction, dontSetParticipantFaciliatorAction), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.trackProfileUpdateSuccess()
            })
        this.actions.pipe(ofType(saveUserToAccountActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.onUserDeletedFromAccount()
        })
        this.actions
            .pipe(
                ofType(
                    editParticipantProfileSuccessAction,
                    editParticipantTagsSuccessAction,
                    editParticipantProfilePictureSuccessAction,
                    editParticipantFacilitatorSuccessAction
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {
                // main-users-list.effects.ts dispatches a dedicated *_FAILURE_ACTION on a real
                // transport error (see editParticipantProfile et al.) - these *SuccessAction types
                // only ever fire on a genuine success, so there's no envelope left to check here.
                // The old `body.statusCode === 200` check could never be true (that field doesn't
                // exist on the response anymore), so every successful edit was showing a blank
                // error toast (`errors.collections.error` was always undefined) instead of the
                // success tracking call.
                this.trackProfileUpdateSuccess()
            })

        this.actions.pipe(ofType(searchMultipleAccountsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ searchListResponse }) => {
            this.isAllaccountsList = true
            this.searchUserFilter = ''
            // A 204 (search genuinely found zero participants across all accounts) has a null
            // body, so `searchListResponse?.body?.data` is undefined - fall back to an
            // empty-shaped object instead of skipping the update below, otherwise a real
            // "no results" response left the table showing whatever the previous search rendered.
            const reponse = searchListResponse?.body?.data ?? { userList: [], noOfPage: 0 }
            this.totalPages = reponse?.noOfPage
            this.totalRecords = this.totalPages * 10
            this.usersList = [...(reponse?.userList ?? [])]
            this.syncTagUsersAndSelectedItems()
        })

        this.onBoardingStore
            .select((state) => state.onboardingReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.onBoardingPayload?.onBoardingComplete) {
                    this.displayTutorialModal = true
                    this.onBoardingStore.dispatch(
                        onBoardingCompleteAction({
                            onBoardingComplete: false,
                        })
                    )
                }
            })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.searchListLoading = store?.searchListLoading
                this.getUsersListLoading = store?.getUsersListLoading
                this.exportUsersListLoading = store?.exportUsersListLoading
                this.getTagsLoading = store?.getTagsLoading
                this.digitalScanLoading = store?.digitalScanLoading
                if (store?.usersListResponse && this.isAllaccountsList === false) {
                    this.totalPages = store?.usersListResponse?.noOfPage
                    this.totalRecords = this.totalPages * 10
                    this.usersList = [...(store?.usersListResponse?.userList ?? [])]
                    // selectMainUserState is a shared slice updated by many unrelated actions
                    // (reports, sorting order, etc. dispatched from single-user-selection's
                    // ngOnInit) - without this guard, each of those re-emissions re-triggers
                    // syncTagUsersAndSelectedItems() and its GetParticipantsDetails call even
                    // though usersListResponse itself hasn't changed.
                    if (store.usersListResponse !== this.lastSyncedUsersListResponse) {
                        this.lastSyncedUsersListResponse = store.usersListResponse
                        this.syncTagUsersAndSelectedItems()
                    }
                }

                if (store?.tagsResponse) {
                    // Rebuild the reference so the app-user-filters-sidebar child's ngOnChanges
                    // picks up the new tags and rebuilds its own filter-checkbox list.
                    this.rawTags = [...store.tagsResponse]
                }
                if (store?.userProfileUpdateStatus === 4) {
                    this.searchParticipantsByFilters()
                }
            })

        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((currentParams) => {
            const params = { ...currentParams }

            this.selectedPersons = params?.selectedParticipants?.split(',') || []
            if (this.selectedPersons.length > 0) {
                params['selectedParticipants'] = this.selectedPersons.toString()
                // this.accountId = params['accountId'];
            }
            if (this.selectedPersons.length == 0) delete params['selectedParticipants']
            if (this.selectedPersons.length != 1) {
                delete params['accountId']
            }
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: params,
            })
        })

        this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap: any) => {
            const params = paramMap.params

            if (params.selectedParticipants) {
                let selectedParticipants = params.selectedParticipants
                selectedParticipants = selectedParticipants.split(',')
                selectedParticipants.map(() => {
                    this.selectedPersons = selectedParticipants
                })

                // Selecting a participant (or navigating between /users and /myTeam with one
                // already selected) must never auto-collapse the table - `status` only changes
                // via the user's own explicit click on the toggle icon (handleSidebarStatus()).
            }

            // Restores the table's page across a full component remount (e.g. navigating to a
            // report and back) - without this, currentPage's default of 1 would silently reset
            // the user back to page 1 even if they'd been on page 3. Carved-out exception: with
            // no selection to protect, always land on page 1 instead - `selectedParticipants`
            // (not `this.selectedItems`, which is still empty at this point in the lifecycle)
            // is the signal, since it's already available directly from the URL.
            // Only on the FIRST emission - this subscription stays alive for the component's
            // whole lifetime, and every later emission (e.g. loadMoreUsers() navigating to
            // page=2 via updatePageQueryParam()) must leave currentPage exactly as pagination
            // set it, not re-hydrate it from the URL again.
            if (!this.hasHydratedPageFromUrl) {
                this.hasHydratedPageFromUrl = true
                const hasSelection = !!params.selectedParticipants
                const parsedPage = parseInt(params.page, 10)
                this.currentPage = hasSelection && parsedPage > 0 ? parsedPage : 1
                if (!hasSelection && params.page) {
                    this.updatePageQueryParam()
                }
            }

            // The URL is the source of truth for the selection. Navigating to /users while already on
            // it (the nav "Clients" link, the Discovery-incomplete modal's button) reuses this
            // component, so anyone no longer in selectedParticipants must be deselected here - table
            // checkbox and tag pill both. Reassigned, not mutated: p-table only re-reads
            // [(selection)] on a new reference, and the previous in-place `delete` left holes in the
            // array that kept the row's checkbox ticked.
            const urlPersonIds: string[] = params.selectedParticipants?.split(',') || []
            const isInUrl = (item: any) => urlPersonIds.includes(item?.personID)
            if (this.selectedItems.some((item: any) => !isInUrl(item))) {
                this.selectedItems = this.selectedItems.filter(isInUrl)
            }
            if (this.tagUsersList.some((item: any) => !isInUrl(item))) {
                this.tagUsersList = this.tagUsersList.filter(isInUrl)
            }
        })

        // Initialize tour configuration
        this.initializeTour()
    }

    downloadData() {
        this.searchParticipantsByFilters(true)
    }

    isSelectedItemIncluded(personId: string, items: any[]) {
        for (const item of items) {
            if (item?.personID == personId) {
                return true
            }
        }
        return false
    }

    // Several participant-edit actions (profile, tags, picture, facilitator) fire independently
    // but represent one logical "profile updated" event; this batches them into a single toast.
    private trackProfileUpdateSuccess() {
        this.isUpdateSuccess = this.isUpdateSuccess + 1
        if (this.isUpdateSuccess === 4) {
            this.msgService.successMessage('Profile updated successfully')
            this.isUpdateSuccess = 0
        }
    }

    private fetchingMissingPersonIds = new Set<string>()
    private lastSyncedUsersListResponse: any = null

    private syncTagUsersAndSelectedItems() {
        if (this.selectedPersons.length === 0) return
        this.usersList?.map((item: any) => {
            if (this.selectedPersons.includes(item.personID)) {
                if (!this.isSelectedItemIncluded(item.personID, this.tagUsersList)) {
                    this.tagUsersList.push(item)
                } else {
                    this.tagUsersList = this.tagUsersList.filter((filterItem: any) => filterItem.personID != item.personID)
                    this.tagUsersList.push(item)
                }
                if (!this.isSelectedItemIncluded(item.personID, this.selectedItems)) {
                    this.selectedItems.push(item)
                } else {
                    this.selectedItems = this.selectedItems.filter((filterItem: any) => filterItem.personID != item.personID)
                    this.selectedItems.push(item)
                }
            }
        })

        // A selected participant may not be on whatever page/filter of usersList just loaded
        // (e.g. returning from a report re-fetches page 1 fresh) - without this, the tag pill
        // for that participant silently disappears even though they're still selected.
        const missingPersonIds = this.selectedPersons.filter(
            (personId) => !this.isSelectedItemIncluded(personId, this.tagUsersList) && !this.fetchingMissingPersonIds.has(personId)
        )
        if (missingPersonIds.length > 0) {
            missingPersonIds.forEach((personId) => this.fetchingMissingPersonIds.add(personId))
            this.mainUsersService
                .getParticipantsDetail({
                    accountId: this.accountId,
                    participants: missingPersonIds.map((personId) => ({ personId })),
                })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (response: any) => {
                        const persons = response?.body?.data
                        if (Array.isArray(persons)) {
                            persons.forEach((person: any) => {
                                const item = { personID: person.personId, firstName: person.firstName, lastName: person.lastName }
                                if (!this.isSelectedItemIncluded(item.personID, this.tagUsersList)) {
                                    this.tagUsersList.push(item)
                                }
                            })
                        }
                        missingPersonIds.forEach((personId) => this.fetchingMissingPersonIds.delete(personId))
                    },
                    error: () => {
                        missingPersonIds.forEach((personId) => this.fetchingMissingPersonIds.delete(personId))
                    },
                })
        }
    }

    showFilterModal() {
        this.filtersModal = true
    }
    deleteUserConfirmation(event: any, user: any) {
        this.participantAccountRemovalService.deleteUserConfirmation(this, event, user)
    }

    startDiscovery() {
        window.open(this.selfRegistrationLink)
        this.discoveryStatusModal = false
    }

    userToDelete: any

    // Bound as [rowSelectable] on p-table - PrimeNG calls this both per-row (to gate individual
    // checkbox clicks it dispatches, alongside p-tableCheckbox's own [disabled]) and when the
    // header "select all" checkbox is toggled, so a bulk select can't sweep in participants whose
    // DNA discovery isn't completed yet (empty uniqueStyle) along with completed ones.
    isRowSelectable = (row: { data: any }) => !!row?.data?.uniqueStyle

    private onUserDeletedFromAccount(): void {
        this.participantAccountRemovalService.onUserDeletedFromAccount(this)
    }
    getSelectedItems() {
        if (this.selectedItems.length == 0) {
            this.selectedPersons = []
            this.tagUsersList = []
            // Only re-fetch if a search was actually active: clearing an empty search box
            // doesn't change what the table should show, so there's nothing to refresh.
            // If a search WAS active, the table is still showing those filtered results, so
            // clearing the box needs a fresh unfiltered fetch to match it.
            const hadActiveSearch = !!this.searchUserFilter
            this.searchUserFilter = ''
            if (hadActiveSearch) {
                this.resetToFirstPage()
                this.searchParticipantsByFilters()
            }
        } else {
            if (!this.loggedInPersonDiscoveryStatus && !this.router?.url?.includes('/myTeam')) {
                clearTimeout(this.timer)
                this.timer = setTimeout(() => {
                    this.mixpanelService.track('Pop-up to encourage new users to complete their discovery shown', {
                        personId: this.loggedInPersonId,
                        accountId: this.accountId,
                    })
                    this.discoveryStatusModal = true
                }, this.DISCOVERY_STATUS_MODAL_SHOW_AFTER)
            }
            if (this.selectedPersons.length > 0) {
                this.usersList?.map((item: any) => {
                    if (this.selectedPersons.includes(item.personID)) {
                        this.selectedPersons = this.selectedPersons.filter((value) => {
                            return value != item.personID
                        })
                    }

                    if (this.isSelectedItemIncluded(item.personID, this.tagUsersList)) {
                        this.tagUsersList = this.tagUsersList.filter((value) => {
                            return value.personID != item.personID
                        })
                    }
                })
            }
            this.selectedItems.map((item: any) => {
                if (!this.selectedPersons.includes(item?.personID)) {
                    // Reassign (not push) - double/three-user-selection's @Input() selectedPersons
                    // only re-fires ngOnChanges on a reference change, so mutating in place would
                    // silently skip fetching the newly added participant's detail.
                    this.selectedPersons = [...this.selectedPersons, item?.personID]
                }
                if (!this.isSelectedItemIncluded(item.personID, this.tagUsersList)) {
                    this.tagUsersList.push(item)
                }
            })
        }

        const params = { ...this.route.snapshot.queryParams }
        if (this.selectedPersons.length > 0) params['selectedParticipants'] = this.selectedPersons.toString()
        if (this.selectedPersons.length == 0) delete params['selectedParticipants']
        if (this.selectedPersons.length == 1) {
            params['accountId'] = this.selectedItems[0].accountId
        } else {
            delete params['accountId']
        }
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: params,
        })
    }

    searchUser() {
        this.resetToFirstPage()
        this.searchParticipantsByFilters()
    }

    loadMoreUsers(event: TableLazyLoadEvent) {
        if (!this.isFirstRender) {
            this.sortyBy = (event?.sortField || '') as string
            this.ascending = !!this.sortyBy && event.sortOrder == 1
            this.currentPage = event?.first ? (event.first + 10) / 10 : 1
            this.updatePageQueryParam()
            this.searchParticipantsByFilters()
        } else this.isFirstRender = false
    }

    private updatePageQueryParam() {
        const params = { ...this.route.snapshot.queryParams }
        if (this.currentPage > 1) {
            params['page'] = this.currentPage.toString()
        } else {
            delete params['page']
        }
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: params,
        })
    }

    // Changing what's being listed (filters, search) invalidates whatever page you were on -
    // page 5 of the old result set is meaningless against a new, likely-shorter one. Refreshing
    // the page must NOT go through this - that's meant to restore the page you were already on.
    private resetToFirstPage() {
        this.currentPage = 1
        this.updatePageQueryParam()
    }

    // Used by ParticipantAccountRemovalService.onUserDeletedFromAccount() for the one case that
    // still needs a real fetch: the removed participant was the last row on a page beyond page 1,
    // so that page no longer exists - step back to the previous (still-populated) page instead of
    // leaving the table empty.
    stepBackOnePageAndRefetch() {
        this.currentPage = Math.max(1, this.currentPage - 1)
        this.updatePageQueryParam()
        this.searchParticipantsByFilters()
    }

    onFiltersApplied(payload: UserFiltersPayload) {
        this.currentFiltersPayload = payload
        this.resetToFirstPage()
        this.searchParticipantsByFilters()
    }

    onFiltersReset(payload: UserFiltersPayload) {
        this.currentFiltersPayload = payload
        this.resetToFirstPage()
        this.searchParticipantsByFilters()
    }

    // Fired once the filter sidebar finishes hydrating its state from the URL's query params
    // (e.g. after a page refresh with filters already applied). This is what drives the
    // initial list fetch now, instead of GetTagsActionSuccess firing with the default
    // (no-filters) payload before the sidebar had a chance to read the URL.
    onFiltersHydrated(payload: UserFiltersPayload) {
        this.currentFiltersPayload = payload
        this.searchParticipantsByFilters()
    }

    searchParticipantsByFilters(isExport = false) {
        const f = this.currentFiltersPayload
        const fromDate = f.fromDate ? moment(f.fromDate).format('YYYY-MM-DD') : ''
        const toDate = f.toDate ? moment(f.toDate).format('YYYY-MM-DD') : ''

        const payload = {
            accountId: this.accountId,
            pageNumber: this.currentPage,
            pageSize: 10,
            search: this.searchUserFilter,
            isTagIdsFilterApplied: f.isTagIdsFilterApplied,
            tagIds: f.tagIds,
            isUniqueStyleFilterApplied: f.isUniqueStyleFilterApplied,
            uniqueStyle: f.uniqueStyle,
            isStatusFilterApplied: f.isStatusFilterApplied,
            scheduled: f.scheduled,
            inProgress: f.inProgress,
            completed: f.completed,
            isDateFilterApplied: f.isDateFilterApplied,
            fromDate,
            toDate,
            isFactorAndSubFactorFilterApplied: f.isFactorAndSubFactorFilterApplied,
            factorAndSubFactor: f.factorAndSubFactor,
            isTeamSearch: !!this.router?.url?.includes('/myTeam'),
            sortBy: this.sortyBy,
            ascending: this.ascending,
        }

        if (isExport) {
            this.store.dispatch(exportUsersListAction(payload))
        } else {
            this.isAllaccountsList = false
            this.getUsersListLoading = true
            this.store.dispatch(GetUsersListAction(payload))
        }
        this.filtersModal = false
    }

    usersTableSearch(v: any) {
        this.searchUserFilter = v.value
    }

    onDarkModeToggled() {
        if (this.selectedPersons.length == 1) {
            this.singleUserComponent?.createTScoreGraph()
        } else if (this.selectedPersons.length == 2) {
            this.doubleUserComponent?.createTScoreGraph()
        }
    }

    handleSidebarStatus() {
        this.status = !this.status
    }

    removeUser(personId: any) {
        this.selectedItems = this.selectedItems.filter((item: any) => {
            return item?.personID != personId
        })
        this.selectedPersons = this.selectedPersons.filter((item: any) => {
            return item != personId
        })
        this.tagUsersList = this.tagUsersList.filter((item: any) => {
            return item.personID != personId
        })
        // getSelectedItems() below already calls searchParticipantsByFilters() (and resets
        // searchUserFilter) when selectedItems is empty — this used to also do it directly,
        // firing the search API twice when unselecting the last participant.
        this.getSelectedItems()
    }

    showDialog() {
        this.digitalScanTourService.showDialog(this)
    }

    @ViewChild('digitalScan') digitalScan: any
    closeModal() {
        this.digitalScanTourService.closeModal(this)
    }
    onPopoverButtonClick(action: string): void {
        this.digitalScanTourService.onPopoverButtonClick(this, action)
    }

    onDigitalScanCompleted(): void {
        this.digitalScanTourService.onDigitalScanCompleted(this)
    }

    refetchUserList() {
        // No active selection - jump back to page 1 (and clear the `page` query param via
        // resetToFirstPage()) since there's no selection context worth preserving. With an
        // active selection, stay on the current page so it isn't disrupted.
        if (!this.selectedItems?.length) {
            this.resetToFirstPage()
        }
        this.searchParticipantsByFilters()
    }

    ngOnDestroy() {
        this.digitalScanTourService.cleanup(this)
    }
}
