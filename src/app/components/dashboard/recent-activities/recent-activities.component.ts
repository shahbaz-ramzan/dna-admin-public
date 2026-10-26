import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, OnInit, Output, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { TableComponent } from '../../common/table/table.component'

@Component({
    selector: 'app-recent-activities',
    templateUrl: './recent-activities.component.html',
    styleUrls: ['./recent-activities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TableComponent],
})
export class RecentActivitiesComponent implements OnInit {
    @Output() toogleEvent = new EventEmitter()
    header: string[] = ['Time', 'Completion']
    dataKeys: string[] = ['time', 'completions']
    loading: boolean
    toogle = false
    data: { time: string; completions: number }[] = [
        {
            time: '7 Days',
            completions: 0,
        },
        {
            time: '14 Days',
            completions: 0,
        },
        {
            time: '28 Days',
            completions: 0,
        },
    ]

    private destroyRef = inject(DestroyRef)

    constructor(
        private store: Store<{ dashboardReducer: any }>,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.store
            .select((state) => state.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.loading = store?.getRecentActivitiesLoading
                if (store?.recentActivitiesResponse) {
                    const recentActivities = store?.recentActivitiesResponse?.data
                    const noOfCompletions = Object.values(recentActivities)
                    this.data.forEach((item: any, i: number) => (item.completions = noOfCompletions[i]))
                }
                this.cdr.markForCheck()
            })
    }
    expand() {
        this.toogle = true
        this.toogleEvent.emit(this.toogle)
    }
    collapse() {
        this.toogle = false
        this.toogleEvent.emit(this.toogle)
    }
}
