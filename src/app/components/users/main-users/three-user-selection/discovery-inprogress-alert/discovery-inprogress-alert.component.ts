import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProgressSpinnerModule } from 'primeng/progressspinner'

@Component({
    selector: 'app-discovery-inprogress-alert',
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule],
    templateUrl: './discovery-inprogress-alert.component.html',
    styleUrls: ['./discovery-inprogress-alert.component.css'],
})
export class DiscoveryInprogressAlertComponent {
    @Input('loading') loading: boolean
    @Input('numberOfDiscoveryInprogressUsers') numberOfDiscoveryInprogressUsers: number
    @Input('discoveryInprogressMessage') discoveryInprogressMessage: string
}
