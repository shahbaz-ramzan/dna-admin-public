import { Inject, Injectable } from '@angular/core'
import K from 'src/app/constants/index'
import Request from 'src/app/service/requests'
@Injectable({
    providedIn: 'root',
})
export class LoginRequest extends Request {
    constructor(@Inject('params') private params: any) {
        super(params)
    }

    static getAllAccountsByPersonId(personId: string) {
        return new Request(K.NETWORK.URL.GET_ALL_ACCOUNTS_BY_PERSON_ID + '/' + personId, K.NETWORK.METHOD.GET)
    }

    static checkIdUser(opaqueId: string) {
        return new Request(K.NETWORK.URL.CHECK_IDP_USER + '/' + opaqueId, K.NETWORK.METHOD.GET)
    }

    static upsertIdpUser(payload: any) {
        return new Request(K.NETWORK.URL.UPSERT_IDP_USER, K.NETWORK.METHOD.POST, payload)
    }

    static getIdpUser(opaqueId: any) {
        return new Request(K.NETWORK.URL.GET_IDP_USER + '/' + opaqueId, K.NETWORK.METHOD.GET)
    }
}
