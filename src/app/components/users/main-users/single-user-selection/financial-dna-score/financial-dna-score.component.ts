import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { NgCircleProgressModule } from 'ng-circle-progress'
import K from 'src/app/constants'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-financial-dna-score',
    standalone: true,
    imports: [CommonModule, NgCircleProgressModule, LoadingSpinnerComponent],
    templateUrl: './financial-dna-score.component.html',
    styleUrls: ['./financial-dna-score.component.scss'],
})
export class FinancialDnaScoreComponent implements OnInit {
    @Input() loading: boolean
    @Input() financialBehaviours: {
        value: number
        title: string
        description: string
    }[]
    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')

    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')

    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<{ mainUserReducer: any; dashboardReducer: any }>) {}
    ngOnInit(): void {
        this.store
            .select((store) => store.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.accountColorPayload?.data?.primaryColor && store?.accountColorPayload?.data?.secondaryColor2) {
                    this.primaryColor = store?.accountColorPayload?.data?.primaryColor
                    this.secondaryColor2 = store?.accountColorPayload?.data?.secondaryColor2
                } else {
                    this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
                    this.secondaryColor2 = K.APP.DEFAULT_SECONDARY_COLOR2
                }
            })
    }
}
