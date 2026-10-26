import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms'
import { Subscription } from 'rxjs'
import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'
import { RippleModule } from 'primeng/ripple'
import { InputTextModule } from 'primeng/inputtext'

export type ItemType = 'banner' | 'tour'

export interface CreateItemData {
    bannerkey?: string
    version: string
    isActive: boolean
}

@Component({
    selector: 'app-appcues-item-popover',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, RippleModule, InputTextModule],
    templateUrl: './appcues-item-popover.component.html',
    styleUrls: ['./appcues-item-popover.component.scss'],
})
export class AppcuesItemPopoverComponent implements OnInit, OnChanges, OnDestroy {
    @Input() visible: boolean = false
    @Input() itemType: ItemType = 'banner'
    @Input() title: string = ''
    @Input() submitButtonText: string = 'Create'
    @Input() cancelButtonText: string = 'Cancel'
    @Input() isLoading: boolean = false
    @Input() apiError: string = ''

    @Output() visibleChange = new EventEmitter<boolean>()
    @Output() itemCreated = new EventEmitter<CreateItemData>()
    @Output() cancelled = new EventEmitter<void>()

    createItemForm: FormGroup
    private valueChangeSubscription?: Subscription

    constructor(private fb: FormBuilder) {
        this.createItemForm = this.fb.group({
            bannerkey: ['', [Validators.required, Validators.minLength(2)]],
            version: ['', [Validators.required, Validators.pattern(/^\d+$/), this.versionGreaterThanZeroValidator]],
        })
    }

    // Custom validator to ensure version is greater than 0
    versionGreaterThanZeroValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value
        if (value && !isNaN(value)) {
            const numValue = parseInt(value, 10)
            if (numValue <= 0) {
                return { versionTooLow: true }
            }
        }
        return null
    }

    ngOnInit(): void {
        this.updateFormValidation()
        this.setupFormValueTrimming()
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue === true) {
            // Reset form when popover opens
            this.resetForm()
        }

        if (changes['itemType'] && this.itemType) {
            this.updateFormValidation()
        }
    }

    private updateFormValidation(): void {
        const bannerkeyControl = this.createItemForm.get('bannerkey')

        if (this.itemType === 'banner') {
            bannerkeyControl?.setValidators([Validators.required, Validators.minLength(2)])
            bannerkeyControl?.updateValueAndValidity()
        } else if (this.itemType === 'tour') {
            bannerkeyControl?.setValidators([Validators.required, Validators.minLength(2)])
            bannerkeyControl?.updateValueAndValidity()
        }
    }

    private setupFormValueTrimming(): void {
        // Trim bannerkey value in real-time to prevent tab characters and whitespace
        const bannerkeyControl = this.createItemForm.get('bannerkey')
        this.valueChangeSubscription = bannerkeyControl?.valueChanges.subscribe((value: string) => {
            if (value && value !== value.trim()) {
                bannerkeyControl.setValue(value.trim(), { emitEvent: false })
            }
        })
    }

    get formTitle(): string {
        if (this.title) {
            return this.title
        }
        return this.itemType === 'banner' ? 'Create New Banner' : 'Create New Tour'
    }

    get bannerkeyLabel(): string {
        return this.itemType === 'banner' ? 'Banner Key' : 'Tour Key'
    }

    get bannerkeyPlaceholder(): string {
        return this.itemType === 'banner' ? 'Enter banner key' : 'Enter tour key'
    }

    get bannerkeyError(): string {
        const control = this.createItemForm.get('bannerkey')
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return `${this.bannerkeyLabel} is required`
            }
            if (control.errors['minlength']) {
                return `${this.bannerkeyLabel} must be at least 2 characters`
            }
        }
        return ''
    }

    get versionError(): string {
        const control = this.createItemForm.get('version')
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'Version is required'
            }
            if (control.errors['pattern']) {
                return 'Version must be a number (e.g., 1, 2, 3, 4, 5)'
            }
            if (control.errors['versionTooLow']) {
                return 'Version must be greater than 0'
            }
        }
        return ''
    }

    onSubmit(): void {
        if (this.createItemForm.valid) {
            const formData: CreateItemData = {
                bannerkey: this.createItemForm.value.bannerkey?.trim(),
                version: this.createItemForm.value.version,
                isActive: true, // Default to active
            }
            this.itemCreated.emit(formData)
        } else {
            this.markFormGroupTouched()
        }
    }

    onCancel(): void {
        this.resetForm()
        this.cancelled.emit()
        this.visibleChange.emit(false)
    }

    onDialogVisibleChange(visible: boolean): void {
        // If dialog is trying to close but we're loading, prevent it
        if (!visible && this.isLoading) {
            // Don't emit the close event, keep dialog open
            return
        }
        // Otherwise, allow normal close behavior
        this.visibleChange.emit(visible)
    }

    onClose(): void {
        this.visibleChange.emit(false)
    }

    private resetForm(): void {
        this.createItemForm.reset({
            bannerkey: '',
            version: '',
        })
        // Clear API error when form is reset
        this.apiError = ''
    }

    private markFormGroupTouched(): void {
        Object.keys(this.createItemForm.controls).forEach((key) => {
            const control = this.createItemForm.get(key)
            control?.markAsTouched()
        })
    }

    // Helper method to check if a field has error
    hasError(fieldName: string): boolean {
        const control = this.createItemForm.get(fieldName)
        return !!(control?.errors && control.touched)
    }

    // Helper method to get field class for styling
    getFieldClass(fieldName: string): string {
        const control = this.createItemForm.get(fieldName)
        const baseClass = 'form-control'
        if (control?.errors && control.touched) {
            return `${baseClass} border-danger`
        }
        return baseClass
    }

    ngOnDestroy(): void {
        if (this.valueChangeSubscription) {
            this.valueChangeSubscription.unsubscribe()
        }
    }
}
