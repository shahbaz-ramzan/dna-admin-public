import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { DropdownModule } from 'primeng/dropdown'
import { getOnboardingUserLabels } from '../store/onboarding.actions'

@Component({
    selector: 'app-reviews-labels',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule],
    templateUrl: './reviews-labels.component.html',
    styleUrls: ['./reviews-labels.component.css'],
})
export class ReviewsLabelsComponent implements OnInit {
    @Output() getReviewsLabelEvent = new EventEmitter()
    @Input() isReviewsLabelValid = false
    @Input() isValidationChecked = false
    @Input() selectedReviewsLabel: any
    @Input() selectedParticipantLabel: any
    labels: any[] = []
    loading: boolean
    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<{ onboardingReducer: any }>) {}

    ngOnInit(): void {
        this.store.dispatch(getOnboardingUserLabels())
        this.store
            .select((state) => state.onboardingReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.labels = []
                this.loading = response?.onboardingUsersLoading
                if (response?.onboardingUserLabelsPayload) {
                    response?.onboardingUserLabelsPayload?.data?.forEach((element: any) => {
                        this.labels.push({
                            name: element.singularLabel,
                            id: element.userLabelReferenceId,
                        })
                    })
                }
            })
    }

    getLabelName() {
        this.getReviewsLabelEvent.emit(this.selectedReviewsLabel)
    }
}
