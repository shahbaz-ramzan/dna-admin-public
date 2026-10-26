import { Component, Input, OnInit, OnChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Color } from 'src/app/util/interfaces'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { PieChartComponent } from 'src/app/components/graphs/pie-chart/pie-chart.component'

@Component({
    selector: 'app-unique-style',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, PieChartComponent],
    templateUrl: './unique-style.component.html',
    styleUrls: ['./unique-style.component.scss'],
})
export class UniqueStyleComponent implements OnInit, OnChanges {
    @Input() chartLabels: string[]
    @Input() chartValues: number[]
    @Input() chartColors: string[]
    @Input() loading: boolean
    chartPosition: any = 'bottom'
    chartLagendsStyle = false
    boxSize: any = 15
    pieChartColors: Color[]
    ngOnInit(): void {
        this.pieChartColors = [
            {
                backgroundColor: this.chartColors,
            },
        ]
    }

    ngOnChanges(): void {
        this.pieChartColors = [
            {
                backgroundColor: this.chartColors,
            },
        ]
    }
}
