import { Injectable } from '@angular/core'
import { NetworkService } from 'src/app/service/network.service'
import { AppcuesRequests } from './requests/appcues-requests'

// Short in-memory dedupe window, same role as SETTINGS_CACHE_TTL_MS in settings.service.ts -
// the localStorage layer in AppcuesManagementComponent is what actually avoids the loader flash.
const APPCUES_CACHE_TTL_MS = 30_000

@Injectable({
    providedIn: 'root',
})
export class AppcuesService {
    constructor(private networkService: NetworkService) {}

    getAllBannersCall(silent = false) {
        return this.networkService.httpCall(AppcuesRequests.getAllBanners(), APPCUES_CACHE_TTL_MS, silent)
    }

    getAllToursCall(silent = false) {
        return this.networkService.httpCall(AppcuesRequests.getAllTours(), APPCUES_CACHE_TTL_MS, silent)
    }

    createBannerCall(payload: any) {
        return this.networkService.httpCall(AppcuesRequests.createBanner(payload))
    }

    createTourCall(payload: any) {
        return this.networkService.httpCall(AppcuesRequests.createTour(payload))
    }
}
