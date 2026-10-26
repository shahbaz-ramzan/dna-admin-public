import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-career-insights',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './career-insights.component.html',
    styleUrls: ['./career-insights.component.scss'],
})
export class CareerInsightsComponent {
    @Input() loading: boolean
    @Input() careerInsightsObject: { insights: string[] }
}
