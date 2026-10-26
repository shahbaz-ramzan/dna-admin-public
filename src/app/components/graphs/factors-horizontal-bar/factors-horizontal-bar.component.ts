import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
// import { Label } from 'ng2-charts'
import { Label } from 'src/app/util/interfaces'
import * as Highcharts from 'highcharts'
import K from 'src/app/constants'
@Component({
    selector: 'app-factors-horizontal-bar',
    standalone: true,
    imports: [],
    templateUrl: './factors-horizontal-bar.component.html',
    styleUrls: ['./factors-horizontal-bar.component.scss'],
})
export class FactorsHorizontalBarComponent implements OnInit {
    @Output() graphEvent = new EventEmitter()
    @Input() chartData: any = []
    @Input() index = '0'
    @Input() bgColor: string
    @Input() showLabel: boolean
    index1 = 'single1'
    finalChartData1: any = []

    public options: any

    leftLabels: Label[] = []

    rightLabels: Label[] = []

    ngOnInit() {
        this.leftLabels = K.APP.SUB_FACTORS_LEFT_LABELS
        this.rightLabels = K.APP.SUB_FACTORS_RIGHT_LABELS
        // this.finalChartData1 = this.chartData;
        // setTimeout(() => {
        // this.getOptions();

        // }, 1000);
    }

    graph(bgColor: any) {
        this.bgColor = bgColor
        this.finalChartData1 = JSON.parse(JSON.stringify(this.chartData))
        this.getChartData()
        // this.getOptions();
        setTimeout(() => {
            Highcharts.chart(this.index, this.getOptions(0, 4))
            Highcharts.chart(this.index1, this.getOptions(4, 8))
        }, 1000)
    }

    getChartData() {
        const chartDataArray = this.chartData[0].data
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

        this.finalChartData1.map((item: any, i: number) => {
            this.finalChartData1[i].name = this.chartData[i].name
            this.finalChartData1[i].data = finalArray
            this.finalChartData1[i].data?.map((element: any, j: number) => {
                this.finalChartData1[i].data[j] = {
                    y: element,
                    custom: {
                        extraInformation: `${(element + 50 < 50 ? this.leftLabels[j] : this.rightLabels[j]) + ': ' + (element + 50)}`,
                    },
                }
            })
        })
    }

    getOptions(start: number, end: number) {
        const copyChartData = JSON.parse(JSON.stringify(this.chartData))
        if (copyChartData[0]?.data.length) {
            copyChartData[0].data = copyChartData[0]?.data?.slice(start, end)
        }

        const ticks = [-30, -20, -10, 0, 10, 20, 30] //labels to show on y-axis between 20-80
        const options: any = {
            chart: {
                type: 'bar',
                height: 300,
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
                enabled: true,
                verticalAlign: 'top',
                align: 'left',
                symbolRadius: 0,
            },
            xAxis: [
                {
                    categories: this.leftLabels.slice(start, end),
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
                    categories: this.rightLabels.slice(start, end),
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
            series: copyChartData,
        }

        return options
    }
}
