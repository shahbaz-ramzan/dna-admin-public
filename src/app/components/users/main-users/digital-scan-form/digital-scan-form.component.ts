import { CommonModule } from '@angular/common'
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ShepherdService } from 'angular-shepherd'
import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { DropdownModule } from 'primeng/dropdown'
import { InputTextModule } from 'primeng/inputtext'
import K from 'src/app/constants'
import { TourKey, TourStatus } from 'src/app/enums'
import { ensureApiError } from 'src/app/service/api-error'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { TourManagerService } from 'tour-manager.service'
import { upsertUserTourStateAction } from '../../../tour/tour.actions'
import {
    getDigitalScanScoresAction,
    getDigitalScanScoresActionFailure,
    getDigitalScanScoresActionSuccess,
    getFaciliatorSuccessAction,
    getFacilitatorAction,
    GetTagsActionSuccess,
} from '../mainUserStore/main-users.actions'
import { selectMainUserState } from '../mainUserStore/main-users.selectors'
import { buildDigitalScanTourSteps } from './digital-scan-tour.config'

@Component({
    selector: 'app-digital-scan-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, InputTextModule, CheckboxModule, DropdownModule, ButtonModule],
    templateUrl: './digital-scan-form.component.html',
    styleUrl: './digital-scan-form.component.scss',
})
export class DigitalScanFormComponent implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef)
    @Output('close') closeModal = new EventEmitter()
    @Output('refetchUserList') refetchUserList = new EventEmitter()
    @Input() modalVisible: boolean = false
    @Input() digitalScanTourId: number | null = null
    @Output() tourCompleted = new EventEmitter()

    form: FormGroup

    accountId: any
    tags: any = []
    systemLabels: any = {}
    selectedUser: any = {}
    advisors: any = [{ label: 'Advisor', value: 'advisor' }]
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')

    // Tour constants - now using enums
    private loggedInPersonId: any

    tagIsSelected = true
    isLoading = false

    // Character counters
    jobTitleCharCount = 0
    companyCharCount = 0
    jobTitleMaxLength = 101
    companyMaxLength = 256

    constructor(
        private store: Store<{ mainUserReducer: any; settingsReducer: any }>,
        private actions: Actions,
        private fb: FormBuilder,
        private msgService: MsgService,
        private mixpanelService: MixpanelService,
        private router: Router,
        private route: ActivatedRoute,
        private shepherdService: ShepherdService,
        private tourManagerService: TourManagerService
    ) {
        // Initialize user ID
        const user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (user_object) {
            this.loggedInPersonId = JSON.parse(user_object).personId
        }
        this.form = this.fb.group({
            firstname: ['', [Validators.required]],
            middlename: [''],
            lastname: ['', [Validators.required]],
            designation: [''],
            gender: [''],
            race: [''],
            company: ['', [Validators.required, this.companyValidator.bind(this)]],
            jobTitle: ['', [Validators.required, this.jobTitleValidator.bind(this)]],
            email: [''],
            advisor: ['', Validators.required],
            tags: [''],
        })
    }

    private jobTitleValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null

        const value = control.value.trim()
        const length = value.length

        if (length > 101) {
            return { maxLength: true }
        }

        const wordCount = value.split(/\s+/).filter((word: string) => word.length > 0).length
        if (wordCount > 12) {
            return { maxWords: true }
        }

        const validPattern = /^[a-zA-Z0-9\s\-'\.]+$/
        if (!validPattern.test(value)) {
            return { invalidChars: true }
        }

        return null
    }

    private companyValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null

        const value = control.value.trim()
        const length = value.length

        if (length < 2) {
            return { minLength: true }
        }

        if (length > 256) {
            return { maxLength: true }
        }

        const wordCount = value.split(/\s+/).filter((word: string) => word.length > 0).length
        if (wordCount > 15) {
            return { maxWords: true }
        }

        const validPattern = /^[a-zA-Z0-9\s\-'\.]+$/
        if (!validPattern.test(value)) {
            return { invalidChars: true }
        }

        return null
    }

    private normalizeForEmail(text: string): string {
        if (!text) return ''

        return text
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '')
            .replace(/'/g, '')
            .replace(/[^a-z0-9\-]/g, '')
    }

    private generateEmail(firstName: string, lastName: string): string {
        const normalizedFirst = this.normalizeForEmail(firstName)
        const normalizedLast = this.normalizeForEmail(lastName)

        if (!normalizedFirst || !normalizedLast) {
            return ''
        }

        const timestamp = Math.floor(Date.now() / 1000) // current Unix time in seconds

        return `${normalizedFirst}.${normalizedLast}+${timestamp}@digitalscan.com`
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['modalVisible']) {
            const currentValue = changes['modalVisible'].currentValue
            const previousValue = changes['modalVisible'].previousValue
            // Modal just opened - start tour (tour state will be checked by parent component)
            if (currentValue === true && previousValue === false) {
                this.startTourWhenModalOpens()
                // Tags are already fetched by the parent Users page on load (GetTagsAction) and
                // this component's own GetTagsActionSuccess listener below picks them up from
                // that fetch. Dispatching GetTagsAction again here would re-trigger every other
                // listener on that same success action across the Users page (e.g. the filter
                // list's re-search), not just refresh this modal's tags. Only facilitators are
                // genuinely specific to opening this modal, so only fetch those on open.
                this.store.dispatch(getFacilitatorAction(this.accountId))
            }
            // Modal just closed
            if (currentValue === false && previousValue === true) {
                this.closeTourWhenModalCloses()
            }
        }
    }

    private startTourWhenModalOpens(): void {
        // Don't automatically start tour - let the main users component handle the tour flow
        // The tour should always start from the digital scan button in main users component
        // This method is kept for potential future use but doesn't auto-start tours
    }

    private closeTourWhenModalCloses(): void {
        // Force cleanup when modal closes to ensure clean state for next tour
        this.tourManagerService.forceCleanupForTourSwitch()
    }

    initializeTour(): void {
        this.shepherdService.modal = true
        this.shepherdService.confirmCancel = false
        this.shepherdService.defaultStepOptions = {
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
                enabled: true,
            },
        }

        // Define the tour steps
        const steps = buildDigitalScanTourSteps({
            onFinish: () => {
                this.shepherdService.complete()
                // Update tour state via API - mark Digital Scan tour as completed
                const payload = {
                    userId: this.loggedInPersonId,
                    tourId: this.digitalScanTourId, // Use dynamic ID from API
                    tourKey: TourKey.DigitalScan,
                    tourStatus: TourStatus.Completed,
                }
                this.store.dispatch(upsertUserTourStateAction({ payload }))

                // Close modal and emit tour completed event
                this.closeModal.emit()
                this.tourCompleted.emit()
            },
        })

        // Add steps to the shepherd service
        this.shepherdService.addSteps(steps as any)

        // Handle cancel via cross icon: mark tour as dismissed (status 0)
        if (this.shepherdService.tourObject) {
            this.shepherdService.tourObject.on('cancel', () => {
                // Update tour state via API - mark Digital Scan tour as dismissed
                const payload = {
                    userId: this.loggedInPersonId,
                    tourId: this.digitalScanTourId, // Use dynamic ID from API
                    tourKey: TourKey.DigitalScan,
                    tourStatus: TourStatus.Dismissed,
                }
                this.store.dispatch(upsertUserTourStateAction({ payload }))
                // Use centralized tour manager for cleanup
                this.tourManagerService.forceCleanupForTourSwitch()
                this.closeModal.emit()
                // Don't emit tourCompleted for cancellation - only for actual completion
            })
        }
    }

    startTour(): void {
        setTimeout(() => {
            this.tourManagerService.startTour('digital-scan-form')
        }, 100)
    }

    ngOnInit(): void {
        this.accountId = Encryption.decryptData(localStorage.getItem('accountId'))

        this.form
            .get('jobTitle')
            ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.jobTitleCharCount = value ? value.length : 0
            })

        this.form
            .get('company')
            ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.companyCharCount = value ? value.length : 0
            })

        this.actions.pipe(ofType(GetTagsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
            this.setTags(res?.tagsResponse?.body?.data)
        })

        this.actions.pipe(ofType(getFaciliatorSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (response.status === 200) {
                this.advisors = response.body.data
            }
        })

        this.actions.pipe(ofType(getDigitalScanScoresActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            this.mixpanelService.track('Response for digital scan', response)
        })

        this.actions.pipe(ofType(getDigitalScanScoresActionFailure), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            console.log('[Mixpanel test] Digital scan failed payload:', response)
            this.mixpanelService.track('Digital scan failed', response)
            // `response` here is whatever the effect's catchError caught - since ApiErrorInterceptor
            // normalizes almost everything into an ApiError before it reaches this effect,
            // `response` is usually already `{status, message, raw}`, not a raw HttpErrorResponse
            // (which is what the old `.error` read assumed - that property doesn't exist on an
            // ApiError, so this used to always fall through to the generic fallback text).
            // ensureApiError is idempotent on an already-normalized ApiError, so this is safe
            // for every shape `response` can actually be.
            this.msgService.errorMessage(ensureApiError(response).message)
        })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                this.isLoading = store?.digitalScanLoading
            })
    }

    get firstname() {
        return this.form.get('firstname')
    }
    get middlename() {
        return this.form.get('middlename')
    }
    get lastname() {
        return this.form.get('lastname')
    }
    get company() {
        return this.form.get('company')
    }
    get gender() {
        return this.form.get('gender')
    }
    get race() {
        return this.form.get('race')
    }
    get designation() {
        return this.form.get('designation')
    }
    get jobTitle() {
        return this.form.get('jobTitle')
    }
    get email() {
        return this.form.get('email')
    }
    get advisor() {
        return this.form.get('advisor')
    }
    get tagIdx() {
        return this.form.get('tags')
    }

    onSubmit() {
        const tagIdx: number[] = this.tags.filter((t: any) => t.value).map((t: any) => t.tagId)
        if (tagIdx.length === 0) {
            this.tagIsSelected = false
            return
        }
        this.tagIsSelected = true

        const generatedEmail = this.generateEmail(this.firstname?.value, this.lastname?.value)

        const body = {
            firstName: this.firstname?.value,
            lastName: this.lastname?.value,
            middleName: '',
            email: generatedEmail,
            company: this.company?.value,
            jobTitle: this.jobTitle?.value,
            tagId: tagIdx[0],
            accountId: +this.accountId,
            assignedTo: this.advisor?.value.facilitatorId,
        }
        this.mixpanelService.track('Request for digital scan', body)
        this.store.dispatch(getDigitalScanScoresAction(body))
        this.msgService.digitalScanSubmitted(
            'Your Digital Scan is now in progress. Feel free to continue using the DNA WebApp while we process it in the background. Please avoid refreshing the page immediately — you can refresh after a minute to see the results.'
        )
        this.form.reset()
        this.tags.forEach((t: any) => {
            t.value = false
        })
        this.jobTitleCharCount = 0
        this.companyCharCount = 0
        // this.refetchUserList.emit()
        this.closeModal.emit()

        // Don't emit tourCompleted for form submission - only emit when tour is actually completed via "Finish Tour" button
    }

    CheckBoxChange(index: number) {
        this.tags[index].value = !this.tags[index].value
    }

    setTags(tags: any) {
        this.tags = tags.map((t: any) => ({
            tagId: t.tagId,
            name: t.tag,
            value: false,
        }))
    }

    getJobTitleError(): string {
        const control = this.jobTitle
        if (!control || !control.errors) return ''

        if (control.hasError('maxLength') || control.hasError('maxWords')) {
            return 'Use a single primary title. Max 12 words or 100 characters.'
        }
        if (control.hasError('invalidChars')) {
            return 'Remove special characters. Allowed: letters, numbers, spaces, hyphens, apostrophes, periods.'
        }
        return ''
    }

    getCompanyError(): string {
        const control = this.company
        if (!control || !control.errors) return ''

        if (control.hasError('minLength')) {
            return 'Company name must be at least 2 characters.'
        }
        if (control.hasError('maxLength') || control.hasError('maxWords')) {
            return 'Use the legal company name. Max 15 words or 255 characters.'
        }
        if (control.hasError('invalidChars')) {
            return 'Remove special characters. Allowed: letters, numbers, spaces, hyphens, apostrophes, periods.'
        }
        return ''
    }

    isJobTitleCountRed(): boolean {
        return this.jobTitleCharCount >= this.jobTitleMaxLength
    }

    isCompanyCountRed(): boolean {
        return this.companyCharCount >= this.companyMaxLength
    }
}
