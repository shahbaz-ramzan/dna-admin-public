import { CommonModule } from '@angular/common'
import { Component, DestroyRef, inject, Input, OnInit, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { MenuItem } from 'primeng/api'
import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { DropdownModule } from 'primeng/dropdown'
import { InputTextModule } from 'primeng/inputtext'
import { Tooltip } from 'primeng/tooltip'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { SettingsService } from '../settings.service'
import {
    EDIT_ACCOUNT_DETAILS_FAILURE_ACTION,
    FAILURE_UPDATE_USER_ROLE_ACTION,
    FAILURE_UPLOAD_ACCOUNT_LOGO_ACTION,
    GRANT_TOP_LEVEL_ADMIN_ACTION_FAILURE,
    SAVE_USER_TO_ACCOUNT_ACTION_FAILURE,
    UPDATE_DEFAULT_TOGGLE_ACTION_FAILURE,
} from '../settingsStore/settings-actions-constants'
import {
    editAccountDetailAction,
    editAccountDetailSuccessAction,
    getCompletionEmailSettingsAction,
    getCompletionEmailSettingsActionSuccess,
    getDefaultToggleAction,
    getDefaultToggleActionSuccess,
    getLanguageAction,
    getParticipantLabels,
    getUserLabels,
    getUsersAction,
    grantTopLevelAdminAction,
    grantTopLevelAdminActionSuccess,
    saveUserToAccountActionSuccess,
    successUpdateUserRoleAction,
    SuccessUploadAccountLogo,
    successUsersAction,
    updateCompletionEmailSettingsAction,
    updateDefaultToggleAction,
    updateDefaultToggleActionSuccess,
    updateUserRoleAction,
    uploadAccountLogo,
} from '../settingsStore/settings.actions'

@Component({
    selector: 'app-account',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, DropdownModule, CheckboxModule, ButtonModule, LoadingSpinnerComponent],
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    @Input() isLogoValid = false
    @Input() isValidationChecked = false
    @ViewChild(Tooltip) tooltip!: Tooltip

    welcomeMessage: string
    welcomeTextarea: string
    videUrl: string

    checked = false
    selectedLogo: any
    permissionObject: any = {}
    items: MenuItem[] = []
    name = ''
    id = ''
    languages: any[] = []
    buttonVariable: false
    userId = ''
    participantLabels: any[] = []
    defaultToggleOptions = [
        {
            isFDNA: true,
            defaultToggleOptionName: 'Financial Behavior',
        },
        {
            isFDNA: false,
            defaultToggleOptionName: 'Work Talent',
        },
    ]
    userLabels: any[] = []
    private pendingDefaultToggleUpdate: { isFdNA: boolean; personId: string; accountID: string } | null = null
    imageFormats: string
    accountId: any
    isDefaultAccount = false
    isLoading = false
    isLogoLoading = false
    grantingAdminAccess = false
    personId: string
    adminGuid: string
    accountForm: any = {
        accountId: null,
        accountName: '',
        defaultLanguage: {
            id: null,
            name: '',
        },
        namedUserLabel: {
            namedUserLabelId: null,
            namedUserLabelName: '',
        },
        participantLabel: {
            participantLabelId: null,
            participantLabelName: '',
        },
        defaultToggleOption: {
            isFDNA: null,
            defaultToggleOptionName: '',
        },
        isOnboardingComplete: true,
        cobrandingLogoPath: '',
        isDefault: false,
        co_branding: false,
        reviews: '',
    }
    accessGranted = false
    constructor(
        private route: ActivatedRoute,
        private store: Store<{ settingsReducer: any }>,
        private service: SettingsService,
        private actions: Actions,
        private msgService: MsgService,
        private mixpanelService: MixpanelService
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        this.personId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
        this.languages = K.APP.LANGUAGES
        this.imageFormats = 'image/*'
        this.mixpanelService.track('Settings Account Page Viewed', {
            accountId: this.accountId,
            personId: this.personId,
        })
    }

    ngOnInit(): void {
        this.store.dispatch(getLanguageAction())
        this.store.dispatch(getParticipantLabels())
        this.store.dispatch(getUserLabels())
        this.store.dispatch(getUsersAction(this.accountId, true))
        this.store.dispatch(getCompletionEmailSettingsAction(this.accountId))
        this.store.dispatch(getDefaultToggleAction(this.personId, this.accountId))

        const selectedAccountInfo: any = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')

        let accountInfo: any = {}
        if (selectedAccountInfo) {
            accountInfo = JSON.parse(selectedAccountInfo)
        }
        this.isDefaultAccount = accountInfo['isDefault']

        this.accountForm = this.service.convertAccountInfoToLocalFormDta(accountInfo, this.languages)

        this.selectedLogo =
            this.accountForm.cobrandingLogoPath === undefined || this.accountForm.cobrandingLogoPath === ''
                ? '../../../../assets/images/logo.svg'
                : this.accountForm.cobrandingLogoPath

        this.actions.pipe(ofType(successUsersAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ usersPayload }) => {
            usersPayload?.body?.data.forEach((user: any) => {
                if (user?.userRoleTypeId === K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN) {
                    this.accessGranted = true
                }
            })
        })

        this.actions.pipe(ofType(getCompletionEmailSettingsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.completionEmailSettingsResponse.status === 200) {
                const body = response?.completionEmailSettingsResponse?.body
                if (body?.data?.length) {
                    this.checked = false
                } else {
                    this.checked = true
                }
            }
        })

        this.actions.pipe(ofType(updateCompletionEmailSettingsAction), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            setTimeout(() => {
                this.store.dispatch(getCompletionEmailSettingsAction(this.accountId))
            }, 2000)
        })

        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.isLoading =
                    store?.isAccountLoading ||
                    store?.isUsersLoading ||
                    store?.updateCompletionEmailSettingsLoading ||
                    store?.getCompletionEmailSettingsLoading ||
                    store?.getDefaultToggleLoading ||
                    store?.defaultToggleLoading

                this.isLogoLoading = store?.accountLogoLoading
                if (store?.participantLabelsPayload) {
                    this.participantLabels = []
                    store?.participantLabelsPayload?.data?.forEach((element: any) => {
                        this.participantLabels.push({
                            participantLabelId: element?.id,
                            participantLabelName: element?.label,
                        })
                    })
                }

                if (store?.userLabelsPayload) {
                    this.userLabels = []
                    store?.userLabelsPayload?.data?.forEach((element: any) => {
                        this.userLabels.push({
                            namedUserLabelId: element.userLabelReferenceId,
                            namedUserLabelName: element?.singularLabel,
                        })
                    })
                }
            })
        this.actions
            .pipe(ofType(editAccountDetailSuccessAction, EDIT_ACCOUNT_DETAILS_FAILURE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (action.response?.body?.data) {
                    this.mixpanelService.track('Edit Account Details Success', {
                        ...action.response.body.data,
                        personId: this.personId,
                    })
                    if (action.response.body.data.isDefault) {
                        this.isDefaultAccount = true
                    }
                    // settings.effects.ts's editAccount effect already merged this response onto the
                    // stored account object and re-persisted it before this action reached this
                    // subscriber - read that back rather than merging (or replacing) again here, so
                    // there's a single merge implementation instead of duplicated logic that can drift.
                    this.accountForm = this.service.convertAccountInfoToLocalFormDta(this.service.getStoredAccountObject() ?? action.response.body.data, this.languages)
                } else {
                    console.log('[Mixpanel test] Edit Account Details Failed payload:', {
                        ...accountInfo,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Edit Account Details Failed', {
                        ...accountInfo,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                }
                // Fire the default-toggle update only after the account-edit save has fully settled
                // (success or failure) rather than in parallel with it - see saveForm() for why:
                // both writers rebuild accountForm/ACCOUNT_OBJECT from whatever's in localStorage when
                // their own success handler runs, so dispatching them together made the final state
                // depend on whichever HTTP response happened to arrive last.
                if (this.pendingDefaultToggleUpdate) {
                    this.store.dispatch(updateDefaultToggleAction(this.pendingDefaultToggleUpdate))
                    this.pendingDefaultToggleUpdate = null
                }
            })

        this.actions
            .pipe(ofType(updateDefaultToggleActionSuccess, UPDATE_DEFAULT_TOGGLE_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.store.dispatch(getDefaultToggleAction(this.personId, this.accountId))
                }
            })

        this.actions.pipe(ofType(getDefaultToggleActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ getDefaultToggleResponse: response }) => {
            if (!response?.body?.data) return
            let accountInfoInLocal: any = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')
            const isFDNA = response.body.data.isFDNA
            accountInfoInLocal = JSON.parse(accountInfoInLocal)
            accountInfoInLocal['isFDNA'] = isFDNA
            this.accountForm = this.service.convertAccountInfoToLocalFormDta(accountInfoInLocal, this.languages)
            localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(accountInfoInLocal)))
            localStorage.setItem(K.APP.DEFAULT_IS_FDNA, Encryption.encryptData(isFDNA.toString()))
        })

        this.actions
            .pipe(ofType(SuccessUploadAccountLogo, FAILURE_UPLOAD_ACCOUNT_LOGO_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (action.accountLogoPayload?.body?.data) {
                    let accountInfoInLocal: any = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')
                    accountInfoInLocal = JSON.parse(accountInfoInLocal)
                    accountInfoInLocal['cobrandingLogoPath'] = action.accountLogoPayload.body.data
                    localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(accountInfoInLocal)))
                    this.msgService.successMessage('Logo updated successfully')
                }
            })

        this.actions
            .pipe(ofType(grantTopLevelAdminActionSuccess, GRANT_TOP_LEVEL_ADMIN_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.mixpanelService.track('Granting top level admin success', {
                        ...accountInfo,
                    })
                    this.msgService.successMessage('DNA Behavior Support Access Granted')
                    this.grantingAdminAccess = false
                    this.accessGranted = true
                    // this.store.dispatch(
                    //     saveUserToAccountAction({
                    //         status: true,
                    //         accountId: this.accountId,
                    //         personID: this.adminGuid,
                    //         relationship: null,
                    //         reason: 'Granting top level admin access',
                    //         isDefault: 0,
                    //     })
                    // )
                } else {
                    console.log('[Mixpanel test] Grant Top Level Admin Access Failed payload:', {
                        ...accountInfo,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Grant Top Level Admin Access Failed', {
                        ...accountInfo,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                    this.grantingAdminAccess = false
                }
            })

        this.actions
            .pipe(ofType(saveUserToAccountActionSuccess, SAVE_USER_TO_ACCOUNT_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.mixpanelService.track('Access granted to Top Level Admins', {
                        ...accountInfo,
                        personId: this.personId,
                        guid: this.adminGuid,
                    })
                    this.store.dispatch(
                        updateUserRoleAction({
                            personId: this.adminGuid,
                            accountId: this.accountId,
                            userRoleTypeId: K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN,
                            status: true,
                        })
                    )
                } else {
                    console.log('[Mixpanel test] Granting top level admin access failed payload:', {
                        ...accountInfo,
                        guid: this.adminGuid,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Granting top level admin access failed', {
                        ...accountInfo,
                        guid: this.adminGuid,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                    this.grantingAdminAccess = false
                }
            })

        this.actions
            .pipe(ofType(successUpdateUserRoleAction, FAILURE_UPDATE_USER_ROLE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.mixpanelService.track('Update User Role Success', {
                        ...accountInfo,
                        personId: this.personId,
                    })
                    this.grantingAdminAccess = false
                    this.accessGranted = true
                    this.msgService.successMessage('DNA Behavior Support Access Granted')
                } else {
                    console.log('[Mixpanel test] Update User Role Failed payload:', {
                        ...accountInfo,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Update User Role Failed', {
                        ...accountInfo,
                        personId: this.personId,
                        errorMessage: action.error,
                    })
                    this.grantingAdminAccess = false
                }
            })
    }

    deleteLogo() {
        this.selectedLogo = null
    }

    onLogoSelected(fileInput: any) {
        if (fileInput.target.files && fileInput.target.files[0]) {
            if (fileInput.target.files[0].size <= 2000000) {
                const reader = new FileReader()
                reader.readAsDataURL(fileInput.target.files[0]) //converting image into base64
                reader.onload = (e: any) => {
                    this.selectedLogo = e.target['result']
                }
                this.store.dispatch(
                    uploadAccountLogo({
                        accountLogo: fileInput.target.files[0],
                        accountId: this.accountId,
                    })
                )
            } else {
                this.msgService.errorMessage('Please upload an image with a file size of less than 2MB')
            }
        }
    }

    completionEmailSettingsChange(event: any) {
        const payload = {
            id: 0,
            accountId: this.accountId,
            status: !event.checked, //email opt-out = true
            discoveryTypeId: 1,
        }
        this.store.dispatch(updateCompletionEmailSettingsAction(payload))
    }

    saveForm() {
        this.accountForm['personId'] = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        const formData = this.service.prepareAccountInfoPayload(this.accountForm)
        this.mixpanelService.track('Account save button pressed', {
            ...formData,
            personId: this.personId,
        })
        // editAccountDetailAction and updateDefaultToggleAction both end up rebuilding accountForm/
        // ACCOUNT_OBJECT from whatever's in localStorage at the moment each of their success actions
        // happens to resolve. Dispatching them in parallel made that a genuine two-network-call race -
        // whichever finished last could read a snapshot taken before the other one's write landed and
        // stomp on it (e.g. the participant label reverting to its pre-save value). Queuing the toggle
        // update to fire only once the account-edit save has fully settled (see the
        // editAccountDetailSuccessAction/EDIT_ACCOUNT_DETAILS_FAILURE_ACTION subscriber below) makes the
        // two writes strictly sequential instead, so the final state no longer depends on which HTTP
        // response happens to arrive first.
        this.pendingDefaultToggleUpdate = { isFdNA: formData.isFDNA, personId: this.personId, accountID: this.accountId }
        this.store.dispatch(editAccountDetailAction(formData))
    }

    grantAccess() {
        this.mixpanelService.track('Grant top level admin access button pressed', {
            accountId: this.accountId,
            personId: this.personId,
        })
        this.grantingAdminAccess = true
        this.store.dispatch(grantTopLevelAdminAction(this.accountId))
    }
}
