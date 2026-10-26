import { Injectable } from '@angular/core'
import { CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { Observable } from 'rxjs'
import K from '../constants'
import { AppService } from '../service/app.service'
import Encryption from '../util/Encryption'

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private appService: AppService,
        private router: Router
    ) {}

    canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (Encryption.decryptData(localStorage.getItem(K.APP.ACCESS_TOKEN))) {
            return true
        } else {
            // Following condition in necessary for the auth flow to avoid stuck in the self-redirection loop.
            if (localStorage.getItem(K.APP.ACCESS_TOKEN)) {
                this.appService.logout()
            } else {
                this.router.navigateByUrl('/login')
            }
            return false
        }
    }

    filterOnlyUrl(state: RouterStateSnapshot): string {
        return state.url.split('?')[0]
    }
}
