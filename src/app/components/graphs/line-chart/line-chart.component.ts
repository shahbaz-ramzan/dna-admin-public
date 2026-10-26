import { Component, DestroyRef, Input, OnChanges, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { ChartOptions, ChartType, ChartConfiguration } from 'chart.js'
import { NgChartsModule } from 'ng2-charts'
import { Color, Label } from 'src/app/util/interfaces'

// Necessary for unit testing
type LineChaerOptions = ChartOptions<'line'> & {
    plugins: {
        datalabels: any
    }
}

@Component({
    selector: 'app-line-chart',
    standalone: true,
    imports: [NgChartsModule],
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.css'],
})
export class LineChartComponent implements OnInit, OnChanges {
    @Input() chartData: any[] = []
    @Input() chartLabels: string[] = []

    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    public lineChartColors: Color[] = [
        {
            backgroundColor: 'rgba(148,159,177,0.2)',
            borderColor: 'rgba(148,159,177,1)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        },
    ]
    // public lineChartData: ChartDataSets[]
    public lineChartData: any
    public lineChartLabels: Label[]
    public lineChartOptions: LineChaerOptions

    public lineChartLegend = false
    public lineChartType = 'line'
    public lineChartPlugins = []

    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<{ dashboardReducer: any }>) {}

    ngOnInit(): void {
        this.lineChartLabels = this.chartLabels
        this.lineChartData = {
            datasets: [
                {
                    data: this.chartData,
                    fill: 'origin',
                    ...this.lineChartColors[0],
                },
            ],
            labels: this.lineChartLabels,
        }

        this.lineChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    tension: 0.5,
                    // categoryPercentage: 0.5,
                },
                point: {
                    radius: 0,
                },
            },
            plugins: {
                datalabels: {
                    formatter: () => {
                        return ''
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        callback(_: any, index: any): any {
                            return index % 3 ? '' : this.getLabels()[index]
                        },
                    },
                },
                y: {
                    position: 'left',
                    ticks: {
                        display: false,
                    },
                    border: {
                        dash: [12, 5],
                    },
                    grid: {
                        display: true,
                        // drawBorder: false,
                        color: '#D8DAE5',
                        drawOnChartArea: true,
                    },
                },
            },
        }

        this.store
            .select((store) => store.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.accountColorPayload?.data?.secondaryColor2) {
                    this.secondaryColor2 = store?.accountColorPayload?.data?.secondaryColor2
                }
                this.lineChartColors = [
                    {
                        borderColor: this.secondaryColor2,
                        backgroundColor: '#0111',
                        pointBorderColor: '',
                    },
                ]
            })
    }

    ngOnChanges(): void {
        this.lineChartLabels = this.chartLabels
        this.lineChartData = {
            datasets: [
                {
                    data: this.chartData,
                    fill: 'origin',
                    ...this.lineChartColors[0],
                },
            ],
            labels: this.lineChartLabels,
        }
    }
}
