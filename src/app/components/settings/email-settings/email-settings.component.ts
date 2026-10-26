import { CommonModule } from '@angular/common'
import { Component, DestroyRef, Input, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ButtonModule } from 'primeng/button'
import { InputSwitchModule } from 'primeng/inputswitch'
import { InputTextareaModule } from 'primeng/inputtextarea'
import { Tooltip, TooltipModule } from 'primeng/tooltip'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_FAILURE } from '../settingsStore/settings-actions-constants'
import {
    getCompletionEmailSettingsAction,
    getCompletionEmailSettingsActionSuccess,
    getCustomizeEmailTextAction,
    getCustomizeEmailTextActionSuccess,
    updateCompletionEmailSettingsAction,
    updateCompletionEmailSettingsActionSuccess,
    updateCustomizeEmailTextAction,
    updateCustomizeEmailTextActionSuccess,
} from '../settingsStore/settings.actions'

@Component({
    selector: 'app-email-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, InputSwitchModule, InputTextareaModule, ButtonModule, TooltipModule, LoadingSpinnerComponent],
    templateUrl: './email-settings.component.html',
    styleUrls: ['./email-settings.component.scss'],
})
export class EmailSettingsComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    @ViewChild(Tooltip) tooltip!: Tooltip
    @Input() isValidationChecked = false
    value!: string
    accountId: any
    personId: any
    checked = false
    loading = false
    customEmailText: string
    permissionObject: any

    constructor(
        private store: Store<{ settingsReducer: any }>,
        private actions: Actions,
        private msgService: MsgService
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')

        this.personId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
    }

    ngOnInit(): void {
        this.store.dispatch(getCompletionEmailSettingsAction(this.accountId))
        this.store.dispatch(getCustomizeEmailTextAction(this.accountId))

        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.loading =
                    store?.updateCompletionEmailSettingsLoading ||
                    store?.getCompletionEmailSettingsLoading ||
                    store?.updateCustomizeEmailTextLoading ||
                    store?.getCustomizeEmailTextLoading
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

        this.actions.pipe(ofType(getCustomizeEmailTextActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.customizeEmailTextResponse.status === 200) {
                const body = response?.customizeEmailTextResponse?.body
                if (body?.data?.length) {
                    this.customEmailText = body?.data[0].customMessage
                } else {
                    this.customEmailText =
                        "It looks like you started the DNA Natural Behavior Discovery but haven't completed it yet. By diving back in for just 10 minutes, you could have access to the personalized insights you signed up to receive. When you are ready to continue, just click on the link below. "
                }
            }
        })

        this.actions.pipe(ofType(updateCompletionEmailSettingsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.store.dispatch(getCompletionEmailSettingsAction(this.accountId))
        })

        this.actions
            .pipe(ofType(updateCustomizeEmailTextActionSuccess, UPDATE_CUSTOMIZE_EMAIL_TEXT_ACTION_FAILURE), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.store.dispatch(getCustomizeEmailTextAction(this.accountId))
            })
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

    saveCustomizeEmailText() {
        const payload = {
            id: 0,
            accountId: this.accountId,
            discoveryTypeId: 1,
            customMessage: this.customEmailText,
            customSenderName: 'The Team at DNA Behavior',
            status: true,
        }
        this.store.dispatch(updateCustomizeEmailTextAction(payload))
    }

    onTooltipInfoClick() {
        if (this.tooltip.active) {
            this.tooltip.deactivate()
        } else {
            this.tooltip.activate()
        }
    }
}
