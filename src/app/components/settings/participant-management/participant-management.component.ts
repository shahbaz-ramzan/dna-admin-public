import { CommonModule } from '@angular/common'
import { Component, DestroyRef, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ConfirmationService } from 'primeng/api'
import { AvatarModule } from 'primeng/avatar'
import { ButtonModule } from 'primeng/button'
import { ConfirmPopupModule } from 'primeng/confirmpopup'
import { DialogModule } from 'primeng/dialog'
import { InputNumberModule } from 'primeng/inputnumber'
import { InputTextModule } from 'primeng/inputtext'
import { RadioButtonModule } from 'primeng/radiobutton'
import { RippleModule } from 'primeng/ripple'
import { SidebarModule } from 'primeng/sidebar'
import { TableLazyLoadEvent, TableModule } from 'primeng/table'
import { TooltipModule } from 'primeng/tooltip'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { environment } from 'src/environments/environment'
import { RESET_PASSWORD_ACTION_FAILURE, SAVE_USER_TO_ACCOUNT_ACTION_FAILURE } from '../settingsStore/settings-actions-constants'
import {
    getAllAccountsAction,
    getParticipantAccountsAction,
    resetPasswordAction,
    resetPasswordActionSuccess,
    saveUserToAccountAction,
    saveUserToAccountActionSuccess,
    topLevelAdminSearchUserAction,
    topLevelAdminSearchUserActionSuccess,
} from '../settingsStore/settings.actions'

@Component({
    selector: 'app-participant-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AvatarModule,
        InputTextModule,
        ButtonModule,
        RippleModule,
        TableModule,
        SidebarModule,
        RadioButtonModule,
        DialogModule,
        InputNumberModule,
        ConfirmPopupModule,
        LoadingSpinnerComponent,
        TooltipModule,
    ],
    templateUrl: './participant-management.component.html',
    styleUrls: ['./participant-management.component.scss'],
})
export class ParticipantManagementComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    searchUserFilter: any = ''
    participantRadio: string
    filterSider: any
    displayModal: boolean
    selectedUser: any = {}
    selectedUserFilter: any = {}
    isProfileUpdateLoading = false
    resetPasswordLoading = false
    tags: any[] = []
    uniqueStyle = [{ name: 'Strategist' }, { name: 'Community Builder' }]
    labelVariable = ''
    advisorVariable = ''
    newImageFile: any = null
    imageFormats: string
    root: string
    advisors: any[] = []
    selectedTag: string
    selectedAdvisor: string
    selfRegistrationLinks: any[]
    selectedLink: any
    updatedSelfRegistrationLinks: any[] = []
    image: any
    accountId: any
    personId: any = ''
    user_object: any = {}
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }
    tagIsSelected: boolean
    isTopLevelAdmin: any = false
    accountsList: any[]
    filteredAccountsList: any[]
    suggestions: any[]
    selectedAccount: any
    additionalAccountId: any
    isAdding = false

    onAccountInputChange(event: any) {
        this.additionalAccountId = event?.value
        if (this.additionalAccountId?.toString().length == 4) {
            for (let i = 0; i < this.accountsList.length; i++) {
                const item = this.accountsList[i]
                if (item?.accountID == this.additionalAccountId) {
                    this.selectedAccount = item
                    break
                }
            }
        } else {
            this.selectedAccount = null
        }
    }

    onAccountSelect(user: any) {
        if (user) {
            this.selectedAccount = user
        } else {
            this.selectedAccount = {}
        }
    }

    isTopLevelSearchLoading = false
    isUserSaving = false
    getParticipantAccountsLoading = false
    participantAllAccounts: any[] = []
    users: any[] = []
    totalRecords = 0
    totalPages = 0
    currentPage: number
    isFirstRender = true
    userFilters: any[] = []
    selectedParticipant: any = {}
    constructor(
        private router: Router,
        private store: Store<{ settingsReducer: any }>,
        private actions: Actions,
        private messageService: MsgService,
        private confirmationService: ConfirmationService
    ) {
        this.userFilters = K.APP.TOP_LEVEL_SEARCH_FILTERS
        this.filterSider = false
        this.isTopLevelAdmin = JSON.parse(localStorage.getItem('isTopLevelAdmin') || '')

        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        this.user_object = JSON.parse(this.user_object)

        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.personId = this.user_object.personId
        this.currentPage = 1
    }

    ngOnInit(): void {
        this.store.dispatch(getAllAccountsAction())
        if (!this.isTopLevelAdmin) {
            this.router.navigate([''])
        }
        this.selectedUserFilter = this.userFilters[0]
        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.isTopLevelSearchLoading = response?.isTopLevelSearchLoading
                this.resetPasswordLoading = response?.resetPasswordLoading
                this.isUserSaving = response?.isUserSaving
                this.getParticipantAccountsLoading = response?.getParticipantAccountsLoading
                if (response?.allAccountsResponse) {
                    this.accountsList = response?.allAccountsResponse?.data
                }
                if (response?.participantAllAccounts) {
                    this.participantAllAccounts = response?.participantAllAccounts?.data
                }
            })
        this.actions.pipe(ofType(topLevelAdminSearchUserActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            const bodyData = response?.topLevelUsersSearchResponse?.body?.data
            if (bodyData) {
                this.users = bodyData?.userList || []
                this.totalRecords = (bodyData?.noOfPage || 0) * 10
                this.totalPages = bodyData?.noOfPage
            } else {
                this.users = []
            }
        })

        this.actions.pipe(ofType(resetPasswordActionSuccess, RESET_PASSWORD_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef)).subscribe((action: any) => {
            const bodyData = action.response?.body?.data
            if (bodyData) {
                this.messageService.successMessage(bodyData)
            }
        })

        this.actions
            .pipe(ofType(saveUserToAccountActionSuccess, SAVE_USER_TO_ACCOUNT_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    if (this.isAdding) {
                        this.messageService.successMessage('Participant added to additional account successfully')
                    } else {
                        this.messageService.successMessage('Participant removed successfully')
                    }
                    this.displayModal = false
                    this.searchUser(1)
                }
            })
    }

    usersTableSearch(v: any) {
        this.searchUserFilter = v.value
    }
    validateEmail(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    searchUser(pageNumber: number) {
        this.currentPage = pageNumber
        if (this.searchUserFilter === '') {
            this.messageService.errorMessage('Please provide search value')
        } else if (this.selectedUserFilter.value == 'accountId' && isNaN(this.searchUserFilter)) {
            this.messageService.errorMessage('Please provide valid Account ID')
        } else if (this.selectedUserFilter.value === 'personId' && this.searchUserFilter.includes(' ')) {
            this.messageService.errorMessage('Please provide valid Person ID')
        } else if (this.selectedUserFilter.value == 'email' && !this.validateEmail(this.searchUserFilter)) {
            this.messageService.errorMessage('Please provide valid email')
        } else {
            const payload = {
                isAccountId: this.selectedUserFilter.value == 'accountId' ? true : false,
                isAccountName: this.selectedUserFilter.value == 'accountName' ? true : false,
                isPersonName: this.selectedUserFilter.value == 'name' ? true : false,
                isPersonID: this.selectedUserFilter.value == 'personId' ? true : false,
                isEmailAddress: this.selectedUserFilter.value == 'email' ? true : false,
                pageNumber: pageNumber,
                pageSize: 10,
                search: this.selectedUserFilter.value != 'accountId' ? this.searchUserFilter : '',
                accountId: this.selectedUserFilter.value == 'accountId' ? this.searchUserFilter : 0,
            }

            this.store.dispatch(topLevelAdminSearchUserAction(payload))
        }
    }

    loadMoreUsers(event: TableLazyLoadEvent) {
        if (!this.isFirstRender) {
            this.currentPage = event?.first ? (event.first + 10) / 10 : 1
            this.searchUser(this.currentPage)
        } else this.isFirstRender = false
    }

    onUserSelect(user: any) {
        this.selectedAccount = null
        this.filteredAccountsList = []
        this.additionalAccountId = null
        this.displayModal = true
        this.selectedUser = user
        this.store.dispatch(getParticipantAccountsAction(user.personID))
    }

    deleteUserConfirmation(event: any, accountId: any, personId: any) {
        this.confirmationService.confirm({
            target: event.target,
            message: `Are you sure you want to remove this user from this account? This cannot be undone.`,
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.saveUserToAccount(accountId, personId, false, 'Removed by top level admin')
            },
        })
    }

    resetPassword(personID: any) {
        this.store.dispatch(resetPasswordAction(personID))
    }

    saveUserToAccount(accountId: any, personId: any, isAdding: boolean, reason: string) {
        this.isAdding = isAdding
        let shouldSave = true

        if (this.isAdding) {
            this.participantAllAccounts.map((account) => {
                if (account.accountId === accountId) {
                    shouldSave = false
                    this.messageService.errorMessage('Participant already exist in this account')
                    return
                }
            })
        }
        if (!shouldSave) {
            return
        }

        if (accountId) {
            this.store.dispatch(
                saveUserToAccountAction({
                    status: isAdding,
                    accountId: accountId,
                    personID: personId,
                    relationship: 'S',
                    reason: reason,
                    isDefault: false,
                })
            )
        } else {
            this.messageService.errorMessage('Please enter additional account ID')
        }
    }

    viewUserProfile(data: any) {
        window.open(`${environment.hosting_url}users?selectedParticipants=${data.personID}&accountId=${data.accountId}`, '_blank')
    }

    showFilterModal() {
        this.filterSider = true
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

    resetForm() {
        this.newImageFile = null
        this.tags.forEach((tag) => {
            if (this.selectedUser?.tags?.map((userTag: any) => userTag.tag).includes(tag?.name)) tag.value = true
            else tag.value = false
        })
        this.displayModal = false
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

    CheckBoxChange() {
        this.tagIsSelected = this.tags.find((tag: any) => tag.value === true) != null
    }
}
