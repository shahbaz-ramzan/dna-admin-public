import { Component, Input, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-environment-keys',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './environment-keys.component.html',
    styleUrls: ['./environment-keys.component.scss'],
})
export class EnvironmentKeysComponent implements OnInit {
    @Input() loading: boolean
    @Input() performanceType = 'Performance'
    @Input() name: string
    @Input() data: any[]
    @Input() index: string
    helpUrl: string

    ngOnInit(): void {
        if (this.index == 'single0') {
            if (this.performanceType === 'Strengths') {
                this.helpUrl = 'https://kb.dnabehavior.com/gene/financial-behavior-cards-explained#Strengths'
            } else if (this.performanceType === 'Struggles') {
                this.helpUrl = 'https://kb.dnabehavior.com/gene/financial-behavior-cards-explained#Struggles'
            } else this.helpUrl = 'https://kb.dnabehavior.com/gene/financial-behavior-cards-explained#Communication-Keys'
        } else {
            if (this.performanceType === 'Strengths') {
                this.helpUrl = 'https://kb.dnabehavior.com/gene/work-talent-cards-explained#Strengths'
            } else if (this.performanceType === 'Struggles') {
                this.helpUrl = 'https://kb.dnabehavior.com/gene/work-talent-cards-explained#Struggles'
            } else this.helpUrl = 'https://kb.dnabehavior.com/gene/work-talent-cards-explained#Communication-Keys'
        }
    }
}
