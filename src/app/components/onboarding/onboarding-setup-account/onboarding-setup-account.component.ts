import { Component, Output, EventEmitter, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
@Component({
    selector: 'app-onboarding-setup-account',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule],
    templateUrl: './onboarding-setup-account.component.html',
    styleUrls: ['./onboarding-setup-account.component.scss'],
})
export class OnboardingSetupAccountComponent {
    @Output() businessNameEvent = new EventEmitter()
    @Input() isAccountValid = false
    @Input() isValidationChecked = false
    @Input() businessName = ''
    @Input() errorMessage = ''

    getBusinessName() {
        this.businessNameEvent.emit(this.businessName)
    }
}
