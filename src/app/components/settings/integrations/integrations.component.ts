import { CommonModule } from '@angular/common'
import { Component, DestroyRef, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ButtonModule } from 'primeng/button'
import { TooltipModule } from 'primeng/tooltip'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import {
    checkZapierBulkStatusAction,
    checkZapierBulkStatusSuccessAction,
    zapierSyncAllAction,
    zapierSyncAllActionSuccess,
} from '../settingsStore/settings.actions'

@Component({
    selector: 'app-integrations',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule, LoadingSpinnerComponent],
    templateUrl: './integrations.component.html',
    styleUrls: ['./integrations.component.scss'],
})
export class IntegrationsComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    accountId: any
    loading: boolean
    isZapierBulkStatusInProgress = true
    syncInProgressMessage: string
    showSyncInProgressMessage = false

    constructor(
        private actions: Actions,
        private store: Store<{ settingsReducer: any }>
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
    }

    ngOnInit(): void {
        this.checkSyncStatus()
        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.loading = store?.checkStatusLoading
            })

        this.actions.pipe(ofType(zapierSyncAllActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (response?.body?.data[0]?.length) {
                this.syncInProgressMessage = response?.body?.data[0]
                this.showSyncInProgressMessage = true
            }
            this.checkSyncStatus()
        })

        this.actions.pipe(ofType(checkZapierBulkStatusSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            this.isZapierBulkStatusInProgress = response?.body?.data?.inProgress
        })
    }

    checkSyncStatus() {
        this.store.dispatch(checkZapierBulkStatusAction(this.accountId))
    }

    onSyncAll() {
        this.store.dispatch(zapierSyncAllAction(this.accountId))
        this.checkSyncStatus()
    }
}
