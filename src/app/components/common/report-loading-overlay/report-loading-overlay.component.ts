import { Component, Input } from '@angular/core'
import { ProgressSpinnerModule } from 'primeng/progressspinner'

// Replaces the `<div class="dna-spinner fixed-spinner"><div class="team-spinner">...<p>{{message}}</p></div></div>`
// markup + `.team-spinner`/`.team-spinner p` styles duplicated across ~8 report components
// (team-report, participant-financial-report, factors-report, coaching-report,
// participant-business-report, sales-report).
@Component({
    selector: 'app-report-loading-overlay',
    standalone: true,
    imports: [ProgressSpinnerModule],
    templateUrl: './report-loading-overlay.component.html',
    styleUrls: ['./report-loading-overlay.component.scss'],
})
export class ReportLoadingOverlayComponent {
    @Input() message = 'Finalizing report view'
    @Input() fixed = true
}
