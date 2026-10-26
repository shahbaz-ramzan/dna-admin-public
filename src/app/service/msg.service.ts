import { Injectable } from '@angular/core'
import { MessageService } from 'primeng/api'
import { AppService } from './app.service'

@Injectable({
    providedIn: 'root',
})
export class MsgService {
    constructor(
        private messageService: MessageService,
        private appService: AppService
    ) {}

    successMessage(message: string) {
        return this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: message,
        })
    }

    errorMessage(message: string) {
        return this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
        })
    }

    reportsSuccessMessage(message: string) {
        return this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: message,
            key: 'reports',
        })
    }

    reportsErrorMessage(message: string) {
        return this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
            key: 'reports',
        })
    }

    showMigratedToaster(userName: string) {
        this.messageService.add({
            severity: 'info',
            detail: userName,
            sticky: true,
            key: 'custom',
        })
    }
    digitalScanInfo(userData: string) {
        return this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: userData,
            key: 'digitalScan',
            life: 10000,
        })
    }

    digitalScanSubmitted(message: string) {
        return this.messageService.add({
            severity: 'success',
            summary: 'Digital Scan Request Submitted',
            detail: message,
            life: 10000,
        })
    }

    digitalScanHelp(personId: string) {
        return this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: personId,
            key: 'digitalScanHelp',
            life: 10000,
        })
    }
}
