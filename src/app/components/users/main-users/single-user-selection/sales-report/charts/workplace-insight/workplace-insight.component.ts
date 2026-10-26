import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Chart } from 'chart.js'

@Component({
    selector: 'app-workplace-insight',
    standalone: true,
    imports: [],
    templateUrl: './workplace-insight.component.html',
    styleUrl: './workplace-insight.component.css',
})
export class WorkplaceInsightComponent {
    @Input('chartData') chartData = []
    @Input('barColor') barColor = 'rgba(54, 162, 235, 0.2)'
    chart: any

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges): void {
        if (this.chartData.length) {
            this.createChart(changes.chartData.currentValue)
        }
    }

    createChart(chartValue: Array<{ insightName: string; population: number }>): void {
        this.chart = new Chart('workplace-insight-chart', {
            type: 'bar', // Define the chart type (bar chart)

            data: {
                labels: chartValue.map(({ insightName }) => insightName), // X-axis labels
                datasets: [
                    {
                        // label: 'Workplace Insights', // Label for the dataset
                        data: chartValue.map(({ population }) => population), // Data points
                        backgroundColor: this.barColor, // Background color for the bars
                        borderColor: this.barColor, // Border color for the bars
                        borderWidth: 1, // Border width of the bars
                        barPercentage: 0.8,
                        categoryPercentage: 0.5,
                    },
                ],
            },
            options: {
                // indexAxis: 'x',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        position: 'left',
                        ticks: {
                            minRotation: 75,
                            font: {
                                size: 10,
                            },
                            callback: function (value, index) {
                                const label = (this.chart.config.data.labels?.at(index) as string) || ''
                                return label
                            },
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        position: 'bottom',
                        ticks: {
                            autoSkip: false,
                            font: {
                                size: 11,
                            },
                            callback: function (value) {
                                return `${value}%` // Custom format for Y-axis labels
                            },
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
                        display: false,
                        // labels: {
                        //     boxWidth: 0,
                        //     font: {
                        //         size: 16,
                        //     },
                        // },
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
            },
        })
    }
}
