import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AccordionModule } from 'primeng/accordion'
import { Color } from 'src/app/util/interfaces'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { LineChartComponent } from 'src/app/components/graphs/line-chart/line-chart.component'

@Component({
    selector: 'app-financial-behavior',
    standalone: true,
    imports: [CommonModule, AccordionModule, LoadingSpinnerComponent, LineChartComponent],
    templateUrl: './financial-behavior.component.html',
    styleUrls: ['./financial-behavior.component.scss'],
})
export class FinancialBehaviorComponent {
    @Input() marketData: any
    @Input() marketMoodArray: any
    @Input() loading: any
    @Input() mood: string
    @Input() smileyColor: string
    @Input() descriptionLoading: any
    @Input() chartColor: Color[]
}
