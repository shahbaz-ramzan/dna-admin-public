import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Store } from '@ngrx/store'
import { DropdownModule } from 'primeng/dropdown'
import { getOnboardingParticipantLabels } from '../store/onboarding.actions'

@Component({
    selector: 'app-get-labels-component',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule],
    templateUrl: './get-labels.component.html',
    styleUrls: ['./get-labels.component.css'],
})
export class GetLabelsComponent implements OnInit {
    @Output() getLabelEvent = new EventEmitter()
    @Input() isLabelValid = false
    @Input() isValidationChecked = false
    @Input() selectedLabel: any
    labels: any[]
    loading: boolean
    private destroyRef = inject(DestroyRef)

    constructor(private store: Store<{ onboardingReducer: any }>) {}

    ngOnInit(): void {
        this.store.dispatch(getOnboardingParticipantLabels())
        this.store
            .select((state) => state.onboardingReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.labels = []
                this.loading = response?.onboardingParticipantsLoading
                if (response?.onboardingParticipantLabelsPayload) {
                    response?.onboardingParticipantLabelsPayload?.data?.forEach((element: any) => {
                        this.labels.push({
                            name: element.label,
                            id: element.id,
                        })
                    })
                }
            })
    }

    getLabelName() {
        this.getLabelEvent.emit(this.selectedLabel)
    }
}
