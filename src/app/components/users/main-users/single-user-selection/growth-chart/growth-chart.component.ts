import { Component, Input } from '@angular/core'
import { Color } from 'src/app/util/interfaces'
import { PieChartComponent } from 'src/app/components/graphs/pie-chart/pie-chart.component'

@Component({
    selector: 'app-growth-chart',
    standalone: true,
    imports: [PieChartComponent],
    templateUrl: './growth-chart.component.html',
    styleUrls: ['./growth-chart.component.scss'],
})
export class GrowthChartComponent {
    chartLabels: string[] = ['Growth', 'Sustain']
    chartData: number[] = [28, 72]
    position: any = 'right'
    chartLagendsStyle: any = true
    boxSize: any = 12
    @Input() pieChartColors: Color[] = []
}
