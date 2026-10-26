import { Confirmation, ConfirmationService } from 'primeng/api'
import { Observable, Subject } from 'rxjs'

export class MockConfirmationService {
    private requireConfirmationSource = new Subject<Confirmation>()
    public requireConfirmation$: Observable<Confirmation> = this.requireConfirmationSource.asObservable()

    private acceptConfirmationSource = new Subject<void>()
    public accept: Observable<void> = this.acceptConfirmationSource.asObservable()

    confirm(confirmation: Confirmation): MockConfirmationService {
        this.requireConfirmationSource.next(confirmation)
        return this // Allow method chaining for testing purposes
    }

    close(): MockConfirmationService {
        // Optional implementation based on your component's usage
        return this
    }

    onAccept(): void {
        this.acceptConfirmationSource.next()
    }
}
