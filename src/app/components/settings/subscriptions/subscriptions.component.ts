import { CommonModule, DatePipe } from '@angular/common'
import { Component, DestroyRef, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Store } from '@ngrx/store'
import { MenuItem } from 'primeng/api'
import { InputNumberModule } from 'primeng/inputnumber'
import { InputTextModule } from 'primeng/inputtext'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import { getSubscriptionAccountAction, getSubscriptionNameAction } from '../settingsStore/settings.actions'

@Component({
    selector: 'app-subscriptions',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputNumberModule, LoadingSpinnerComponent],
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.scss'],
})
export class SubscriptionsComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    accountId: any
    detailsLoading: boolean
    accountLoading: boolean
    items: MenuItem[] = []
    subscriptionExpiryDate: any
    today: Date = new Date()
    pipe = new DatePipe('en-US')
    link: string
    accountLink = 'dnabehavior.com'
    refferalCode: string
    linkData = 'Manage Subscription'
    subsName: string
    seatNumber: number
    subsID: number
    permissionObject: any
    subsStatus: string
    constructor(
        private store: Store<{ settingsReducer: any }>,
        private router: Router
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
    }

    ngOnInit(): void {
        this.store.dispatch(getSubscriptionAccountAction(this.accountId))
        this.store.dispatch(getSubscriptionNameAction(this.accountId))
        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.accountLoading = store?.getSubscriptionAccountLoading
                this.detailsLoading = store?.getSubscriptionUrlDetailsLoading
                const responseAccount = store?.subscriptionAccountPayload?.data[0]
                const responseDetails = store?.subscriptionUrlDetailsPayload?.data
                const responseName = store?.subscriptionNamePayload?.data
                if (responseAccount && responseDetails) {
                    this.subsName = responseName?.packageName
                    this.subsID = responseAccount?.subscriptionId
                    this.refferalCode = responseAccount?.subscriptionReferralCode
                    this.subscriptionExpiryDate = responseAccount?.subscriptionCurrentPeriodEndsAt
                    this.subscriptionExpiryDate = this.pipe.transform(this.subscriptionExpiryDate, 'dd-MM-yyyy')
                    this.link = responseDetails?.url
                    this.subsStatus = responseAccount?.subscriptionState ? 'Active' : 'InActive'
                }
            })
    }
    goToLink() {
        this.router.navigate([this.link])
    }
}
