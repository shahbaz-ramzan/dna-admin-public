import { Injectable } from '@angular/core'
import { NetworkService } from 'src/app/service/network.service'
import { LoginRequest } from './requests/login-requests'

@Injectable({
    providedIn: 'root',
})
export class LoginService {
    constructor(private networkService: NetworkService) {}

    getAccountsByPersonIdCall(personId: string) {
        return this.networkService.httpCall(LoginRequest.getAllAccountsByPersonId(personId))
    }

    checkIdpUserCall(opaqueId: string) {
        return this.networkService.httpCall(LoginRequest.checkIdUser(opaqueId))
    }

    upsertIdpUserCall(payload: any) {
        return this.networkService.httpCall(LoginRequest.upsertIdpUser(payload))
    }

    getIdpUserCall(opaqueId: any) {
        return this.networkService.httpCall(LoginRequest.getIdpUser(opaqueId))
    }
}
