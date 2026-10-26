import { Injectable } from '@angular/core'
import { NetworkService } from 'src/app/service/network.service'
import { TourRequests } from './requests/tour-requests'

// Dashboard and the always-mounted nav bar both dispatch these on init for the same
// userId; a short cache coalesces those near-simultaneous calls into one request.
const TOUR_CACHE_TTL_MS = 30_000

@Injectable({
    providedIn: 'root',
})
export class TourService {
    constructor(private networkService: NetworkService) {}

    getActiveUserToursCall(userId: string) {
        return this.networkService.httpCall(TourRequests.getActiveUserTours(userId), TOUR_CACHE_TTL_MS)
    }

    upsertUserTourStateCall(payload: any) {
        return this.networkService.httpCall(TourRequests.upsertUserTourState(payload))
    }

    getActiveUserBannersCall(userId: string) {
        return this.networkService.httpCall(TourRequests.getActiveUserBanners(userId), TOUR_CACHE_TTL_MS)
    }

    upsertUserBannerStateCall(payload: any) {
        return this.networkService.httpCall(TourRequests.upsertUserBannerState(payload))
    }
}
