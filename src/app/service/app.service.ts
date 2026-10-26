import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { MsalService } from '@azure/msal-angular'
// import { environment } from 'src/environments/environment'
import { MixpanelService } from './mixpanel.service'
import { AuthService } from '@auth0/auth0-angular'
import { DashboardCacheStorageService } from './dashboard-cache-storage.service'
import { UsersCacheStorageService } from './users-cache-storage.service'
import { ParticipantInsightsCacheStorageService } from './participant-insights-cache-storage.service'
import { SettingsCacheStorageService } from './settings-cache-storage.service'

@Injectable({
    providedIn: 'root',
})
export class AppService {
    constructor(
        private router: Router,
        private authService: MsalService,
        private auth0: AuthService,
        private mixpanelService: MixpanelService,
        private dashboardCache: DashboardCacheStorageService,
        private usersCache: UsersCacheStorageService,
        private insightsCache: ParticipantInsightsCacheStorageService,
        private settingsCache: SettingsCacheStorageService
    ) {}

    buildToastErrors(error: any) {
        const validationErrors = error.error.errors
        const errors: any = []

        if (typeof error.error !== undefined) {
            if (error.error.status == 'invalidToken') this.logout()
        }
        if (typeof validationErrors === 'undefined') return errors
        if (validationErrors.length > 0 && typeof validationErrors !== 'undefined') {
            for (let i = 0; i < validationErrors.length; i++) {
                const error = {
                    severity: 'error',
                    summary: validationErrors[i].param,
                    detail: validationErrors[i].msg,
                }
                errors.push(error)
            }
        }
        return errors
    }

    logout() {
        // Must run before localStorage.clear() below - it needs USER_OBJECT to resolve which
        // user's dashboard cache to remove. localStorage.clear() would wipe it anyway, but this
        // keeps cache invalidation an explicit, visible step here rather than an implicit side
        // effect of an unrelated blanket clear.
        this.dashboardCache.clearForCurrentUser()
        this.usersCache.clearForCurrentUser()
        this.insightsCache.clearForCurrentUser()
        this.settingsCache.clearForCurrentUser()
        localStorage.clear()
        this.auth0.logout()
        this.authService.logoutRedirect()
    }

    navigateToHome() {
        this.router.navigate([''])
    }
}
