import { Injectable } from '@angular/core'
import { NetworkService } from 'src/app/service/network.service'
import { OnboardingRequests } from './requests/onboarding-requests'

@Injectable({
    providedIn: 'root',
})
export class OnboardingService {
    businessName = ''
    logo: any
    label = ''
    businessNameValidation = false
    constructor(private networkService: NetworkService) {}

    getOnboardingParticipantLabelsCall() {
        return this.networkService.httpCall(OnboardingRequests.getOnboardingParticipantLabels())
    }

    getOnboardingUserLabelsCall() {
        return this.networkService.httpCall(OnboardingRequests.getOnboardingUserLabels())
    }

    updateAccountDetails(payload: any) {
        return this.networkService.httpCall(OnboardingRequests.updateAccountDetails(payload))
    }

    uploadAccountLogo(payload: any) {
        return this.networkService.httpCall(OnboardingRequests.uploadAccountLogo(payload))
    }
}
