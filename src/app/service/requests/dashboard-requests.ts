import { Inject, Injectable } from '@angular/core'
import K from 'src/app/constants/index'
import Request from 'src/app/service/requests'
@Injectable({
    providedIn: 'root',
})
export class DashboardRequests extends Request {
    constructor(@Inject('params') private params: any) {
        super(params)
    }

    static getMarketMood(accountId: string) {
        return new Request(K.NETWORK.URL.GET_MARKET_MOOD + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getProfilePicture(accountId: string) {
        return new Request(K.NETWORK.URL.GET_PROFILE_PICTURE + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getUniqueStyleGraph(accountId: string) {
        return new Request(K.NETWORK.URL.GET_UNIQUE_STYLE_GRAPH + '/' + accountId, K.NETWORK.METHOD.GET)
    }
    static getAllAccountsByPersonId(personId: string) {
        return new Request(K.NETWORK.URL.GET_ALL_ACCOUNTS_BY_PERSON_ID + '/' + personId, K.NETWORK.METHOD.GET)
    }
    static getAccountColor(accountId: string) {
        return new Request(K.NETWORK.URL.GET_ACCOUNT_COLOR + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static getLastCompletions(accountId: string) {
        return new Request(K.NETWORK.URL.GET_LAST_COMPLETIONS + '/' + accountId, K.NETWORK.METHOD.GET)
    }

    static getRecentActivities(accountId: string) {
        return new Request(K.NETWORK.URL.GET_RECENT_ACTIVITIES + '/' + accountId, K.NETWORK.METHOD.GET)
    }
}
