import { Component, DestroyRef, Input, OnChanges, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { SingleLineHorizontalComponent } from 'src/app/components/graphs/single-line-horizontal/single-line-horizontal.component'

@Component({
    selector: 'app-workplace-insights',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, SingleLineHorizontalComponent],
    templateUrl: './workplace-insights.component.html',
    styleUrls: ['./workplace-insights.component.scss'],
})
export class WorkplaceInsightsComponent implements OnInit, OnChanges {
    @Input() loading: boolean
    @Input() chartColor: any[] = []
    @Input() workPlaceObject: { labels: string[]; data: any[] }
    barThickness = 10
    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    singleUserWorkPlaceLabels: string[] = []

    singleUserWorkPlaceData: any[] = [
        {
            data: [],
            label: '',
            fillColor: this.secondaryColor2,
            barThickness: this.barThickness,
        },
    ]
    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<{ dashboardReducer: any }>) {}
    ngOnInit(): void {
        this.store
            .select((store) => store.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.accountColorPayload?.data?.secondaryColor2) {
                    this.secondaryColor2 = store?.accountColorPayload?.data?.secondaryColor2
                    this.singleUserWorkPlaceData[0]['fillColor'] = this.secondaryColor2
                }
            })
    }
    ngOnChanges(): void {
        this.singleUserWorkPlaceData[0].data = this.workPlaceObject.data
    }
}
