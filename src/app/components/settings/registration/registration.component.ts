import { Clipboard } from '@angular/cdk/clipboard'
import { CommonModule } from '@angular/common'
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ConfirmationService } from 'primeng/api'
import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { DialogModule } from 'primeng/dialog'
import { DropdownModule } from 'primeng/dropdown'
import { InputTextModule } from 'primeng/inputtext'
import { InputTextareaModule } from 'primeng/inputtextarea'
import { ListboxModule } from 'primeng/listbox'
import { RadioButtonModule } from 'primeng/radiobutton'
import { RippleModule } from 'primeng/ripple'
import { TableModule } from 'primeng/table'
import { Tooltip, TooltipModule } from 'primeng/tooltip'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { SettingsService } from '../settings.service'
import {
    DELETE_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    EDIT_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    FAILURE_DELETE_TAG_ACTION,
    SAVE_SELF_REGISTRATION_LINK_FAILURE_ACTION,
    UPSERT_LEGAL_TEXT_ACTION_FAILURE,
    UPSERT_TAG_ACTION_FAILURE,
} from '../settingsStore/settings-actions-constants'
import {
    cancelSelfRegistrationModificationAction,
    deleteSelfRegistrationLink,
    deleteSelfRegistrationLinkSuccessAction,
    deleteTagAction,
    deleteTagActionSuccess,
    editSelfRegistrationLinkAction,
    editSelfRegistrationLinkSuccessAction,
    getFacilitatorsAction,
    getLegalTextAction,
    getLegalTextActionSuccess,
    getManageTagsAction,
    getSelfRegistrationLinksAction,
    saveSelfRegistrationLinkAction,
    saveSelfRegistrationLinkSuccessAction,
    setEditRegistrationLinkAction,
    upsertLegalTextAction,
    upsertLegalTextActionSuccess,
    upsertTagAction,
    upsertTagActionSuccess,
} from '../settingsStore/settings.actions'

interface workTalent {
    name: string
}
interface investor {
    name: string
}
@Component({
    selector: 'app-registration',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        CheckboxModule,
        DropdownModule,
        ListboxModule,
        RadioButtonModule,
        DialogModule,
        InputTextModule,
        InputTextareaModule,
        TableModule,
        ConfirmDialogModule,
        TooltipModule,
        LoadingSpinnerComponent,
    ],
    templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    @ViewChild('newTagRef') newTagRef: ElementRef
    legalTextUpdating = false
    updatedLegalText: string
    legalText: string
    textLoading: boolean
    isRegistrationLoading = false
    accountId: any
    isTagLoading = false
    private settingsReducerSnap: any
    discoverySettings: any[]
    workTalenttItem: workTalent[] = []
    investorItem: investor[] = []
    reports: any[] = []
    advisors: any[] = []
    languages: any[] = []
    displayModal = false
    newTag = ''
    tagsList: any[] = []
    @ViewChild(Tooltip) tooltip!: Tooltip
    selfRegistrationLinks: any[] = []
    isDefault = false
    selfRegistrationForm: any
    newUserLink: any
    modalTags: { tag: string; value: boolean } = { tag: '', value: false }
    tagIsSelected: any
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }
    isEdit = false
    savePressed = false
    permissionObject: any
    personId: string
    subscriptionName: string

    constructor(
        private confirmationService: ConfirmationService,
        private clipboard: Clipboard,
        private actions: Actions,
        private settingsService: SettingsService,
        private store: Store<{ settingsReducer: any }>,
        private msgService: MsgService,
        private mixpanelService: MixpanelService
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.personId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
        this.subscriptionName = Encryption.decryptData(localStorage.getItem(K.APP.SUBSCRIPTION_NAME) || '')
        this.languages = K.APP.LANGUAGES
        this.reports = K.APP.REPORT_TYPES
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
                        key: 'isTopTwoTraits',
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
                        key: 'isTopTwoTraits',
                        name: 'Top Two Traits',
                    },
                    {
                        key: 'isInteractiveInsights',
                        name: 'Interactive Insights',
                    },
                    {
                        key: 'isFinancialPlanningInsights',
                        name: 'Financial Planning Insights',
                    },
                    {
                        key: 'isRiskPortfolioGroup',
                        name: 'Risk Portfolio Group',
                    },

                    // {
                    //     key: 'isVideo',
                    //     name: 'Financial Behavior Video',
                    // },
                    // {
                    //     key: 'isBehavOverview',
                    //     name: 'Financial Behavior Overview',
                    // },
                    // {
                    //     key: 'isBehavioralBiases',
                    //     name: 'Behavioral Biases',
                    // },
                    // {
                    //     key: 'isMarketMood',
                    //     name: 'Market Mood',
                    // },

                    // {
                    //     key: 'isViewReport',
                    //     name: 'View Report',
                    // },
                ],
            },
        ]
        this.mixpanelService.track('Settings self registration page viewed', {
            accountID: this.accountId,
            personID: this.personId,
        })
    }

    ngOnInit(): void {
        this.store.dispatch(getLegalTextAction(this.accountId))
        this.store.dispatch(getSelfRegistrationLinksAction(this.accountId))
        this.store.dispatch(getManageTagsAction(this.accountId))
        this.store.dispatch(getFacilitatorsAction(this.accountId))
        this.systemLabels = this.settingsService.parseSystemLabels()
        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response) {
                    this.isRegistrationLoading = response.isRegistrationLoading
                    this.settingsReducerSnap = response

                    if (response?.legalTextPayload) {
                        this.legalText = response?.legalTextPayload?.data?.description
                        if (!this.legalTextUpdating) {
                            this.updatedLegalText = response?.legalTextPayload?.data?.description
                        }
                    }
                    if (response?.manageTagsPayload) {
                        this.tagsList = []
                        response?.manageTagsPayload?.data.forEach((element: any) => {
                            this.tagsList.push({
                                tagId: element.tagId,
                                name: element.tag,
                                value: false,
                            })
                        })
                    }

                    this.selfRegistrationLinks = []
                    response?.selfRegistrationLinkPayload?.data?.forEach((res: any) => {
                        this.selfRegistrationLinks.push({
                            accountId: res.accountId,
                            id: res.id,
                            copied: false,
                            link: res.selfRegistrationlink,
                            defaultLinkForAccount: res.isDefault,
                            tags: res.tagsList,

                            advisor: {
                                id: res.advisorPersonID,
                                name: res.advisorPersonName,
                            },
                            defaultLanguage: { name: 'English' },
                            reportsAvailable: { name: 'Investment' },
                            selectedCategory: this.discoverySettings[0],
                        })
                        this.isTagLoading = response.isTagLoading
                    })
                    if (this.selfRegistrationForm) {
                        if (this.isEdit === true && this.savePressed == false) {
                            this.selfRegistrationForm = this.settingsService.convertRegistrationLinkToLocalFormData(
                                response.registrationLinkToEdit,
                                this.discoverySettings,
                                this.advisors,
                                this.tagsList
                            )
                        } else if (this.isEdit === false && this.savePressed == false) {
                            this.addRegistrationLink()
                        }
                    }
                    this.advisors = response.facilitators.filter((facilitator: any) => facilitator.userRoleTypeId !== K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN)
                    if (response.registrationLinkToEdit && this.selfRegistrationForm == null) {
                        this.selfRegistrationForm = this.settingsService.convertRegistrationLinkToLocalFormData(
                            response.registrationLinkToEdit,
                            this.discoverySettings,
                            this.advisors,
                            this.tagsList
                        )
                    }
                }
            })

        this.actions.pipe(ofType(upsertTagActionSuccess, UPSERT_TAG_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef)).subscribe((action: any) => {
            if (action.response?.body?.data) {
                this.store.dispatch(getManageTagsAction(this.accountId))
                this.mixpanelService.track('Upsert Tag Success', {
                    accountID: this.accountId,
                    personID: this.personId,
                    response: action.response.body,
                })
                this.msgService.successMessage(action.response.body.data)
            } else {
                console.log('[Mixpanel test] Upsert Tag Failed payload:', {
                    accountID: this.accountId,
                    personID: this.personId,
                    errorMessage: action.error,
                })
                this.mixpanelService.track('Upsert Tag Failed', {
                    accountID: this.accountId,
                    personID: this.personId,
                    errorMessage: action.error,
                })
            }
        })

        this.actions.pipe(ofType(deleteTagActionSuccess, FAILURE_DELETE_TAG_ACTION), takeUntilDestroyed(this.destroyRef)).subscribe((action: any) => {
            if (action.response?.body?.data) {
                this.store.dispatch(getManageTagsAction(this.accountId))
                this.mixpanelService.track('Delete Tag Success', {
                    accountID: this.accountId,
                    personID: this.personId,
                })
                this.msgService.successMessage(action.response.body.data)
            } else {
                console.log('[Mixpanel test] Delete Tag Failed payload:', {
                    accountID: this.accountId,
                    personID: this.personId,
                    errorMessage: action.error,
                })
                this.mixpanelService.track('Delete Tag Failed', {
                    accountID: this.accountId,
                    personID: this.personId,
                    errorMessage: action.error,
                })
            }
        })

        this.actions
            .pipe(ofType(upsertLegalTextActionSuccess, UPSERT_LEGAL_TEXT_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.mixpanelService.track('Upsert legal text success', {
                        accountID: this.accountId,
                        personID: this.personId,
                        response: action.response,
                    })

                    this.store.dispatch(getLegalTextAction(this.accountId))
                } else {
                    console.log('[Mixpanel test] Upsert legal text failed payload:', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Upsert legal text failed', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                }
            })

        this.actions.pipe(ofType(getLegalTextActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            if (this.legalTextUpdating && this.textLoading) {
                this.textLoading = false
                this.legalTextUpdating = false
                this.msgService.successMessage('Legal text updated successfully')
            }
        })

        this.actions
            .pipe(ofType(deleteSelfRegistrationLinkSuccessAction, DELETE_SELF_REGISTRATION_LINK_FAILURE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.store.dispatch(getSelfRegistrationLinksAction(this.accountId))
                    this.mixpanelService.track('Delete self registration link success', {
                        accountID: this.accountId,
                        personID: this.personId,
                        response: action.response,
                    })

                    this.msgService.successMessage('Link deleted successfully')
                } else {
                    console.log('[Mixpanel test] Delete self registration link failed payload:', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Delete self registration link failed', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                }
            })

        this.actions
            .pipe(ofType(saveSelfRegistrationLinkSuccessAction, SAVE_SELF_REGISTRATION_LINK_FAILURE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.store.dispatch(getSelfRegistrationLinksAction(this.accountId))
                    this.mixpanelService.track('Save self registration link success', {
                        accountID: this.accountId,
                        personID: this.personId,
                    })

                    this.msgService.successMessage('Link added successfully')
                    this.resetRegistrationForm()
                } else {
                    console.log('[Mixpanel test] Save self registration link failed payload:', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Save self registration link failed', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                }
            })

        this.actions
            .pipe(ofType(editSelfRegistrationLinkSuccessAction, EDIT_SELF_REGISTRATION_LINK_FAILURE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.resetRegistrationForm()
                    this.store.dispatch(getSelfRegistrationLinksAction(this.accountId))
                    this.mixpanelService.track('Edit self registration link success', {
                        accountID: this.accountId,
                        personID: this.personId,
                        response: action.response,
                    })

                    this.msgService.successMessage('Link updated successfully')
                } else {
                    console.log('[Mixpanel test] Edit self registration link failed payload:', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Edit self registration link failed', {
                        accountID: this.accountId,
                        personID: this.personId,
                        errorMessage: action.error,
                    })
                }
            })
    }

    confirm(id: number, accountId: number) {
        this.mixpanelService.track('Delete self registration link button pressed', {
            accountID: this.accountId,
            personID: this.personId,
            registrationLinkId: id,
        })

        this.confirmationService.confirm({
            message: 'Are you sure that you want to delete this link?',
            accept: () => {
                this.store.dispatch(deleteSelfRegistrationLink({ id, accountId }))
            },
        })
    }

    showModalDialog() {
        this.displayModal = true
    }

    navigateToTagsHelp() {
        if (this.tooltip.active) {
            this.tooltip.deactivate()
        } else {
            this.tooltip.activate()
        }
    }

    addRegistrationLink() {
        this.isEdit = false
        this.newUserLink = {
            link: 'https://www.dnaBehavior.com',
            defaultLinkForAccount: false,
            tags: this.tagsList,
            accountId: this.accountId,
            advisor: {
                id: '',
                name: '',
            },
            defaultLanguage: this.languages[0],
            reportId: 0,
            selectedCategory: this.discoverySettings[this.subscriptionName.includes('bdna') ? 0 : 1],
            selectedSettings: [],
        }
        this.selfRegistrationForm = this.newUserLink
    }

    deleteRegistrationLink(id: number) {
        this.selfRegistrationLinks.splice(id, 1)
    }

    addNewTag() {
        if (this.newTag) {
            if (!this.newTagRef.nativeElement.validity.valid) return
            this.store.dispatch(
                upsertTagAction({
                    accountId: this.accountId,
                    tag: this.newTag,
                    defaultTag: this.isDefault,
                })
            )
            this.mixpanelService.track('Add new tag button pressed', {
                accountID: this.accountId,
                personID: this.personId,
                tag: this.newTag,
            })

            this.newTag = ''
        }
    }

    deleteTag(item: any) {
        this.mixpanelService.track('Delete tag button pressed', {
            accountID: this.accountId,
            personID: this.personId,
            tag: item,
        })

        this.confirmationService.confirm({
            message: `Are you sure to delete tag "${item.name}"?`,
            accept: () => {
                this.store.dispatch(deleteTagAction(item.tagId))
            },
        })
    }

    saveForm() {
        this.savePressed = true
        this.CheckBoxChange()
        if (this.tagIsSelected) {
            const requestPayload = this.settingsService.prepareRegistrationPayload(this.selfRegistrationForm, this.discoverySettings)

            if (this.settingsReducerSnap.registrationLinkToEdit) {
                this.store.dispatch(editSelfRegistrationLinkAction(requestPayload))
            } else {
                // explicitly setting selfRegistrationLink to empty string on link creation
                requestPayload.selfRegistrationlink = ''
                this.store.dispatch(saveSelfRegistrationLinkAction(requestPayload))
            }
            this.mixpanelService.track('Save registration form button pressed', {
                accountID: this.accountId,
                personID: this.personId,
                registrationLinkPayload: requestPayload,
            })

            this.isAnyTagChanged = false
        } else {
            this.msgService.errorMessage('Please Select a Tag')
        }
    }

    checkFormValidity() {
        let isAdvisorSelected = false
        let isTagSelected = false

        this.selfRegistrationForm?.tags?.forEach((tag: any) => {
            if (tag.value === true) {
                isTagSelected = true
                return
            }
        })

        if (this.selfRegistrationForm?.advisor?.id !== '') isAdvisorSelected = true
        return isAdvisorSelected && isTagSelected
    }

    resetRegistrationForm() {
        this.isAnyTagChanged = false
        this.selfRegistrationForm = null
        this.tagIsSelected = null
        this.savePressed = false
        this.store.dispatch(cancelSelfRegistrationModificationAction())
    }
    editLinks(index: any) {
        this.isEdit = true
        this.resetRegistrationForm()
        this.store.dispatch(setEditRegistrationLinkAction(this.accountId, this.selfRegistrationLinks[index].id))
    }
    tagsInArray(tags: any) {
        const tagArray: any = []
        for (const tag of tags) {
            if (tag.value) {
                tagArray.push(' ' + tag.name)
            }
        }
        return tagArray.toString()
    }
    copyMethod(link: any) {
        this.clipboard.copy(link)
        this.msgService.successMessage('Link Copied')
    }

    isAnyTagChanged = false
    CheckBoxChange() {
        this.isAnyTagChanged = true
        this.tagIsSelected = this.selfRegistrationForm.tags.find((tag: any) => tag.value === true) != null
    }

    tagsToolTip(tags: any) {
        let tagString = ''
        tags?.forEach((tag: any, index: number) => {
            tagString = tagString + (index === 0 ? '' : ', ') + tag.tag
        })
        return tagString
    }

    updateLegalText() {
        this.legalTextUpdating = true
    }

    resetLegalText() {
        this.legalTextUpdating = false
        this.updatedLegalText = this.legalText
    }

    upsertLegalText() {
        if (this.updatedLegalText.length > 1000) {
            this.msgService.errorMessage('Please enter legal text of length less than 1000 characters long.')
            return
        } else {
            this.textLoading = true
            this.store.dispatch(
                upsertLegalTextAction({
                    accountId: this.accountId,
                    description: this.updatedLegalText,
                    status: true,
                })
            )
            this.mixpanelService.track('Update legal text button pressed', {
                accountID: this.accountId,
                personID: this.personId,
                legalText: this.updatedLegalText,
            })
        }
    }

    onListBoxChange() {}
}
