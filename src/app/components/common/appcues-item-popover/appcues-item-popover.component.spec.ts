import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { AppcuesItemPopoverComponent } from './appcues-item-popover.component'
import { PrimengModule } from '../../../shared/primeng/primeng.module'

describe('AppcuesItemPopoverComponent', () => {
    let component: AppcuesItemPopoverComponent
    let fixture: ComponentFixture<AppcuesItemPopoverComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, PrimengModule, AppcuesItemPopoverComponent],
        }).compileComponents()

        fixture = TestBed.createComponent(AppcuesItemPopoverComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form with default values', () => {
        expect(component.createItemForm.get('bannerkey')?.value).toBe('')
        expect(component.createItemForm.get('version')?.value).toBe('')
    })

    it('should validate required fields', () => {
        const bannerkeyControl = component.createItemForm.get('bannerkey')
        const versionControl = component.createItemForm.get('version')

        bannerkeyControl?.setValue('')
        versionControl?.setValue('')
        bannerkeyControl?.markAsTouched()
        versionControl?.markAsTouched()

        expect(bannerkeyControl?.hasError('required')).toBeTruthy()
        expect(versionControl?.hasError('required')).toBeTruthy()
        expect(component.createItemForm.valid).toBeFalsy()
    })

    it('should validate version format', () => {
        const versionControl = component.createItemForm.get('version')

        versionControl?.setValue('invalid-version')
        versionControl?.markAsTouched()

        expect(versionControl?.hasError('pattern')).toBeTruthy()
    })

    it('should accept valid version format', () => {
        const versionControl = component.createItemForm.get('version')

        versionControl?.setValue('5')
        versionControl?.markAsTouched()

        expect(versionControl?.hasError('pattern')).toBeFalsy()
    })

    it('should emit itemCreated event with form data when form is valid', () => {
        spyOn(component.itemCreated, 'emit')

        component.createItemForm.patchValue({
            bannerkey: 'test-key',
            version: '5',
        })

        component.onSubmit()

        expect(component.itemCreated.emit).toHaveBeenCalledWith({
            bannerkey: 'test-key',
            version: '5',
            isActive: true,
        })
    })

    it('should emit cancelled event when cancel is clicked', () => {
        spyOn(component.cancelled, 'emit')

        component.onCancel()

        expect(component.cancelled.emit).toHaveBeenCalled()
    })

    it('should reset form when cancelled', () => {
        component.createItemForm.patchValue({
            bannerkey: 'test-key',
            version: '5',
        })

        component.onCancel()

        expect(component.createItemForm.get('bannerkey')?.value).toBe('')
        expect(component.createItemForm.get('version')?.value).toBe('')
    })

    it('should update title based on itemType', () => {
        component.itemType = 'banner'
        expect(component.formTitle).toBe('Create New Banner')

        component.itemType = 'tour'
        expect(component.formTitle).toBe('Create New Tour')
    })

    it('should update labels based on itemType', () => {
        component.itemType = 'banner'
        expect(component.bannerkeyLabel).toBe('Banner Key')
        expect(component.bannerkeyPlaceholder).toBe('Enter banner key')

        component.itemType = 'tour'
        expect(component.bannerkeyLabel).toBe('Tour Key')
        expect(component.bannerkeyPlaceholder).toBe('Enter tour key')
    })
})
