import { Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ButtonModule } from 'primeng/button'

@Component({
    selector: 'app-upload-logo',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule],
    templateUrl: './upload-logo.component.html',
    styleUrls: ['./upload-logo.component.css'],
})
export class UploadLogoComponent {
    imageFormats: string

    @Output() setLogoEvent = new EventEmitter()
    @Input() isValidationChecked = false
    @Input() selectedLogo: any

    constructor() {
        this.imageFormats = 'image/*'
    }

    deleteLogo() {
        this.selectedLogo = null
        this.setLogoEvent.emit(this.selectedLogo)
    }
    onLogoSelected(fileInput: any) {
        if (fileInput.target.files && fileInput.target.files[0]) {
            this.setLogoEvent.emit(fileInput.target.files[0])
        }
    }
}
