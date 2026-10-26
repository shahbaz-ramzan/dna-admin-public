import { Component, DestroyRef, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { ChartType, ChartOptions, ChartData } from 'chart.js'
import { NgChartsModule } from 'ng2-charts'
import { Color, Label } from 'src/app/util/interfaces'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { selectMainUserState } from '../../users/main-users/mainUserStore/main-users.selectors'

@Component({
    selector: 'app-graph-horizontal-bar',
    standalone: true,
    imports: [CommonModule, NgChartsModule, LoadingSpinnerComponent],
    templateUrl: './horizontal-bar.component.html',
    styleUrls: ['./horizontal-bar.component.css'],
})
export class HorizontalBarComponent implements OnInit {
    behaviralBiasesLoading = false
    @Input() chartColor: Color[]
    @Input() chartData: any
    @Input() isSingleUser = true
    @Input() showLegend: boolean = true
    @Input() showScores: boolean
    barChartData: ChartData<any>

    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    lineColors = [this.secondaryColor, this.primaryColor]

    options: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        datasets: {
            bar: {
                barPercentage: 0.7,
                categoryPercentage: 0.5,
            },
        },

        layout: {
            padding: {
                left: 20,
            },
        },

        plugins: {
            title: {
                display: true,
                // text: 'Example Chart',
            },
            datalabels: {
                formatter: (value: any) => {
                    return this.showScores ? value + '%' : ''
                },
                color: '#ffffff',
                anchor: 'end',
                align: 'right',
                offset: -32,
                font: {
                    size: 10,
                },
            },
            legend: {
                display: true,
                align: 'start' as const,
                labels: {
                    font: {
                        size: 14,
                        family: 'calibri',
                    },
                    usePointStyle: false,
                    boxWidth: 15,
                },
            },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: function (context: any) {
                        const data = context.chart.data
                        const allData = data.datasets[context?.datasetIndex].data
                        const tooltipLabel = data.labels[context.dataIndex]
                        const tooltipData = allData[context.dataIndex]
                        return `${tooltipLabel}: ${tooltipData}%`
                    },
                },
            },
        },

        scales: {
            x: {
                axis: 'x',
                position: 'bottom',
                suggestedMin: 0,
                border: {
                    display: false,
                },
                grid: {
                    display: true,
                    color: '#D8DAE5',
                    tickBorderDash: [12, 5],
                    // drawBorder: false,
                },
                ticks: {
                    padding: 10,
                    callback: function (value: any) {
                        return (value / 100).toLocaleString('en-GB', {
                            style: 'percent',
                        })
                    },
                },
            },
            y: {
                axis: 'y',
                position: 'left',
                suggestedMin: 0,
                // ticks: {
                //     padding: 10,
                //     callback: (value) => `${value}%`,
                // },
                grid: {
                    display: false,
                    // drawBorder: false,
                    color: '#D8DAE5',
                    tickBorderDash: [12, 5],
                    drawOnChartArea: true,
                },
            },
        },
    }
    public barChartLabels: Label[] = []

    public barChartType = 'bar'
    public barChartPlugins = []
    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<any>) {}

    ngOnInit(): void {
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.behaviralBiasesLoading = response?.getBehaviralBiasesLoading
                this.barChartLabels = []
                response?.behaviralBiasesPayload?.data?.behavioralBiasList.forEach((element: any) => {
                    this.barChartLabels?.push(element?.name)
                })
                if (!this.isSingleUser) this.barChartLabels.sort()
                const dataset = this.chartData?.datasets.map((obj: any, i: number) => {
                    const data = {
                        data: obj.data,
                        label: obj.label,
                        backgroundColor: this.lineColors[i],
                        borderColor: this.lineColors[i],
                    }

                    return data
                })
                this.barChartData = {
                    datasets: dataset,
                    labels: this.barChartLabels,
                }
            })
    }
}
