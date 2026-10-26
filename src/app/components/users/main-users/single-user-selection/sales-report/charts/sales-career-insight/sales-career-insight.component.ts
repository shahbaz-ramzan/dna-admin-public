import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Chart } from 'chart.js'
import { startCase } from 'lodash'

@Component({
    selector: 'app-sales-career-insight',
    standalone: true,
    imports: [],
    templateUrl: './sales-career-insight.component.html',
    styleUrl: './sales-career-insight.component.css',
})
export class SalesCareerInsightComponent implements OnInit, OnChanges {
    @Input('chartData') chartData = []
    @Input('barColor') barColor = 'rgba(54, 162, 235, 0.2)'
    chart: any

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges): void {
        if (this.chartData.length) {
            this.createChart(changes.chartData.currentValue)
        }
    }

    createChart(chartValue: Array<[string, number]>): void {
        this.chart = new Chart('career-insight-chart', {
            type: 'bar', // Define the chart type (bar chart)

            data: {
                labels: chartValue.map(([labels]) => labels), // X-axis labels
                datasets: [
                    {
                        label: 'Sales Career Insights', // Label for the dataset
                        data: chartValue.map(([_, value]) => value), // Data points
                        backgroundColor: this.barColor, // Background color for the bars
                        borderColor: this.barColor, // Border color for the bars
                        borderWidth: 1, // Border width of the bars
                        barPercentage: 0.8,
                        categoryPercentage: 0.5,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: {
                                size: 11,
                            },
                            callback: function (value) {
                                return `${value}%`
                            },
                        },
                    },
                    y: {
                        beginAtZero: true, // Start the Y-axis at 0
                        ticks: {
                            autoSkip: false,
                            font: {
                                size: 11,
                            },
                            callback: function (_, index) {
                                const label = (this.chart.config.data.labels?.at(index) as string) || ''
                                return startCase(label)
                            },
                        },
                        grid: {
                            display: false,
                        },
                    },
                },
                plugins: {
                    datalabels: {
                        formatter(value) {
                            return value + '%'
                        },
                        align: 'end',
                        anchor: 'end',
                        font: {
                            size: 11,
                        },
                    },
                    legend: {
                        display: true,
                        labels: {
                            boxWidth: 0,
                            font: {
                                size: 16,
                            },
                        },
                    },
                    tooltip: {
                        enabled: false,
                        // callbacks: {
                        //     title: function () {
                        //         return ''
                        //     },
                        //     label: function (item: any) {
                        //         return `${startCase(item.label)}: ${item.formattedValue}%`
                        //     },
                        // },
                    },
                },
                layout: {
                    padding: {
                        right: 40,
                    },
                },
            },
        })
    }
}
