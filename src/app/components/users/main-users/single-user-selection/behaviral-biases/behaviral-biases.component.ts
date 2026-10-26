import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { Store } from '@ngrx/store'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { HorizontalBarComponent } from 'src/app/components/graphs/horizontal-bar/horizontal-bar.component'
import { Color } from 'src/app/util/interfaces'

@Component({
    selector: 'app-behaviral-biases',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, HorizontalBarComponent],
    templateUrl: './behaviral-biases.component.html',
    styleUrls: ['./behaviral-biases.component.scss'],
})
export class BehaviralBiasesComponent {
    @Input() behaviralBiasesObject: { data: any[] }
    @Input() loading: boolean
    @Input() chartColor: Color[]
    @Input() isSingleUser = true
    @Input() showLegend: boolean
    @Input() showScores: boolean

    constructor(private store: Store<{ mainUserReducer: any }>) {}
}
