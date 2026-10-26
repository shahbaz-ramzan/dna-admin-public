import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ChartConfiguration, ChartData, ChartEvent, ChartOptions, ChartType, DatasetChartOptions } from 'chart.js'
import { callback } from 'chart.js/dist/helpers/helpers.core'
import { overflow } from 'html2canvas/dist/types/css/property-descriptors/overflow'
import { NgChartsModule } from 'ng2-charts'
import { Color } from 'src/app/util/interfaces'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

interface ICustomLegend {
    text: string
    fillStyle: Color
}

interface IContent {
    name: string
    description: string
}

@Component({
    selector: 'app-radar-chart',
    standalone: true,
    imports: [CommonModule, NgChartsModule, LoadingSpinnerComponent],
    templateUrl: './radar-chart.component.html',
    styleUrls: ['./radar-chart.component.css'],
})
export class RadarChartComponent implements OnChanges {
    @Input('data') dataset: any
    @Input('labels') labels: string[]
    @Input('customLegends') customLegends: ICustomLegend[] = [] as any
    @Input('width') width: number
    @Input('height') height: number
    @Input('chartColors') chartColors: Color[]
    @Input('loading') loading: boolean
    @Input('extraContent') content: IContent[]
    @Input('isWorkTalent') isWorkTalent: boolean
    @Input('showRadarChart') showRadarChart: boolean
    helpUrl = 'https://kb.dnabehavior.com/gene/unique-style-distribution-for-the-natural-behavior-discovery-2023'
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    lineColors = [this.primaryColor, this.secondaryColor]

    radarChartData: ChartData<'radar'>

    options: ChartOptions<any> = {
        backgroundColor: this.primaryColor,
        responsive: true,
        maintainAspectRatio: false,
        // legend: {
        //     labels: {
        //         generateLabels: () => {
        //             return this.customLegends as any
        //         },
        //         fontSize: 14,
        //         fontFamily: 'calibri',
        //         usePointStyle: false,
        //         boxWidth: 15,
        //     },
        // },

        scales: {
            r: {
                ticks: { display: false, stepSize: 25 },
                angleLines: { display: false },
                pointLabels: {
                    font: {
                        size: window.innerWidth < 500 ? 7 : 10,
                    },
                },
            },
        },
        plugins: {
            datalabels: {
                formatter: () => {
                    return ''
                },
            },
            tooltip: {
                enabled: false,
                callbacks: {
                    label: function (context: any) {
                        const tooltipItem = context.tooltipItem
                        const data = context.chart.data
                        const allData = data.datasets[tooltipItem.datasetIndex].data
                        const tooltipLabel = data.labels[tooltipItem.index]
                        const tooltipData = allData[tooltipItem.index]
                        return `${tooltipLabel}: ${tooltipData * 100}%`
                    },
                },
            },
        },
        elements: { point: { radius: 0 } },
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.dataset) {
            const dataset = this.dataset.map((set: number[], i: number) => {
                // Following object is subset property of 'datasets' in ChartData<'radar'> type
                const data = {
                    data: set,
                    backgroundColor: this.lineColors[i],
                    borderColor: this.lineColors[i],
                }

                return data
            })
            this.radarChartData = {
                datasets: dataset,
                labels: this.labels,
            }
        }
    }
}
