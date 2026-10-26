import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ChartType, ChartOptions } from 'chart.js'
import { NgChartsModule } from 'ng2-charts'
import { Color } from 'src/app/util/interfaces'

@Component({
    selector: 'app-single-line-horizontal',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './single-line-horizontal.component.html',
    styleUrls: ['./single-line-horizontal.component.scss'],
})
export class SingleLineHorizontalComponent implements OnInit, OnChanges {
    @Input() chartLabels: any[] = []
    @Input() chartData: any[] = []
    @Input() chartColor: any[] = []
    @Input() ticks = true
    @Input() legend: boolean
    @Input() gridLines = true
    @Input() yAxisPosition: any = ''
    @Input() isDashboard = false
    temp = true
    options: ChartOptions<any>
    barChartLegend: boolean
    public barChartType: ChartType = 'bar'
    suggestedMax = 100

    primaryColor: string = ''

    public barChartColors: Color[] = [{ backgroundColor: this.chartColor }]

    ngOnInit(): void {
        const percentage = this.isDashboard ? '' : '%'
        this.barChartLegend = this.legend ? this.legend : false
        if (this.isDashboard) {
            this.suggestedMax = Math.max(...this.chartData[0]?.data)
        }

        this.settingOptions()
    }

    ngOnChanges(changes: SimpleChanges): void {
        const relevantInputChanged = ['chartLabels', 'chartData', 'chartColor', 'ticks', 'gridLines', 'yAxisPosition'].some(
            (input) => changes[input] && !changes[input].firstChange
        )
        if (relevantInputChanged) {
            this.settingOptions()
        }
    }

    settingOptions() {
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            backgroundColor: this.chartColor[0]?.backgroundColor,
            plugins: {
                title: {
                    display: false,
                },
                datalabels: {
                    formatter: () => {
                        return ''
                    },
                },
                tooltip: {
                    callbacks: {
                        title: function (ctx: any) {
                            return ctx[0].label
                        },
                        label: function (ctx: any) {
                            return ctx.formattedValue
                        },
                    },
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        font: {
                            size: 15,
                            family: 'calibri',
                            weight: 'bold',
                        },
                        // fontSize: 15,
                        usePointStyle: false,
                        boxWidth: 22,
                    },
                },
            },
            layout: {
                padding: {
                    left: 20,
                },
            },
            hover: { mode: undefined },

            scales: {
                x: {
                    stacked: true,
                    position: 'bottom',
                    grid: this.gridLines
                        ? {
                              display: false,
                              drawOnChartArea: true,
                          }
                        : {
                              display: true,
                              drawOnChartArea: false,
                              lineWidth: 5,
                          },

                    ticks: {
                        padding: 4,
                        autoSkip: false,
                        font: {
                            size: 10,
                        },
                        callback: (tickValue: any, index: number, ticks: any) => {
                            return this.chartLabels[index]?.length > 39 ? this.chartLabels[index].slice(0, 33) + '...' : this.chartLabels[index]
                            // return this.chartLabels[index].length
                        },
                    },
                },
                y: {
                    position: this.yAxisPosition,
                    beginAtZero: true,
                    suggestedMax: this.suggestedMax,
                    border: {
                        display: this.gridLines ? false : true,
                        dash: this.gridLines ? [12, 5] : [],
                    },
                    ticks: this.ticks ? {} : { display: false },
                    grid: this.gridLines
                        ? {
                              //   drawBorder: false,
                              color: '#D8DAE5',
                              //   borderDash: [12, 5],
                              drawOnChartArea: true,
                          }
                        : {
                              display: false,
                          },
                },
            },
        }
    }
}
