import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import * as Highcharts from 'highcharts'
// import { Label } from 'ng2-charts'
import { Label } from 'src/app/util/interfaces'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
@Component({
    selector: 'app-double-axes-horizontal-bar',
    standalone: true,
    imports: [],
    templateUrl: './double-axes-horizontal-bar.component.html',
    styleUrls: ['./double-axes-horizontal-bar.component.scss'],
})
export class DoubleAxesHorizontalBarComponent implements OnInit {
    @Output() graphEvent = new EventEmitter()
    @Input() chartData: any = []
    @Input() index = '0'
    @Input() bgColor: string
    @Input() showLabel: boolean
    @Input() isSubfactorsVisible: boolean
    @Input() showFactorList: boolean = false

    finalChartData: any = []

    public options: any

    leftLabels: Label[] = []

    rightLabels: Label[] = []

    ngOnInit() {
        this.finalChartData = JSON.parse(JSON.stringify(this.chartData))
        this.getOptions()
        this.bgColor = Encryption.decryptData(localStorage.getItem('tScoreColor') || '')
        this.graph(this.bgColor)
    }

    getOptions() {
        const ticks = [-30, -20, -10, 0, 10, 20, 30] //labels to show on y-axis between 20-80
        this.getChartData()
        this.options = {
            chart: {
                type: 'bar',
                height: this.isSubfactorsVisible ? 1500 : 500,
                backgroundColor: this.bgColor,
            },
            title: {
                text: '',
            },
            subtitle: {
                text: '',
            },
            tooltip: {
                enabled: true,
                headerFormat: '',
                pointFormat: `{point.custom.extraInformation}`,
            },
            plotOptions: {
                series: {
                    pointWidth: 15,
                    dataLabels: {
                        enabled: this.showLabel,
                        formatter: function () {
                            const point: any = this
                            return point.y + 50
                        },
                    },
                },
            },
            legend: {
                enabled: this.showFactorList ? false : true,
                verticalAlign: 'top',
                align: 'left',
                symbolRadius: 0,
            },
            xAxis: [
                {
                    categories: this.leftLabels,
                    reversed: true,
                    labels: {
                        step: 1,
                        formatter: (value: any) => {
                            return value.value
                        },
                    },
                },
                {
                    opposite: true,
                    reversed: true,
                    categories: this.rightLabels,
                    linkedTo: 0,
                    labels: {
                        step: 1,
                    },
                },
            ],
            yAxis: {
                title: {
                    text: null,
                },
                tickPositions: ticks,
                labels: {
                    formatter: (item: any) => {
                        return item.value + 50
                    },
                },
            },

            credits: {
                enabled: false,
            },
            series: this.finalChartData,
        }
    }

    graph(bgColor: any) {
        this.bgColor = bgColor
        this.finalChartData = JSON.parse(JSON.stringify(this.chartData))
        this.getOptions()
        setTimeout(() => {
            //waiting for the options to configure
            Highcharts.chart(this.index, this.options)
        }, 2000)
    }

    getChartData() {
        const chartDataArray = this.chartData[0].data

        const chartDataArray2 = this.chartData.length > 1 ? this.chartData[1].data : []
        const finalArray = [
            ...chartDataArray.slice(0, 1),
            ...chartDataArray.slice(8, 11),
            ...chartDataArray.slice(1, 2),
            ...chartDataArray.slice(11, 14),
            ...chartDataArray.slice(2, 3),
            ...chartDataArray.slice(14, 17),
            ...chartDataArray.slice(3, 4),
            ...chartDataArray.slice(17, 20),
            ...chartDataArray.slice(4, 5),
            ...chartDataArray.slice(20, 24),
            ...chartDataArray.slice(5, 6),
            ...chartDataArray.slice(24, 27),
            ...chartDataArray.slice(6, 7),
            ...chartDataArray.slice(27, 29),
            ...chartDataArray.slice(7, 8),
            ...chartDataArray.slice(29, 32),
        ]

        const finalArray2 = [
            ...chartDataArray2.slice(0, 1),
            ...chartDataArray2.slice(8, 11),
            ...chartDataArray2.slice(1, 2),
            ...chartDataArray2.slice(11, 14),
            ...chartDataArray2.slice(2, 3),
            ...chartDataArray2.slice(14, 17),
            ...chartDataArray2.slice(3, 4),
            ...chartDataArray2.slice(17, 20),
            ...chartDataArray2.slice(4, 5),
            ...chartDataArray2.slice(20, 24),
            ...chartDataArray2.slice(5, 6),
            ...chartDataArray2.slice(24, 27),
            ...chartDataArray2.slice(6, 7),
            ...chartDataArray2.slice(27, 29),
            ...chartDataArray2.slice(7, 8),
            ...chartDataArray2.slice(29, 32),
        ]

        const factorsLeftLabels = ['Cooperative', 'Reserved', 'Fast-Paced', 'Spontaneous', 'Skeptical', 'Content', 'Cautious', 'Anchored']
        const factorsRightLabels = ['Take Charge', 'Outgoing', 'Patient', 'Planned', 'Trusting', 'Pioneer', 'Risk Taker', 'Creative']

        const subFactorsLeftLabels = K.APP.SUB_FACTORS_LEFT_LABELS

        const subFactorsRightLabels = K.APP.SUB_FACTORS_RIGHT_LABELS

        this.finalChartData.map((item: any, i: number) => {
            this.finalChartData[i].name = this.chartData[i].name
            this.finalChartData[i].data = this.isSubfactorsVisible ? (i == 0 ? finalArray : finalArray2) : this.chartData[i].data?.slice(0, 8)
        })

        this.leftLabels = this.isSubfactorsVisible ? subFactorsLeftLabels : factorsLeftLabels
        this.rightLabels = this.isSubfactorsVisible ? subFactorsRightLabels : factorsRightLabels

        this.finalChartData.map((item: any, i: number) => {
            this.finalChartData[i].data?.map((element: any, j: number) => {
                this.finalChartData[i].data[j] = {
                    y: element,
                    custom: {
                        //custom data for tooltip
                        extraInformation: `${(element + 50 < 50 ? this.leftLabels[j] : this.rightLabels[j]) + ': ' + (element + 50)}`,
                    },
                }
            })
        })
    }
}
