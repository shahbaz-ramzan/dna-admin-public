import { Component } from '@angular/core'
import { MessageService } from 'primeng/api'
import K from './constants'
import { MixpanelService } from './service/mixpanel.service'
import Encryption from './util/Encryption'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    title = 'DNA Behavior'
    isAccountSubscriptionLoading = false
    accountInfo: any
    constructor(
        private mixpanelService: MixpanelService,
        private msgService: MessageService
    ) {
        mixpanelService.init()
    }
    logMixpanelEvent(feedback: string, detail: string) {
        this.accountInfo = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || '')
        this.accountInfo = JSON.parse(this.accountInfo)
        this.mixpanelService.track('Digital Scan Feedback', {
            feedback: feedback,
            accountId: this.accountInfo.accountId,
            accountName: this.accountInfo.accountName,
            personId: detail,
        })
        this.msgService.clear('digitalScanHelp')
    }
}
