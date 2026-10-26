import { Component } from '@angular/core'
import * as Chart from 'chart.js'
import { NgChartsModule } from 'ng2-charts'
import { Color } from 'src/app/util/interfaces'

@Component({
    selector: 'app-vertical-bar',
    standalone: true,
    imports: [NgChartsModule],
    templateUrl: './vertical-bar.component.html',
    styleUrls: ['./vertical-bar.component.css'],
})
export class VerticalBarComponent {
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')

    options: Chart.ChartOptions<'bar'> = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            title: {
                display: true,
                // text: 'Example Chart',
            },
        },

        datasets: {
            bar: {
                barPercentage: 0.7,
                categoryPercentage: 0.5,
            },
        },

        scales: {
            x: {
                position: 'bottom',
                grid: {
                    display: false,
                    drawOnChartArea: true,
                },
                ticks: {
                    padding: 5,
                },
            },
            y: {
                border: {
                    dash: [12, 5],
                },
                position: 'left',
                grid: {
                    // drawBorder: false,
                    color: '#D8DAE5',
                    // borderDash: [12, 5],
                    drawOnChartArea: true,
                },
            },
        },
    }
    public barChartLabels = [
        'Patiently Build Long',
        'Desire to Make Decisions',
        'Goal Driven',
        'Focus on bottom line',
        'Empathic',
        'Curious',
        'Focused',
        'Need for Information',
    ]
    public barChartType: Chart.ChartType = 'bar'
    public barChartLegend = false
    public barChartData = [
        { data: [65, -59, 80, 60, -50, 80, -60, 50], label: '' },
        { data: [28, -48, 40, -81, 48, 40, -81, 40], label: 'Visit' },
    ]

    public barChartColors: Color[] = [{ backgroundColor: this.primaryColor }, { backgroundColor: this.secondaryColor }]
}
