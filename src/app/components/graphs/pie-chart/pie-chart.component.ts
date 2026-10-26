import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { ChartData, ChartOptions } from 'chart.js'
import { NgChartsModule } from 'ng2-charts'
// import { Color } from 'ng2-charts'
import { Color } from 'src/app/util/interfaces'

@Component({
    selector: 'app-pie-chart',
    standalone: true,
    imports: [NgChartsModule],
    templateUrl: './pie-chart.component.html',
    styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnInit, OnChanges {
    @Input() showLegends: boolean
    @Input() showPercentage: boolean
    @Input() pointStyle: boolean
    @Input() chartLabels: string[] = ['a', 'b', 'c', 'd']
    @Input() chartColors: Color[] = []
    @Input() chartData: number[] = []
    @Input() chartPosition: any
    @Input() chartLagendsStyle = true
    @Input() boxSize: any
    @Input() width: any
    @Input() height: any
    pieChartData: ChartData<'pie', number[], string | string[]>
    chartOptions: ChartOptions<any>

    ngOnInit(): void {
        this.pieChartData = this.buildChartData()
        this.chartOptions = this.buildChartOptions()
    }

    ngOnChanges(changes: SimpleChanges): void {
        const relevantInputChanged = ['chartLabels', 'chartColors', 'chartData', 'chartPosition', 'chartLagendsStyle', 'boxSize', 'showPercentage'].some(
            (input) => changes[input] && !changes[input].firstChange
        )
        if (!relevantInputChanged) {
            return
        }

        // Must rebuild pieChartData (a NEW object reference) whenever the underlying
        // labels/data/colors change, not just chartOptions - ng2-charts only redraws when the
        // [data]-bound object reference itself changes. Previously this only ran in ngOnInit, so
        // any parent that keeps this component instance alive across updates (e.g.
        // three-user-selection.component.ts, which does NOT recreate its child components on
        // every participant-selection change) rendered the pie chart's very first data forever,
        // regardless of how many later @Input updates arrived.
        this.pieChartData = this.buildChartData()
        this.chartOptions = this.buildChartOptions()
    }

    private buildChartData(): ChartData<'pie', number[], string | string[]> {
        return {
            labels: this.chartLabels,
            datasets: [
                {
                    data: this.chartData,
                    backgroundColor: this.chartColors[0]?.backgroundColor,
                },
            ],
        }
    }

    private buildChartOptions(): ChartOptions<any> {
        let sum = 0
        this.chartData.forEach((data: any) => {
            sum += data
        })

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (ctx: any) {
                            return `${ctx.label}: ${Math.round(ctx.raw)}%`
                        },
                    },
                },
                legend: {
                    position: this.chartPosition,

                    labels: {
                        font: {
                            size: 14,
                        },
                        usePointStyle: this.chartLagendsStyle,
                        boxWidth: this.boxSize,
                    },
                },
                datalabels: this.showPercentage
                    ? {
                          formatter: (value: any) => {
                              const percentage = Math.round((value * 100) / sum) + '%'
                              return percentage
                          },
                          color: '#fff',
                          anchor: 'end',
                          align: 'start',
                          font: {
                              weight: 'normal',
                              size: 10,
                          },
                      }
                    : {
                          formatter: () => {
                              return ''
                          },
                      },
            },
        }
    }

    dateForamt(date: Date) {
        return `${date.getFullYear()}-${date.getMonth() - 1}-${date.getDate()}\n ${date.getHours()}:${date.getMinutes()} `
    }
}
