import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-legacy-reports',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './legacy-reports.component.html',
    styleUrls: ['./legacy-reports.component.scss'],
})
export class LegacyReportsComponent {
    @Input() loading: boolean
    @Input() reportsList: any[]
}
