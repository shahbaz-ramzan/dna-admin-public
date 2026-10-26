import { Component, Input, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgCircleProgressModule } from 'ng-circle-progress'

@Component({
    selector: 'app-work-talent',
    standalone: true,
    imports: [CommonModule, NgCircleProgressModule],
    templateUrl: './work-talent.component.html',
    styleUrls: ['./work-talent.component.scss'],
})
export class WorkTalentComponent implements OnInit {
    @Input() workTalentObject: {
        value: number
        comparison1: string
        comparison2: string
        description: string
        label: string
    }[]

    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    @Input() loading: boolean

    value2 = 95

    ngOnInit(): void {
        this.primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color')
        this.secondaryColor = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    }
}
