import { CommonModule } from '@angular/common'
import { Component, DestroyRef, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { MenuItem } from 'primeng/api'
import { ButtonModule } from 'primeng/button'
import { MenuModule } from 'primeng/menu'
import { RippleModule } from 'primeng/ripple'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { AppService } from 'src/app/service/app.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { getAllAccountsActionFailure, getAllAccountsActionSuccess } from '../../dashboard/dashboard.actions'
import { SettingsService } from '../../settings/settings.service'
import { getSubscriptionNameAction, getSubscriptionNameSuccessAction } from '../../settings/settingsStore/settings.actions'
import { UpdateColorAction } from '../../users/main-users/mainUserStore/main-users.actions'
import { GetLabelsComponent } from '../get-labels/get-labels.component'
import { OnboardingSetupAccountComponent } from '../onboarding-setup-account/onboarding-setup-account.component'
import { ReviewsLabelsComponent } from '../reviews-labels/reviews-labels.component'
import {
    onBoardingCompleteAction,
    updateAccountAction,
    updateAccountActionFailure,
    updateAccountActionSuccess,
    uploadLogoAction,
    uploadLogoActionSuccess,
} from '../store/onboarding.actions'
import { UploadLogoComponent } from '../upload-logo/upload-logo.component'

@Component({
    selector: 'app-on-boarding',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        RippleModule,
        MenuModule,
        LoadingSpinnerComponent,
        OnboardingSetupAccountComponent,
        UploadLogoComponent,
        GetLabelsComponent,
        ReviewsLabelsComponent,
    ],
    templateUrl: './on-boarding.component.html',
    styleUrls: ['./on-boarding.component.scss'],
})
export class OnBoardingComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    currentYear = new Date().getFullYear()
    user_object: any
    personId: string
    screenNo = 0
    accountName = ''
    participantLabel: any
    userLabel: any
    logo: any = null
    items: MenuItem[]
    logoFile: any = null
    isLogoLoading = false
    isValidationChecked = false
    updateAccountLoading = false
    getUserLabelsLoading = false
    redirecting = false
    getParticipantLabelsLoading = false
    isAccountValid = false
    isUserValid = false
    isReviewsLabelValid = false
    // isLogoValid: boolean = false;
    isLabelValid = false
    accountId: any
    accountObject: any
    userInfo: any
    currElement: any

    errorMessage: string

    constructor(
        private router: Router,
        private store: Store<{ onboardingReducer: any; settingsReducer: any }>,
        private actions: Actions,
        private msgService: MsgService,
        private settingsService: SettingsService,
        private mixpanelService: MixpanelService,
        private appService: AppService
    ) {
        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        this.user_object = JSON.parse(this.user_object)

        this.personId = this.user_object.personId

        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.accountObject = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')
        this.userInfo = JSON.parse(this.accountObject)
        this.accountName = this.userInfo.accountName
        this.userLabel = {
            id: this.userInfo?.namedUserLabel?.namedUserLabelId,
            name: this.userInfo?.namedUserLabel?.namedUserLabelName,
        }
        this.participantLabel = {
            id: this.userInfo?.participantLabel?.participantLabelId,
            name: this.userInfo?.participantLabel?.participantLabelName,
        }
        this.logo =
            this.userInfo?.cobrandingLogoPath && this.userInfo?.cobrandingLogoPath !== ''
                ? this.userInfo?.cobrandingLogoPath
                : '../../../../../assets/images/logo.svg'
        this.mixpanelService.track('Onboarding Page Viewed', {
            ...this.user_object,
            ...this.userInfo,
        })
    }

    ngOnInit(): void {
        if (this.userInfo?.isOnboardingComplete) this.router.navigate(['/'])

        this.store
            .select((state) => state.settingsReducer)
            .subscribe((store) => {
                if (store?.subscriptionNamePayload?.data) {
                    const permissions: any = this.settingsService.transformSubscriptionFeatures(store?.subscriptionNamePayload?.data?.subscriptionFeatures)
                    localStorage.setItem(K.APP.PERMISSION_OBJECT, Encryption.encryptData(JSON.stringify(permissions)))
                }
            })
        this.actions.pipe(ofType(getSubscriptionNameSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.subscriptionNamePayload?.body?.data) {
                this.mixpanelService.track('Get Subscription Features Success', {
                    ...this.user_object,
                    subscriptionFeatures: response?.subscriptionNamePayload,
                })
            }
            if (!this.currElement.isOnboardingComplete) {
                this.router.navigate(['/on-boarding'])
            }
            this.router.navigate(['/'])
        })

        this.items = [
            {
                label: 'Logout',
                command: () => this.onCloseClick(),
                icon: 'pi pi-fw pi-sign-out',
            },
        ]

        this.actions.pipe(ofType(getAllAccountsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.allAccountsPayload) {
                let allAccounts = response.allAccountsPayload?.body?.data?.namedUserAccountDtos
                this.mixpanelService.track('Get All Accounts List Success', { ...this.user_object, allAccounts: allAccounts })
                let isDefaultAccountExists = false
                allAccounts.forEach((element: any) => {
                    if (element.isDefault) {
                        isDefaultAccountExists = true
                        return
                    }
                })
                const accountsCopy = JSON.parse(JSON.stringify(allAccounts))
                if (!isDefaultAccountExists) {
                    accountsCopy[0]['isDefault'] = true
                    allAccounts = accountsCopy
                }
                allAccounts?.forEach((element: any) => {
                    if (element.isDefault) {
                        this.currElement = element
                        this.mixpanelService.createProfile({ AccountName: element.accountName })
                        localStorage.setItem(K.APP.ACCOUNT_ID_KEY, Encryption.encryptData(element?.accountId?.toString()))
                        localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(element)))
                        this.store.dispatch(getSubscriptionNameAction(element.accountId))
                    }
                })
            }
        })

        this.actions.pipe(ofType(getAllAccountsActionFailure), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            console.log('[Mixpanel test] Get All Accounts List Failed payload:', {
                ...this.user_object,
                errorMessage: response.error,
            })
            this.mixpanelService.track('Get All Accounts List Failed', {
                ...this.user_object,
                errorMessage: response.error,
            })
        })

        this.actions.pipe(ofType(updateAccountActionSuccess, updateAccountActionFailure), takeUntilDestroyed(this.destroyRef)).subscribe((action: any) => {
            if (action.updateAccountResponse?.body?.data) {
                this.mixpanelService.track('Update Account Details Success', {
                    ...this.user_object,
                    ...this.userInfo,
                    updatedDetails: action.updateAccountResponse.body.data,
                })
                localStorage.setItem(K.APP.ACCOUNT_OBJECT, Encryption.encryptData(JSON.stringify(action.updateAccountResponse.body.data)))
                this.router.navigate(['/'])
            } else {
                console.log('[Mixpanel test] Update Account Details Failed payload:', {
                    ...this.user_object,
                    ...this.userInfo,
                    errorMessage: action.error,
                })
                this.mixpanelService.track('Update Account Details Failed', {
                    ...this.user_object,
                    ...this.userInfo,
                    errorMessage: action.error,
                })
                this.screenNo = 1
            }
        })

        this.actions.pipe(ofType(uploadLogoActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.screenNo = this.screenNo + 1
        })

        this.store
            .select((state) => state.onboardingReducer)
            .subscribe((store) => {
                this.isLogoLoading = store.isLogoLoading
                this.updateAccountLoading = store.updateAccountLoading
                this.getUserLabelsLoading = store?.onboardingParticipantsLoading
                this.getParticipantLabelsLoading = store?.onboardingUsersLoading
            })
    }

    onNextClick() {
        switch (this.screenNo) {
            case 0:
                this.screenNo = this.screenNo + 1
                break

            case 1:
                this.accountValidation()
                if (this.isAccountValid) {
                    this.screenNo = this.screenNo + 1
                    this.isValidationChecked = false
                }
                break

            case 2:
                // this.logoValidation();
                // if (this.isLogoValid) {
                this.getParticipantLabelsLoading = true
                if (this.logoFile) {
                    this.store.dispatch(
                        uploadLogoAction({
                            accountLogo: this.logoFile,
                            accountId: this.accountId,
                        })
                    )
                } else this.screenNo = this.screenNo + 1
                this.isValidationChecked = false
                // }
                break

            case 3:
                this.participantLabelValidation()
                if (this.isLabelValid) {
                    this.getUserLabelsLoading = true
                    this.screenNo = this.screenNo + 1
                    this.isValidationChecked = false
                }
                break
            case 4:
                this.userLabelValidation()
                if (this.isReviewsLabelValid) {
                    this.isValidationChecked = false
                    this.store.dispatch(onBoardingCompleteAction({ onBoardingComplete: true }))
                    let accountInfo = null
                    accountInfo = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')
                    accountInfo = JSON.parse(accountInfo) || {}
                    const personId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
                    const requestData = {
                        accountName: this.accountName,
                        namedUserLabelId: this.userLabel?.id,
                        participantLabelId: this.participantLabel?.id,
                        accountId: accountInfo?.accountId,
                        defaultLanguageId: 22,
                        isOnboardingComplete: true,
                        personId,
                        isDefault: accountInfo.isDefault,
                    }
                    this.store.dispatch(
                        UpdateColorAction({
                            accountId: accountInfo?.accountId,
                            primaryColor: K.APP.DEFAULT_PRIMARY_COLOR,
                            secondaryColor: K.APP.DEFAULT_SECONDARY_COLOR,
                        })
                    )
                    this.store.dispatch(updateAccountAction(requestData))
                }
                break
        }
    }

    onCloseClick() {
        this.appService.logout()
    }
    onBackClick() {
        this.screenNo = this.screenNo - 1
    }
    getBusinessName(name: string) {
        this.accountName = name
        this.accountValidation()
    }
    getParticipantLabel(label: any) {
        this.participantLabel = label
        this.participantLabelValidation()
    }
    getUserLabel(reviewsLabel: any) {
        this.userLabel = reviewsLabel
        this.userLabelValidation()
    }

    setLogo(logo: any) {
        this.logoFile = logo
        if (logo) {
            const reader = new FileReader()
            reader.readAsDataURL(logo) //converting image into base64
            reader.onload = (e: any) => {
                this.logo = e.target['result']
            }
        } else this.logo = null
    }
    accountValidation() {
        this.isValidationChecked = true
        if (this.accountName.replace(/\s/g, '').length > 0) {
            if (this.accountName.search(/\s/g) === -1) {
                this.isAccountValid = true
            } else {
                console.log('account validation error..!!')
                this.errorMessage = 'Your business name cannot have spaces or extra characters.'
                this.isAccountValid = false
            }
        } else {
            this.errorMessage = 'Please Enter Business Name'
            this.isAccountValid = false
        }
    }
    // logoValidation() {
    //   this.isValidationChecked = true;
    //   if (this.logo != null) {
    //     this.isLogoValid = true;
    //   } else {
    //     this.isLogoValid = false;
    //   }
    // }
    participantLabelValidation() {
        this.isValidationChecked = true
        if (this.participantLabel.id) {
            this.isLabelValid = true
        } else {
            this.isLabelValid = false
        }
    }
    userLabelValidation() {
        this.isValidationChecked = true
        if (this.userLabel.id) {
            this.isReviewsLabelValid = true
        } else {
            this.isReviewsLabelValid = false
        }
    }
}
