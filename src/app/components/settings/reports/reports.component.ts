import { CommonModule } from '@angular/common'
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { InputTextModule } from 'primeng/inputtext'
import { TableModule } from 'primeng/table'
import { TabViewModule } from 'primeng/tabview'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { UPDATE_CUSTOM_REPORT_NAME_ACTION_FAILURE } from '../settingsStore/settings-actions-constants'
import {
    getCustomReportNamesAction,
    getDynamicWelcomeAction,
    getDynamicWelcomeActionSuccess,
    updateCustomReportNameAction,
    updateCustomReportNameActionSuccess,
    updateDynamicWelcomeAction,
} from '../settingsStore/settings.actions'
@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, InputTextModule, DialogModule, TableModule, TabViewModule, ButtonModule, LoadingSpinnerComponent],
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    visible: boolean
    @ViewChild('customNameRef') customNameRef: ElementRef

    dynamicWelcomeForm = new UntypedFormGroup({
        welcomeTitle: new UntypedFormControl('', Validators.required),
        message: new UntypedFormControl('', Validators.required),
        url: new UntypedFormControl('', [Validators.required, Validators.pattern(/^https:\/\/www\.youtube\.com\/embed\//)]),
    })
    activeTabIndex = 0
    isTabIndexChanged = false
    subscriptionName = ''
    dynamicScreenResponse: any
    personId: any
    accountId: any
    user_object: any = {
        personId: '',
        email: '',
        fullName: '',
        fisrtName: '',
        lastName: '',
    }
    selectedReport: any = {
        customReportName: '',
    }
    permissionObject: any = {}

    reports = [
        {
            reportId: K.APP.REPORTS.COMPARISON_REPORT_ID,
            name: 'Comparison',
            customReportName: 'Comparison',
        },
        {
            reportId: K.APP.REPORTS.TEAM_REPORT_ID,
            name: 'Team',
            customReportName: 'Team',
        },
        {
            reportId: K.APP.REPORTS.WORK_TALENT_REPORT_ID,
            name: 'Work Talent',
            customReportName: 'Work Talent',
        },
        {
            reportId: K.APP.REPORTS.FINANCIAL_BEHAVIOR_REPORT_ID,
            name: 'Financial Behavior',
            customReportName: 'Financial Behavior',
        },
    ]

    constructor(
        private store: Store<{ settingsReducer: any }>,
        private actions: Actions,
        private msgService: MsgService,
        private mixpanelService: MixpanelService
    ) {
        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (this.user_object) {
            this.user_object = JSON.parse(this.user_object)
        }

        this.subscriptionName = Encryption.decryptData(localStorage.getItem('subscriptionName'))

        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')

        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
    }
    customName: string
    getReportsLoading = false
    updateReportLoading = false
    dynamicWelcomeLoading = false
    updateDynamicWelcomeLoading = false
    ngOnInit(): void {
        this.store.dispatch(getCustomReportNamesAction(this.accountId))
        this.store.dispatch(getDynamicWelcomeAction(this.accountId))

        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response) {
                    this.getReportsLoading = response.getReportsLoading
                    this.updateReportLoading = response.updateReportLoading
                    this.dynamicWelcomeLoading = response.dynamicWelcomeLoading
                    this.updateDynamicWelcomeLoading = response.updateDynamicWelcomeLoading
                    if (response?.customReportNamesResponse) {
                        let customReportsCopy: any = []
                        customReportsCopy = [...response?.customReportNamesResponse?.customReports]
                        customReportsCopy?.sort((a: any, b: any) => a.reportId - b.reportId)
                        const mergedSubjects = this.reports.map((subject: any) => {
                            const otherSubject = customReportsCopy.find((element: any) => element.reportId === subject.reportId)
                            return { ...subject, ...otherSubject }
                        })
                        this.reports = [...mergedSubjects]
                    }
                }
            })

        this.actions
            .pipe(ofType(updateCustomReportNameActionSuccess, UPDATE_CUSTOM_REPORT_NAME_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (!action.error) {
                    this.selectedReport = {
                        customReportName: '',
                    }
                    this.store.dispatch(getCustomReportNamesAction(this.accountId))
                }
            })

        this.actions.pipe(ofType(getDynamicWelcomeActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            // financialBehaviorWelcomePage
            // workTalentWelcomePage
            if (response.status === 200) {
                const isWorkTalent = (this.isTabIndexChanged && this.activeTabIndex == 1) || (!this.isTabIndexChanged && this.subscriptionName.includes('bdna'))

                if (isWorkTalent) {
                    this.activeTabIndex = 1
                    this.dynamicScreenResponse = response.body.data.workTalentWelcomePage
                } else {
                    this.activeTabIndex = 0
                    this.dynamicScreenResponse = response.body.data.financialBehaviorWelcomePage
                }
                this.isTabIndexChanged = false

                const videoUrl = this.dynamicScreenResponse?.url.includes('embed')
                    ? this.dynamicScreenResponse?.url
                    : 'https://www.youtube.com/embed/mNfZJ812R4U'

                this.dynamicWelcomeForm.setValue({
                    welcomeTitle: this.dynamicScreenResponse?.welcomeTitle,
                    message: this.dynamicScreenResponse?.message,
                    url: videoUrl,
                })
            }
        })
    }
    showDialog(index: number) {
        this.selectedReport = { ...this.reports[index] }
        this.visible = true
    }

    saveReport() {
        if (this.selectedReport.customReportName) {
            this.selectedReport.customReportName.length
            if (!this.customNameRef.nativeElement.validity.valid || this.selectedReport.customReportName.length > 50) return
            const payload = {
                id: 0,
                reportId: this.selectedReport?.reportId,
                accountId: this.accountId,
                customReportName: this.selectedReport.customReportName,
                status: true,
            }
            this.store.dispatch(updateCustomReportNameAction(payload))
            this.visible = false
        }
    }

    // Dynamic welcome screen form methods
    onChangeTab(event: any) {
        this.activeTabIndex = event.index
        this.isTabIndexChanged = true
        this.store.dispatch(getDynamicWelcomeAction(this.accountId))
    }

    get welcomeTitle() {
        return this.dynamicWelcomeForm.get('welcomeTitle')
    }

    get url() {
        return this.dynamicWelcomeForm.get('url')
    }

    get message() {
        return this.dynamicWelcomeForm.get('message')
    }

    onSubmit() {
        const isFinancialBehavior = this.activeTabIndex == 0
        const requestBody = { ...this.dynamicWelcomeForm.value, isFinancialBehavior, accountId: this.accountId }
        this.store.dispatch(updateDynamicWelcomeAction(requestBody))
    }

    /**
     * Handle upgrade button click - redirect to subscription management
     */
    goToSubscription(): void {
        const url = 'https://share.hsforms.com/1_z2Un2T7QQKyagEnZAWRVActx8z'
        window.open(url, '_blank')
    }
}
