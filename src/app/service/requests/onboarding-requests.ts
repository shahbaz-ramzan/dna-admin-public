import { Inject, Injectable } from '@angular/core'
import K from 'src/app/constants/index'
import Request from 'src/app/service/requests'
@Injectable({
    providedIn: 'root',
})
export class OnboardingRequests extends Request {
    constructor(@Inject('params') private params: any) {
        super(params)
    }

    static getOnboardingParticipantLabels() {
        return new Request(K.NETWORK.URL.GET_PARTICIPANT_LABELS, K.NETWORK.METHOD.GET)
    }
    static getOnboardingUserLabels() {
        return new Request(K.NETWORK.URL.GET_USER_LABELS, K.NETWORK.METHOD.GET)
    }

    static updateAccountDetails(payload: any) {
        return new Request(K.NETWORK.URL.UPDATE_ACCOUNT_DETAILS, K.NETWORK.METHOD.POST, payload)
    }

    static uploadAccountLogo(payload: any) {
        const formData = new FormData()
        formData.append('fileUpload', payload.accountLogo)
        return new Request(K.NETWORK.URL.UPLOAD_ACCOUNT_LOGO + '/' + payload.accountId, K.NETWORK.METHOD.POST, formData, {
            'Content-Type': 'multipart/form-data',
        })
    }
}
