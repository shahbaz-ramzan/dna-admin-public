import { Clipboard } from '@angular/cdk/clipboard'
import { Component, DestroyRef, inject, Input, OnInit, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { Tooltip, TooltipModule } from 'primeng/tooltip'
import { AvatarModule } from 'primeng/avatar'
import { TagModule } from 'primeng/tag'
import { TreeSelectModule } from 'primeng/treeselect'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { RadioButtonModule } from 'primeng/radiobutton'
import { ListboxModule } from 'primeng/listbox'
import { CheckboxModule } from 'primeng/checkbox'
import { InputTextModule } from 'primeng/inputtext'
import { DropdownModule } from 'primeng/dropdown'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { SettingsService } from 'src/app/components/settings/settings.service'
import K from 'src/app/constants'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { MainUsersService } from '../../../main-users.service'
import {
    dontSetParticipantFaciliatorAction,
    dontUpdateParticipantProfilePictureAction,
    editParticipantFacilitatorAction,
    editParticipantFacilitatorSuccessAction,
    editParticipantProfileAction,
    editParticipantProfilePictureAction,
    editParticipantTagsAction,
    getCustomReportAccessDataAction,
    getCustomReportAccessDataActionSuccess,
    getFaciliatorSuccessAction,
    getFacilitatorAction,
    GetTagsActionSuccess,
} from '../../mainUserStore/main-users.actions'
import { selectMainUserState } from '../../mainUserStore/main-users.selectors'

@Component({
    selector: 'app-user-info-bar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AvatarModule,
        TagModule,
        TreeSelectModule,
        ButtonModule,
        DialogModule,
        RadioButtonModule,
        ListboxModule,
        CheckboxModule,
        InputTextModule,
        DropdownModule,
        TooltipModule,
        LoadingSpinnerComponent,
    ],
    templateUrl: './user-info-bar.component.html',
    styleUrls: ['./user-info-bar.component.scss'],
})
export class UserInfoBarComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    reportDp: any[]
    selectedReport: any
    participantReportModal = false
    coachingReportModal = false
    ingredient: string
    @Input() selectedUser: any = {}
    @Input() label: string
    @Input() isUserDetailLoading = false
    @Input() discoveryType: string
    @Input() index = 0
    @Input() singleUser = true
    loading = false
    discoverySettings: any
    coachingReportOptions: any
    selectedCategory: any
    selectedSettings: any = []
    selectedDiscoverySettings: any = {}
    @ViewChild(Tooltip) tooltip!: Tooltip
    isProfileUpdateLoading = false
    @ViewChild('modalForm') editForm: any
    displayModal: boolean
    uniqueStyle = [{ name: 'Strategist' }, { name: 'Community Builder' }]
    labelVariable = ''
    advisorVariable = ''
    newImageFile: any = null
    imageFormats: string
    root: string
    advisors: any[] = []
    tags: any[] = []
    private lastTagsResponse: any = null
    selectedTag: string
    selectedAdvisor: string
    selfRegistrationLinks: any[]
    selectedLink: any
    updatedSelfRegistrationLinks: any[] = []
    image: any
    user_object: any

    loggedInPersonId: any
    accountId: any
    canEditParticipant = true
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }
    tagIsSelected: boolean
    showSalesReportBtn = false
    showCoachingReportBtn = false
    private hasShownDigitalScanInfo = false
    hasShownDigitalScanHelp = false
    selectedCoachingOptions: any[] = []

    constructor(
        private store: Store<{ mainUserReducer: any; settingsReducer: any }>,
        private clipboard: Clipboard,
        private settingService: SettingsService,
        private msgService: MsgService,
        private actions: Actions,
        private router: Router,
        private route: ActivatedRoute,
        private messageService: MsgService,
        private userService: MainUsersService
    ) {
        this.imageFormats = 'image/*'
        this.discoverySettings = [
            {
                key: 'workTalentDashboardDto',
                name: 'Talent',
                settings: [
                    {
                        key: 'isVideo',
                        name: 'Work Talent Video',
                    },
                    {
                        key: 'isBDNA5KeyWorkTalents',
                        name: '5 Key Contrasting Work Talents',
                    },
                    {
                        key: 'topTraits',
                        name: 'Top Two Traits',
                    },
                    {
                        key: 'isDesiredTaskBasedTalent',
                        name: 'Desired Tasks based on Talents',
                    },
                    {
                        key: 'isPGuide',
                        name: 'Performance Keys',
                    },
                ],
            },
            {
                key: 'investorDashboardDto',
                name: 'Investor',
                settings: [
                    {
                        key: 'isFDNA5Score',
                        name: '5 Key Financial Behavior Insights',
                    },
                    {
                        key: 'isPGuide',
                        name: 'Performance Keys',
                    },
                    {
                        key: 'topTraits',
                        name: 'Top Two Traits',
                    },

                    {
                        key: 'interactiveInsights',
                        name: 'Interactive Insights',
                    },
                    {
                        key: 'isFinancialPlanningInsights',
                        name: 'Financial Planning Insights',
                    },
                    {
                        key: 'riskPortfolioGroup',
                        name: 'Risk Portfolio Group',
                    },
                ],
            },
        ]
        this.coachingReportOptions = [
            { key: 'bdna', name: 'Workplace Talents' },
            { key: 'fdna', name: 'Relationship to Money' },
        ]

        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        this.user_object = JSON.parse(this.user_object)

        this.loggedInPersonId = this.user_object.personId
        this.accountId = this.route.snapshot.queryParamMap.get('accountId')
    }

    ngOnInit(): void {
        setTimeout(() => {
            if (this.accountId) {
                this.showDigitalScanInfo()
                // Tags are already fetched once by the parent Users page on load
                // (GetTagsAction), and this component's own GetTagsActionSuccess listener
                // below picks them up from that fetch. Dispatching GetTagsAction again here
                // would re-trigger every other listener on that same success action across
                // the Users page (e.g. the main list's re-search), not just refresh this
                // info bar's tags.
                this.store.dispatch(getFacilitatorAction(this.accountId))
                this.store.dispatch(getCustomReportAccessDataAction())
            }
        }, 1000) //wait for the account id from url

        this.reportDp = [
            { label: 'Participant Report', value: 'participant-report' },
            { label: 'Factors Report', value: 'factors-report' },
            { label: 'Coaching Report', value: 'coaching-report' },

            // {
            //     label: 'Custom Reports',
            //     styleClass: 'cr-wrapper',
            //     selectable: false,
            //     children: [
            //         {
            //             label: 'Sales Talent DNA Report',
            //             value: 'sales-talent-dna-report',
            //         },
            //         {
            //             label: 'Coaching Report',
            //             value: 'coaching-report',
            //         },
            //     ],
            // },
        ]

        // this.userService
        //     .getCoachingReportAccess()
        //     .pipe(
        //         takeUntilDestroyed(this.destroyRef),
        //         map((response: any) => {
        //             if (response?.status === 200) {
        //                 console.log('Data', response?.body)
        //                 response.body.value.forEach((el: any) => {
        //                     if (el.AccountID == this.accountId) {
        //                         // this.showCoachingReportBtn = true
        //                         this.updateReportMenu()
        //                     }
        //                 })
        //             } else {
        //                 this.msgService.errorMessage('Failed to load coaching report access ')
        //             }
        //         }),
        //         catchError((error) => {
        //             console.error('Error fetching coaching report access:', error)
        //             this.msgService.errorMessage('Error loading coaching report access')
        //             this.updateReportMenu()
        //             return ''
        //         })
        //     )
        //     .subscribe()
        this.store
            .select((state) => state.settingsReducer)
            .subscribe((store) => {
                // `store.userRolePayload` is already the unwrapped body (settings.reducer.ts stores
                // `userRolePayload?.body`) - there's no `statusCode` field on it anymore, so this
                // condition was permanently false. Zero behavior change either way today, since the
                // block's own body is fully commented out - fixed for correctness so it's right if
                // that logic is ever re-enabled (same bug class as nav-bar's `subscriptionNamePayload`
                // and settings.component.ts's own `userRolePayload` read, both fixed this session).
                if (store?.userRolePayload?.data) {
                    // if (
                    //     store.userRolePayload.data.userRoleTypeId ===
                    //     K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN
                    // ) {
                    //     this.canEditParticipant = false;
                    // }
                }
            })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.facilitators) {
                    this.advisors = store?.facilitators
                }
                if (store?.tagsResponse && store.tagsResponse !== this.lastTagsResponse) {
                    this.lastTagsResponse = store.tagsResponse
                    this.setTags(store.tagsResponse)
                }
                this.handleProfileUpdateStatus(store)
                if (this.selectedUser?.isDigitalScanV1_5Imported && !this.hasShownDigitalScanInfo) {
                    this.showDigitalScanInfo()
                    this.hasShownDigitalScanInfo = true
                }
            })

        this.actions.pipe(ofType(GetTagsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
            this.setTags(res?.tagsResponse?.body?.data)
        })

        // getCustomReportAccessData's effect dispatches `response: undefined` on failure (no
        // toast - this endpoint's bespoke message was already dead/commented out before this
        // migration, so it stays silent, matching prior behavior).
        this.actions.pipe(ofType(getCustomReportAccessDataActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.value) return
            response.body.value.forEach((el: any) => {
                if (el.AccountID == this.accountId) {
                    this.showSalesReportBtn = true
                    this.updateReportMenu()
                }
            })
        })

        this.actions.pipe(ofType(getFaciliatorSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
            this.setAdvisors(res.response?.body?.data)
        })

        this.actions.pipe(ofType(editParticipantFacilitatorSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.store.dispatch(getFacilitatorAction(this.accountId))
        })

        this.systemLabels = this.settingService.parseSystemLabels()
        this.selectedCategory = this.discoverySettings[0]
        this.selectedSettings = this.discoverySettings[0]?.settings
    }

    updateReportMenu() {
        // First remove any existing custom reports
        // this.reportDp = this.reportDp.filter(
        //     (item) => item.value !== 'sales-talent-dna-report' && item.value !== 'coaching-report' && item.label !== 'Custom Reports'
        // )
        // If both accesses are present, add them as children
        // if (this.showSalesReportBtn && this.showCoachingReportBtn) {
        //     this.reportDp.push({
        //         label: 'Custom Reports',
        //         styleClass: 'cr-wrapper',
        //         selectable: false,
        //         children: [
        //             { label: 'Sales Talent DNA Report', value: 'sales-talent-dna-report' },
        //             { label: 'Coaching Report', value: 'coaching-report' },
        //         ],
        //     })
        // }
        // else {
        //     // Add individual reports as separate menu items
        //     if (this.showSalesReportBtn) {
        //         this.reportDp.push({
        //             label: 'Sales Talent DNA Report',
        //             value: 'sales-talent-dna-report',
        //         })
        //     }
        //     if (this.showCoachingReportBtn) {
        //         this.reportDp.push({
        //             label: 'Coaching Report',
        //             value: 'coaching-report',
        //         })
        //     }
        // }
    }
    showDigitalScanInfo() {
        if (!this.hasShownDigitalScanInfo && this.selectedUser?.isDigitalScanV1_5Imported && this.accountId) {
            this.messageService.digitalScanInfo(this.selectedUser.firstName + ' ' + this.selectedUser.lastName)
            this.hasShownDigitalScanInfo = true
        }
    }
    showDigitalScanHelp() {
        if (!this.hasShownDigitalScanHelp) {
            this.messageService.digitalScanHelp(this.selectedUser.personID)
            this.hasShownDigitalScanHelp = true
        }
    }

    handleProfileUpdateStatus(store: any) {
        if (store?.userProfileUpdateStatus > 0) {
            this.isProfileUpdateLoading = true
            if (store?.userProfileUpdateStatus === 4) {
                this.isProfileUpdateLoading = false
                this.resetForm()
            }
        } else {
            this.isProfileUpdateLoading = false
        }
    }

    setAdvisors(facilitators: any) {
        this.advisors = facilitators.filter((facilitator: any) => facilitator.userRoleTypeId !== K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN)
        if (this.selectedUser?.facilitator) {
            const selectedFacilitatorId = this.selectedUser.facilitator.facilitatorId
            const facilitator = facilitators?.find((facilitator: any) => facilitator?.facilitatorId === selectedFacilitatorId)

            if (facilitator) {
                this.selectedUser.facilitator.userRoleTypeId = facilitator.userRoleTypeId
            }
        }
    }

    setTags(tags: any) {
        this.tags = tags.map((t: any) => ({
            tagId: t.tagId,
            name: t.tag,
            value: false,
        }))
    }

    showMaximizableDialog() {
        if (!this.selectedUser?.isChangeAllow && this.loggedInPersonId !== this.selectedUser?.personID) {
            this.msgService.errorMessage('Case studies are shared between all accounts and cannot be modified.')
        } else {
            this.tags.forEach((tag) => {
                if (this.selectedUser?.tags?.map((userTag: any) => userTag.tag).includes(tag?.name)) tag.value = true
                else tag.value = false
            })
            this.setAdvisors(this.advisors)

            this.displayModal = true
            this.CheckBoxChange()
        }
    }
    tagsToolTip() {
        let tagString = ''
        this.selectedUser?.tags?.slice(1)?.forEach((tag: any, index: number) => {
            tagString = tagString + (index === 0 ? '' : ', ') + tag.tag
        })
        return tagString
    }

    resetForm() {
        this.newImageFile = null
        this.tags.forEach((tag) => {
            if (this.selectedUser?.tags?.map((userTag: any) => userTag.tag).includes(tag?.name)) tag.value = true
            else tag.value = false
        })
        this.displayModal = false
    }

    onSubmit() {
        const profilePayload = {
            id: this.selectedUser?.personID,
            firstName: this.editForm?.value?.firstName,
            lastName: this.editForm?.value?.lastName,
            email: this.editForm?.value?.email,
            username: this.editForm?.value?.email,
        }
        const picturePayload = {
            personId: this.selectedUser.personID,
            profilePicture: this.newImageFile,
        }

        const facilitatorPayload = {
            accountId: this.accountId,
            facilitatorId: this.editForm?.value?.advisor?.facilitatorId,
            participantId: this.selectedUser?.personID,
        }
        const tagsPayload = {
            accountId: this.accountId,
            personId: this.selectedUser?.personID,
            tagRequestDtos: this.tags.map((tag) => {
                return { tagId: tag.tagId, status: tag.value }
            }),
        }

        this.store.dispatch(editParticipantProfileAction(profilePayload))
        this.store.dispatch(editParticipantTagsAction(tagsPayload))

        if (this.newImageFile) this.store.dispatch(editParticipantProfilePictureAction(picturePayload))
        else this.store.dispatch(dontUpdateParticipantProfilePictureAction())

        if (this.selectedUser?.facilitator?.facilitatorId !== this.editForm?.value?.advisor?.facilitatorId)
            this.store.dispatch(editParticipantFacilitatorAction(facilitatorPayload))
        else this.store.dispatch(dontSetParticipantFaciliatorAction())
    }

    onImageSelect() {
        const file: any = document?.getElementById('browse-btn')
        this.newImageFile = file.files[0]
        const fReader = new FileReader()
        fReader.readAsDataURL(this.newImageFile)
        fReader.onloadend = function (event: any) {
            const img: any = document.getElementById('profile-pic')
            img.src = event.target.result
        }
    }

    copyMethod() {
        console.log(this.selectedUser)

        this.clipboard.copy(window.location.href)
        this.msgService.successMessage('Link copied')
    }

    onClick() {
        if (this.tooltip.active) {
            this.tooltip.deactivate()
        } else {
            this.tooltip.activate()
        }
    }

    checkFormValidity() {
        let isTagSelected = false

        this.tags?.forEach((tag: any) => {
            if (tag.value === true) {
                isTagSelected = true
                return
            }
        })

        return isTagSelected
    }

    CheckBoxChange() {
        this.tagIsSelected = this.tags.find((tag: any) => tag.value === true) != null
    }

    reportSelection(event?: any) {
        console.log(event)
        if (event.node?.value == 'participant-report') {
            this.participantReportModal = true
        } else if (event.node?.value === 'factors-report') {
            this.onCustomReportClick('factors-report')
        } else if (event.node?.value === 'sales-talent-dna-report') {
            this.onCustomReportClick('sales-report')
        } else if (event.node?.value === 'coaching-report') {
            this.selectedCoachingOptions = [...this.coachingReportOptions]

            this.coachingReportModal = true

            // this.onCustomReportClick('coaching-report')
        }
        this.selectedReport = null
    }
    onCoachingReportClick() {
        this.selectedCoachingOptions = [...this.coachingReportOptions]

        this.coachingReportModal = true
    }

    onCustomReportClick(reportType: string) {
        this.selectedDiscoverySettings = {}
        this.selectedSettings = this.discoverySettings[0].settings
        this.selectedSettings.forEach((element: any) => {
            const key = element.key
            this.selectedDiscoverySettings[key] = true
        })
        this.root = window.location.href.split('/')[3].split('?')[0]
        let discoverySettings = ''
        discoverySettings = this.selectedDiscoverySettings

        this.router.navigate([`/${this.root}/`, reportType], {
            queryParamsHandling: 'preserve',
            state: {
                discoverySettings: discoverySettings,
                participantName: this.selectedUser.firstName + ' ' + this.selectedUser.lastName,
                isDigitalScan: this.selectedUser.isDigitalScanV1_5Imported,
            },
        })
    }

    viewParticipantReport() {
        this.selectedDiscoverySettings = {}
        this.selectedSettings.forEach((element: any) => {
            const key = element.key
            this.selectedDiscoverySettings[key] = true
        })
        this.root = window.location.href.split('/')[3].split('?')[0]
        let discoverySettings = ''
        let reportType = ''
        if (this.selectedCategory.name === 'Investor') {
            reportType = 'participant-financial-report'
            discoverySettings = this.selectedDiscoverySettings
        } else {
            reportType = 'participant-business-report'
            discoverySettings = this.selectedDiscoverySettings
        }
        this.router.navigate([`/${this.root}/`, reportType], {
            queryParamsHandling: 'preserve',
            state: {
                discoverySettings: discoverySettings,
                participantName: this.selectedUser.firstName + ' ' + this.selectedUser.lastName,
                isDigitalScan: this.selectedUser.isDigitalScanV1_5Imported,
            },
        })
    }
    // Add method to handle coaching report navigation
    viewCoachingReport() {
        const selectedOptions = this.selectedCoachingOptions.map((option) => option.key)

        this.root = window.location.href.split('/')[3].split('?')[0]

        this.router.navigate([`/${this.root}/coaching-report`], {
            queryParamsHandling: 'merge',
            queryParams: {
                reportOptions: selectedOptions.join(','),
            },
            state: {
                participantName: this.selectedUser.firstName + ' ' + this.selectedUser.lastName,
                uniqueStyle: this.selectedUser.uniqueStyle,
                isDigitalScan: this.selectedUser.isDigitalScanV1_5Imported,
                selectedOptions: this.selectedCoachingOptions,
            },
        })

        this.coachingReportModal = false
    }

    emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    isValidEmail = (email: any) => this.emailRegex.test(email.value)

    getArticle(uniqueStyle: string): string {
        if (!uniqueStyle) return 'a'
        const vowels = ['a', 'e', 'i', 'o', 'u']
        return vowels.includes(uniqueStyle.toLowerCase().charAt(0)) ? 'an' : 'a'
    }
}
