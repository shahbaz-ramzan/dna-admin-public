import { Inject, Injectable } from '@angular/core'
import K from 'src/app/constants/index'
import Request from 'src/app/service/requests'

@Injectable({
    providedIn: 'root',
})
export class AppcuesRequests extends Request {
    constructor(@Inject('params') private params: any) {
        super(params)
    }

    static getAllBanners() {
        return new Request(K.NETWORK.URL.GET_ALL_BANNERS, K.NETWORK.METHOD.GET)
    }

    static getAllTours() {
        return new Request(K.NETWORK.URL.GET_ALL_TOURS, K.NETWORK.METHOD.GET)
    }

    static createBanner(payload: any) {
        return new Request(K.NETWORK.URL.UPSERT_BANNER, K.NETWORK.METHOD.POST, payload)
    }

    static createTour(payload: any) {
        return new Request(K.NETWORK.URL.UPSERT_TOUR, K.NETWORK.METHOD.POST, payload)
    }
}
