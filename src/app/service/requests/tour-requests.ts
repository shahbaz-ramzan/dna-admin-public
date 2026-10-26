import { Inject, Injectable } from '@angular/core'
import K from 'src/app/constants/index'
import Request from 'src/app/service/requests'

@Injectable({
    providedIn: 'root',
})
export class TourRequests extends Request {
    constructor(@Inject('params') private params: any) {
        super(params)
    }

    static getActiveUserTours(userId: string) {
        return new Request(K.NETWORK.URL.GET_ACTIVE_USER_TOURS + '/' + userId, K.NETWORK.METHOD.GET)
    }

    static upsertUserTourState(payload: any) {
        return new Request(K.NETWORK.URL.UPSERT_USER_TOUR_STATE, K.NETWORK.METHOD.POST, payload)
    }

    static getActiveUserBanners(userId: string) {
        return new Request(K.NETWORK.URL.GET_ACTIVE_USER_BANNERS + '/' + userId, K.NETWORK.METHOD.GET)
    }

    static upsertUserBannerState(payload: any) {
        return new Request(K.NETWORK.URL.UPSERT_USER_BANNER_STATE, K.NETWORK.METHOD.POST, payload)
    }
}
