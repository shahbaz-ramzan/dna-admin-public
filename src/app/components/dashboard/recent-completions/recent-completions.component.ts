import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, OnInit, Output, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { TableComponent } from '../../common/table/table.component'
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-recent-completions',
    templateUrl: './recent-completions.component.html',
    styleUrls: ['./recent-completions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, TableComponent, LoadingSpinnerComponent],
})
export class RecentCompletionsComponent implements OnInit {
    @Output() toogleEvent = new EventEmitter()
    toogle = false

    header: string[] = ['Name', 'Last Name', 'Unique Style']
    dataKeys: string[] = ['firstName', 'lastName', 'uniqueStyle']
    loading: boolean
    data: any[] = []
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
                this.loading = store?.getLastCompletionsLoading

                if (store?.lastCompletionsResponse) {
                    this.data = store?.lastCompletionsResponse?.data
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
