import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import K from 'src/app/constants'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { TooltipModule } from 'primeng/tooltip'

@Component({
    selector: 'app-style-match',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, TooltipModule],
    templateUrl: './style-match.component.html',
    styleUrls: ['./style-match.component.scss'],
})
export class StyleMatchComponent implements OnInit {
    @Input() firstName: string
    @Input() secondName: string
    @Input() singleUser: boolean
    @Input() index: string

    @Input() loading: boolean
    @Input() styleMatchObject: { percentage: number }
    secondaryColor2: any
    primaryColor: any
    @Input() isFinancial: boolean
    @Input() isWork: boolean
    helpUrl: string

    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<{ mainUserReducer: any; dashboardReducer: any }>) {
        this.secondaryColor2 = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
        this.primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color')
    }

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

        if (this.index === 'single0') {
            this.helpUrl = 'https://kb.dnabehavior.com/gene/financial-behavior-cards-explained#Style-Match'
        } else {
            this.helpUrl = 'https://kb.dnabehavior.com/gene/work-talent-cards-explained#Style-Match'
        }
    }
}
