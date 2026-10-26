import { CommonModule } from '@angular/common'
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ConfirmationService } from 'primeng/api'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { ButtonModule } from 'primeng/button'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { DialogModule } from 'primeng/dialog'
import { DropdownModule } from 'primeng/dropdown'
import { InputNumberModule } from 'primeng/inputnumber'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { SettingsService } from '../settings.service'
import { FAILURE_DELETE_USER_ROLE_ACTION, FAILURE_UPDATE_USER_ROLE_ACTION } from '../settingsStore/settings-actions-constants'
import {
    deleteUserRoleAction,
    getAccountSubscriptionDetailAction,
    getAccountSubscriptionDetailSuccessAction,
    getAccountSubscriptionDetailFailureAction,
    getSubscriptionAccountAction,
    getUserRolesAction,
    getUsersAction,
    getUsersListAction,
    getUsersListActionSuccess,
    getUsersListActionFailure,
    saveSubscriptionComponentAction,
    saveSubscriptionComponentActionSuccess,
    successDeleteUserRoleAction,
    successUpdateUserRoleAction,
    successUserRolesAction,
    failureUserRolesAction,
    updateUserRoleAction,
} from '../settingsStore/settings.actions'
@Component({
    selector: 'app-invite',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        RippleModule,
        AutoCompleteModule,
        ProgressSpinnerModule,
        DropdownModule,
        ConfirmDialogModule,
        DialogModule,
        InputNumberModule,
        LoadingSpinnerComponent,
        TooltipModule,
    ],
    templateUrl: './invite.component.html',
    styleUrls: ['./invite.component.scss'],
})
export class InviteComponent implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef)
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    advisorSeats = 0
    staffSeats = 0
    validate = false
    displayedRoles: any = []
    roles: any = []
    selectedUserRole: any
    userForm: UntypedFormGroup
    selected: any
    users: any = []
    accountId: any
    value20 = 50
    isUserRolesLoading: boolean
    isUsersForInvitationLoading: boolean
    loggedInPersonId: any
    isLoggedInPersonStaff: boolean
    isUsersLoading: boolean
    isUpdateRoleLoading: boolean
    isDeleteUserLoading: boolean
    isAccountSubscriptionLoading: boolean
    usersForInvitation: any = []
    filteredUsers: any[]
    selectedUserForInvitation: any
    displayModal: boolean
    searchedQuery = ''

    currentSubscriptions: any = {
        advisor: {
            total: 0,
            using: 0,
        },
        staff: {
            total: 0,
            using: 0,
        },
        addUsersURL: '',
    }
    systemLabels: {
        namedUserLabel: string
        participantLabelName: string
    }
    permissionObject: any
    duplicateUsersList: any = []
    savingSubscriptionComponent: boolean
    private readonly _userSearch$: Subject<string> = new Subject<string>()
    subsID: any
    isSubscriptionID = false

    constructor(
        private confirmationService: ConfirmationService,
        private settingsService: SettingsService,
        private store: Store<{ settingsReducer: any }>,
        private actions: Actions,
        private msgService: MsgService,
        private settingService: SettingsService,
        private mixpanelService: MixpanelService
    ) {
        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.loggedInPersonId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        this.mixpanelService.track('Settings Add Users Page Viewed', {
            accountId: this.accountId,
        })
        this.isLoggedInPersonStaff = false
    }
    confirm(personId: number) {
        this.confirmationService.confirm({
            message: `Are you sure that you want to delete this ${this.systemLabels.participantLabelName}?`,
            accept: () => {
                this.delete(personId)
            },
        })
    }

    ngOnInit(): void {
        this.store.dispatch(getUserRolesAction())

        this._userSearch$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe((search) => {
            this.store.dispatch(
                getUsersListAction({
                    accountId: this.accountId,
                    pageNumber: 1,
                    pageSize: 10,
                    search,
                })
            )
        })

        this.systemLabels = this.settingService.parseSystemLabels()
        this.actions.pipe(ofType(failureUserRolesAction), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            console.log('[Mixpanel test] Get User Role Failed payload:', {
                accountId: this.accountId,
                errorMessage: response.error,
            })
            this.mixpanelService.track('Get User Role Failed', {
                accountId: this.accountId,
                errorMessage: response.error,
            })
        })

        this.actions.pipe(ofType(successUserRolesAction), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            if (!response?.userRolesPayload?.body?.data) {
                return
            }
            this.mixpanelService.track('Get User Role Success', {
                accountId: this.accountId,
            })
            this.store.dispatch(getUsersAction(this.accountId, true))
        })

        this.actions
            .pipe(ofType(successDeleteUserRoleAction, FAILURE_DELETE_USER_ROLE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.mixpanelService.track('Delete User Success', {
                        accountId: this.accountId,
                        response: action.response,
                    })

                    this.store.dispatch(getUsersAction(this.accountId, true))
                } else {
                    console.log('[Mixpanel test] Delete User Failed payload:', {
                        accountId: this.accountId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Delete User Failed', {
                        accountId: this.accountId,
                        errorMessage: action.error,
                    })
                }
            })
        this.actions
            .pipe(ofType(successUpdateUserRoleAction, FAILURE_UPDATE_USER_ROLE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.mixpanelService.track('Update User Role Success', {
                        accountId: this.accountId,
                        response: action.response,
                    })

                    this.store.dispatch(getUsersAction(this.accountId, true))
                } else {
                    console.log('[Mixpanel test] Update User Role Failed payload:', {
                        accountId: this.accountId,
                        errorMessage: action.error,
                    })
                    this.mixpanelService.track('Update User Role Failed', {
                        accountId: this.accountId,
                        errorMessage: action.error,
                    })
                }
            })

        this.store.dispatch(getSubscriptionAccountAction(this.accountId))
        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                const responseAccount = store?.subscriptionAccountPayload?.data[0]
                this.savingSubscriptionComponent = store?.subscriptionComponentSaving
                if (responseAccount && !this.isSubscriptionID) {
                    this.subsID = responseAccount?.subscriptionId
                    this.isSubscriptionID = true
                    this.store.dispatch(saveSubscriptionComponentAction(this.subsID))
                }
            })

        this.actions.pipe(ofType(saveSubscriptionComponentActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.store.dispatch(getAccountSubscriptionDetailAction(this.accountId))
        })

        this.actions.pipe(ofType(getAccountSubscriptionDetailSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            const subsData = response?.response?.body?.data
            const subscriptionName = Encryption.decryptData(localStorage.getItem(K.APP.SUBSCRIPTION_NAME) || '')

            if (subsData) {
                this.mixpanelService.track('Get Account Subscription Details Success', {
                    subscriptionData: subsData,
                    accountId: this.accountId,
                    personId: this.loggedInPersonId,
                })
                if (this.settingsService.isNewPackage(subscriptionName)) {
                    this.currentSubscriptions['advisor']['total'] = subsData?.namedUserSeat ?? 0
                } else {
                    this.currentSubscriptions['advisor']['total'] = subsData?.namedUserSeat + 1 ?? 0
                }
                this.currentSubscriptions['staff']['total'] = subsData?.staffUserSeat ?? 0
                this.currentSubscriptions['addUsersURL'] = subsData?.url ?? ''
            }
        })

        this.actions.pipe(ofType(getAccountSubscriptionDetailFailureAction), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            console.log('[Mixpanel test] Get Account Subscription Details Failed payload:', {
                accountId: this.accountId,
                personId: this.loggedInPersonId,
                errorMessage: response.error,
            })
            this.mixpanelService.track('Get Account Subscription Details Failed', {
                accountId: this.accountId,
                personId: this.loggedInPersonId,
                errorMessage: response.error,
            })
        })

        this.actions.pipe(ofType(getUsersListActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            if (response?.usersListResponse?.body?.data) {
                this.mixpanelService.track('Get searched users list Success', {
                    accountId: this.accountId,
                    usersList: response.usersListResponse,
                })
                this.usersForInvitation = response.usersListResponse.body.data.userList
                this.populateSearchedUsers()
            }
        })

        this.actions.pipe(ofType(getUsersListActionFailure), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            console.log('[Mixpanel test] Get searched users list Failed payload:', {
                accountId: this.accountId,
                errorMessage: response?.error,
            })
            this.mixpanelService.track('Get searched users list Failed', {
                accountId: this.accountId,
                errorMessage: response?.error,
            })
        })

        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                this.isUserRolesLoading = res?.isUserRolesLoading
                this.isUsersLoading = res?.isUsersLoading
                this.isUsersForInvitationLoading = res?.isUsersForInvitationLoading
                this.isUpdateRoleLoading = res?.isUpdateRoleLoading
                this.isDeleteUserLoading = res?.isDeleteUserLoading
                this.isAccountSubscriptionLoading = res?.isAccountSubscriptionLoading

                this.roles = []
                this.displayedRoles = []
                if (res?.userRolesPayload)
                    res?.userRolesPayload?.data?.forEach((roleType: any) => {
                        let currSubscription
                        if (roleType.userTypeName === 'Facilitator') currSubscription = this.systemLabels.namedUserLabel
                        else if (roleType.userTypeName === 'Staff') currSubscription = 'Staff'

                        if (roleType.id === 2 || roleType.id === 5) {
                            this.roles.push({
                                id: roleType.id,
                                roleId: roleType.roleId,
                                name: roleType.roleName + ' (' + currSubscription + ')',
                                userTypeId: roleType.userTypeId,
                                userTypeName: roleType.userTypeName,
                            })
                        }

                        if (roleType.id === 2 || roleType.id === 5) {
                            this.displayedRoles.push({
                                id: roleType.id,
                                roleId: roleType.roleId,
                                name: roleType.roleName + ' (' + currSubscription + ')',
                                userTypeId: roleType.userTypeId,
                                userTypeName: roleType.userTypeName,
                            })
                        }
                    })

                this.users = []
                this.duplicateUsersList = []
                this.currentSubscriptions['advisor']['using'] = 0
                this.currentSubscriptions['staff']['using'] = 0
                if (res?.usersPayload) {
                    res?.usersPayload?.data?.forEach((user: any) => {
                        if (user.userRoleTypeId !== K.APP.USER_ROLE_TYPES.TOP_LEVEL_ADMIN) {
                            const userData: any = {
                                firstName: user.firstName,
                                lastName: user.lastName,
                                role: this.settingsService.parseUserRole(this.roles, user.userRoleTypeId),
                                email: user.username,
                                personId: user.personId,
                                inviteStatus: K.APP.INVITE_STATUS_ACCEPTED,
                            }
                            this.users.push(userData)
                            // this.mixpanelService.track('Named users list', {
                            //     accountId: this.accountId,
                            //     namedUsersList: this.users,
                            // })
                            this.duplicateUsersList.push({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                userRole: this.settingsService.parseUserRole(this.roles, user.userRoleTypeId),
                                email: user.username,
                                personId: user.personId,
                                inviteStatus: K.APP.INVITE_STATUS_ACCEPTED,
                            })
                            if (userData.role.userTypeName === 'Facilitator') this.currentSubscriptions['advisor']['using']++
                            else if (userData.role.userTypeName === 'Staff') {
                                if (userData.personId === this.loggedInPersonId) {
                                    this.isLoggedInPersonStaff = true
                                }
                                this.currentSubscriptions['staff']['using']++
                            }
                        }
                    })
                }
            })

        this.userForm = new UntypedFormGroup({
            user: new UntypedFormControl(null, [Validators.required]),
            role: new UntypedFormControl(null, Validators.required),
        })
    }

    populateSearchedUsers() {
        const filtered: any[] = []
        const query = this.searchedQuery
        for (let i = 0; i < this.usersForInvitation.length; i++) {
            const user = { ...this.usersForInvitation[i] }
            user['fullName'] = user['firstName'] + ' ' + user['lastName']
            if (user.fullName.toLowerCase().includes(query.toLowerCase())) {
                filtered.push(user)
            }
        }
        this.filteredUsers = filtered
    }

    filterUsersForInvitation(event: any) {
        this.searchedQuery = event.query
        this._userSearch$.next(this.searchedQuery)
    }

    showModalDialog() {
        if (this.currentSubscriptions['addUsersURL']) {
            window.open(this.currentSubscriptions['addUsersURL'])
        } else {
            this.msgService.errorMessage('There is no Subscription available for this account')
        }
    }

    delete(personId: number) {
        this.mixpanelService.track('Delete user button pressed', {
            accountId: this.accountId,
            deletedUserId: personId,
        })
        this.store.dispatch(deleteUserRoleAction(this.accountId, personId))
    }

    isFormValid(): boolean {
        if (!this.userForm.valid || !this.userForm?.value?.user?.personID) {
            return false
        } else return true
    }

    addUser(user: any) {
        // if (this.isLoggedInPersonStaff) {
        //     this.msgService.errorMessage('You are logged in as a Read-only user. Upgrade to manage users')
        //     return
        // }
        this.mixpanelService.track('Add user button pressed', {
            accountId: this.accountId,
            newUser: user,
        })
        if (user.role.userTypeName === 'Facilitator') {
            if (this.currentSubscriptions['advisor']['using'] < this.currentSubscriptions['advisor']['total']) {
                const data = {
                    personId: user.user.personID,
                    accountId: this.accountId,
                    userRoleTypeId: user.role.id,
                    status: true,
                }

                this.store.dispatch(updateUserRoleAction(data))
            } else {
                this.msgService.errorMessage(`You have used all the ${this.systemLabels.namedUserLabel} seats available in your current subscription`)
            }
        } else if (user.role.userTypeName === 'Staff') {
            if (this.currentSubscriptions['staff']['using'] < this.currentSubscriptions['staff']['total']) {
                const data = {
                    personId: user.user.personID,
                    accountId: this.accountId,
                    userRoleTypeId: user.role.id,
                    status: true,
                }
                this.store.dispatch(updateUserRoleAction(data))
            } else {
                this.msgService.errorMessage('You have used all the Staff seats available in your current subscription')
            }
        }
        this.userForm.reset()
    }
    updateSeats(inputForm: any) {
        if (inputForm.value.advisorSeats != '') {
            this.advisorSeats = inputForm.value.advisorSeats
        }
        if (inputForm.value.staffSeats != '') {
            this.staffSeats = inputForm.value.staffSeats
        }
    }
    checkValidate(inputForm: any) {
        if (
            (inputForm.value.advisorSeats != 0 && inputForm.value.advisorSeats != '') ||
            (inputForm.value.staffSeats != '' && inputForm.value.staffSeats != 0)
        ) {
            this.validate = true
        } else {
            this.validate = false
        }
    }
    onRoleChange(user: any) {
        this.mixpanelService.track('User role change request', {
            accountId: this.accountId,
            changedUserRole: user,
        })
        const currentRole = this.getUserCurrentRole(user.personId)

        if (currentRole.userTypeId === user.role.userTypeId) {
            const data = {
                personId: user.personId,
                accountId: this.accountId,
                userRoleTypeId: user.role.id,
                status: true,
            }
            this.store.dispatch(updateUserRoleAction(data))
        } else {
            if (user.role.userTypeName === 'Facilitator') {
                if (this.currentSubscriptions['advisor']['using'] < this.currentSubscriptions['advisor']['total']) {
                    const data = {
                        personId: user.personId,
                        accountId: this.accountId,
                        userRoleTypeId: user.role.id,
                        status: true,
                    }
                    this.store.dispatch(updateUserRoleAction(data))
                } else {
                    this.store.dispatch(getUsersAction(this.accountId, true))
                    this.msgService.errorMessage(`You have used all the ${this.systemLabels.namedUserLabel} seats available in your current subscription`)
                }
            } else if (user.role.userTypeName === 'Staff') {
                if (this.currentSubscriptions['staff']['using'] < this.currentSubscriptions['staff']['total']) {
                    const data = {
                        personId: user.personId,
                        accountId: this.accountId,
                        userRoleTypeId: user.role.id,
                        status: true,
                    }
                    this.store.dispatch(updateUserRoleAction(data))
                } else {
                    this.store.dispatch(getUsersAction(this.accountId, true))
                    this.msgService.errorMessage('You have used all the Staff seats available in your current subscription')
                }
            }
        }
    }
    getUserCurrentRole(personId: any): any {
        let role: any
        this.duplicateUsersList.forEach((user: any) => {
            if (user.personId === personId) {
                role = user.userRole
            }
        })
        return role
    }
    ngOnDestroy() {
        this._userSearch$.complete()
    }
}
