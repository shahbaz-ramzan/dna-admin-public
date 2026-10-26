import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-strongest-factors',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './strongest-factors.component.html',
    styleUrls: ['./strongest-factors.component.scss'],
})
export class StrongestFactorsComponent {
    @Input() strongestFactorsObject: { factors: string[] }
    @Input() loading: boolean
}
