import { Injectable } from '@angular/core'
import * as Highcharts from 'highcharts'
import { Label } from 'src/app/util/interfaces'

// Fields read/written by CoachingReportComponent's own 8-factor T-score bar chart rendering.
// CoachingReportComponent passes itself (`this`) as the state argument to every method below, so
// all mutations here happen directly on the component instance's own fields. This is a distinct
// chart from the shared TScoresComponent (`@ViewChild(TScoresComponent) tScoreComponent`) — the
// two are unrelated and must not be conflated.
export interface TScoreChartState {
    chartData: any
    finalChartData1: any
    leftLabels: Label[]
    rightLabels: Label[]
    bgColor: any
    indexs: string[]
    tScoreCharts: (Highcharts.Chart | undefined)[]
}

@Injectable({ providedIn: 'root' })
export class CoachingReportTScoreChartService {
    getChartData(state: TScoreChartState) {
        const chartDataArray = state.chartData[0].data
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
        state.finalChartData1.map((_: any, i: number) => {
            state.finalChartData1[i].name = state.chartData[i].name
            state.finalChartData1[i].data = finalArray

            state.finalChartData1[i].data?.map((element: any, j: number) => {
                state.finalChartData1[i].data[j] = {
                    y: element,
                    custom: {
                        extraInformation: `${(element + 50 < 50 ? state.leftLabels[j] : state.rightLabels[j]) + ': ' + (element + 50)}`,
                    },
                }
            })
        })
    }

    getOptions(state: TScoreChartState, start: number, end: number) {
        const copyChartData = JSON.parse(JSON.stringify(state.finalChartData1))
        if (copyChartData[0]?.data.length) {
            copyChartData[0].data = copyChartData[0]?.data?.slice(start, end)
        }

        const ticks = [-30, -20, -10, 0, 10, 20, 30] //labels to show on y-axis between 20-80
        const options: any = {
            chart: {
                type: 'bar',
                height: 280,
                backgroundColor: state.bgColor,
            },
            title: {
                text: '',
            },
            subtitle: {
                text: '',
            },
            tooltip: {
                enabled: false,
                headerFormat: '',
                pointFormat: `{point.custom.extraInformation}`,
            },
            plotOptions: {
                series: {
                    pointWidth: 15,
                    dataLabels: {
                        enabled: true,
                        formatter: function (this: any) {
                            return this.y + 50
                        },
                    },
                },
            },
            legend: {
                enabled: false,
                verticalAlign: 'top',
                align: 'left',
                symbolRadius: 0,
            },
            xAxis: [
                {
                    categories: state.leftLabels.slice(start, end),
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
                    categories: state.rightLabels.slice(start, end),
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

    createTScoreGraph(state: TScoreChartState) {
        state.finalChartData1 = JSON.parse(JSON.stringify(state.chartData))
        this.getChartData(state)

        if (state.chartData[0]?.data?.length > 0) {
            this.renderOrUpdateChart(state, 0, this.getOptions(state, 0, 4)) //Commanding
            this.renderOrUpdateChart(state, 1, this.getOptions(state, 4, 8)) //Structure
            this.renderOrUpdateChart(state, 2, this.getOptions(state, 8, 12)) //People
            this.renderOrUpdateChart(state, 3, this.getOptions(state, 12, 16)) //Patience
            this.renderOrUpdateChart(state, 4, this.getOptions(state, 16, 21)) //trust
            this.renderOrUpdateChart(state, 5, this.getOptions(state, 21, 25)) //pioneering
            this.renderOrUpdateChart(state, 6, this.getOptions(state, 25, 28)) //risk
            this.renderOrUpdateChart(state, 7, this.getOptions(state, 28, 32)) //creativity
        }
    }

    // Reuses the existing Highcharts instance (cheap incremental redraw) instead of
    // tearing down and recreating the chart on every call — createTScoreGraph() re-runs
    // whenever isFullView toggles or new tScore data arrives, not just on first render.
    private renderOrUpdateChart(state: TScoreChartState, idx: number, options: Highcharts.Options): void {
        const existing = state.tScoreCharts[idx]
        if (existing) {
            existing.update(options, true)
        } else {
            state.tScoreCharts[idx] = Highcharts.chart(state.indexs[idx], options)
        }
    }
}
