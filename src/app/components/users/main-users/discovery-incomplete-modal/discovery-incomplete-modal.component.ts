import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { SettingsService } from 'src/app/components/settings/settings.service'

// Shown by the participant detail page and every single-participant report when
// Discovery/GetUniqueStyle says the participant hasn't completed Discovery - there is no data to
// render, so the page skips its other API calls and this is the only way forward.
@Component({
    selector: 'app-discovery-incomplete-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './discovery-incomplete-modal.component.html',
    styleUrls: ['./discovery-incomplete-modal.component.scss'],
})
export class DiscoveryIncompleteModalComponent {
    @Input() visible = false
    // Multi-participant views (e.g. double-user-selection) set this when more than one participant
    // is incomplete. No names are shown - the URL can point at anyone, so a name here can be wrong.
    @Input() multiple = false

    // The same report routes are mounted under both /users and /myTeam (home-routing.module.ts) -
    // send the user back to whichever list they came from.
    readonly listRoot: string
    readonly listLabel: string

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        settingsService: SettingsService
    ) {
        this.listRoot = this.router.url.split('?')[0].split('/')[1] || 'users'
        const participantLabel = settingsService.parseSystemLabels().participantLabelName || 'User'
        this.listLabel = this.listRoot === 'myTeam' ? 'My Team' : `${participantLabel}s`
    }

    goToList() {
        const accountId = this.route.snapshot.queryParamMap.get('accountId')
        // Drops selectedParticipants so the list doesn't re-select this participant, and replaces
        // the URL so Back doesn't return to the page that has nothing to show.
        this.router.navigate([`/${this.listRoot}`], {
            queryParams: accountId ? { accountId } : {},
            replaceUrl: true,
        })
    }
}
