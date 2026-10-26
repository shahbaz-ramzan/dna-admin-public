import { Injectable } from '@angular/core'
import * as mixpanel from 'mixpanel-browser'
import { environment } from 'src/environments/environment'

@Injectable({
    providedIn: 'root',
})
export class MixpanelService {
    /**
     * Initialize mixpanel.
     *
     * @param {string} userToken
     * @memberof MixpanelService
     */
    init(): void {
        mixpanel.init(environment.mixpanelToken)
    }

    addUser(userToken: any): void {
        mixpanel.identify(userToken)
    }

    createProfile(profileData: any) {
        mixpanel.people.set(profileData)
    }

    /**
     * Push new action to mixpanel.
     *
     * @param {string} id Name of the action to track.
     * @param {*} [action={}] Actions object with custom properties.
     * @memberof MixpanelService
     */
    track(id: string, action: any = {}): void {
        mixpanel.track(id, action)
    }
}
