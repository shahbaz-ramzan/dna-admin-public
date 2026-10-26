import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import { MainUsersService } from '../main-users.service'

/**
 * Shared across the participant report components (business/financial, ...) which each
 * independently duplicated this logic verbatim. Only the parts confirmed identical are
 * centralized here — per-report data fetching (dispatch lists), canvas-preparation guards,
 * and showCard shaping stay in each component since they legitimately differ.
 * See REPORTS_OPTIMIZATION_PHASE2_PLAN.md, item 1.
 */
@Injectable({ providedIn: 'root' })
export class ReportSharedService {
    readonly uniqueStyleImages: { [key: string]: string } = {
        Influencer: '../../../../../../assets/images/Unique_Style_images/1 Influencer.svg',
        Engager: '../../../../../../assets/images/Unique_Style_images/2 Engager.svg',
        'Community Builder': '../../../../../../assets/images/Unique_Style_images/3 CommunityBuilder.svg',
        'Relationship Builder': '../../../../../../assets/images/Unique_Style_images/4 RelationshipBuilder.svg',
        Facilitator: '../../../../../../assets/images/Unique_Style_images/5 Facilitator.svg',
        Adapter: '../../../../../../assets/images/Unique_Style_images/6 Adapter.svg',
        'Stylish Thinker': '../../../../../../assets/images/Unique_Style_images/7 StylishThinker.svg',
        'Reflective Thinker': '../../../../../../assets/images/Unique_Style_images/9 ReflectiveThinker.svg',
        Strategist: '../../../../../../assets/images/Unique_Style_images/10 Strategist.svg',
        Initiator: '../../../../../../assets/images/Unique_Style_images/11 Initiator.svg',
    }

    getUniqueStyleImage(behaviorTypeName: string | undefined): string {
        return (behaviorTypeName && this.uniqueStyleImages[behaviorTypeName]) || ''
    }

    loadText(canvasDataLength: number): string {
        const dotCount = 1 + (canvasDataLength % 3)
        return 'Preparing Download' + '.'.repeat(dotCount)
    }

    // Resolves the co-branding logo (base64, for embedding in the generated PDF), falling back
    // to the default logo asset when the account has none set.
    getBrandLogo$(userService: MainUsersService): Observable<string> {
        return new Observable<string>((subscriber) => {
            const coBrandLogo = JSON.parse(Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || ''))?.cobrandingLogoPath
            if (coBrandLogo) {
                userService.toDataURL(coBrandLogo, (dataUrl: string) => {
                    subscriber.next(dataUrl)
                    subscriber.complete()
                })
            } else {
                subscriber.next('assets/images/logo.png')
                subscriber.complete()
            }
        })
    }
}
