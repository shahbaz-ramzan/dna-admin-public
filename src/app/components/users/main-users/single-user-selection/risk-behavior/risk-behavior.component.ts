import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { NgxGaugeModule } from 'ngx-gauge'
import { NgxGaugeType } from 'ngx-gauge/gauge/gauge'
import { DividerModule } from 'primeng/divider'
import K from 'src/app/constants'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
@Component({
    selector: 'app-risk-behavior',
    standalone: true,
    imports: [CommonModule, NgxGaugeModule, DividerModule, LoadingSpinnerComponent],
    templateUrl: './risk-behavior.component.html',
    styleUrls: ['./risk-behavior.component.scss'],
})
export class RiskBehaviorComponent implements OnInit {
    @Input() loading: boolean
    @Input() riskBehaviorObject: {
        portfolioStructure: string
        gaugeValue: number
        riskGroup: string
    }

    riskBehaviorResponse: any
    riskGroup = ''
    portfolioStructure = ''
    public canvasWidth = 300
    public needleValue = 65
    public centralLabel = '99.99'
    public name = 'Gauge chart'
    secondaryColor2: string = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    primaryColor: string = getComputedStyle(document.body).getPropertyValue('--primary-color')
    gaugeType: NgxGaugeType = 'semi'
    gaugeValue: number
    gaugeLabel = 'Risk Behavior'
    gaugeSize = 206
    gaugeThick = 14
    gaugeBackgroundColor: string

    thresholdConfig: any = {}

    public options: any

    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<{ dashboardReducer: any }>) {}

    ngOnInit(): void {
        this.portfolioStructure = this.riskBehaviorObject?.portfolioStructure
        this.gaugeValue = this.riskBehaviorObject?.gaugeValue
        this.riskGroup = (this.riskBehaviorObject?.riskGroup ? this.riskBehaviorObject?.riskGroup : 0) + ' of 7'

        this.store
            .select((store) => store.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store: any) => {
                if (
                    store?.accountColorPayload?.data?.primaryColor &&
                    store?.accountColorPayload?.data?.secondaryColor &&
                    store?.accountColorPayload?.data?.secondaryColor2
                ) {
                    this.primaryColor = store?.accountColorPayload?.data?.primaryColor
                    this.secondaryColor2 = store?.accountColorPayload?.data?.secondaryColor2

                    this.gaugeBackgroundColor = this.secondaryColor2
                } else {
                    this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
                    this.secondaryColor2 = K.APP.DEFAULT_SECONDARY_COLOR2
                }

                this.thresholdConfig = {
                    '0': { color: this.secondaryColor2 },
                    '40': { color: this.secondaryColor2 },
                    '100': { color: this.secondaryColor2 },
                }
            })
    }
}
