import { Component, Input, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-communication',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './communication.component.html',
    styleUrls: ['./communication.component.scss'],
})
export class CommunicationComponent implements OnInit {
    @Input() loading: boolean
    @Input() data: any
    @Input() isWorkTalent: boolean
    helpUrl: string

    ngOnInit(): void {
        if (this.isWorkTalent) {
            this.helpUrl = 'https://kb.dnabehavior.com/gene/work-talent-cards-explained#Contact-Methods'
        } else {
            this.helpUrl = 'https://kb.dnabehavior.com/gene/financial-behavior-cards-explained#Contact-Methods'
        }
    }
}
