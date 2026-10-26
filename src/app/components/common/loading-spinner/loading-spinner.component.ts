import { Component, Input } from '@angular/core'
import { ProgressSpinnerModule } from 'primeng/progressspinner'

// Replaces the `<div class="dna-spinner">...<p-progressSpinner>...</div>` markup duplicated
// across ~50 components. `.dna-spinner`/`.fixed-spinner` are global styles (see
// src/assets/scss/supporting/_global.scss), not component-scoped, so this renders identically to
// every existing inline usage.
@Component({
    selector: 'app-loading-spinner',
    templateUrl: './loading-spinner.component.html',
    standalone: true,
    imports: [ProgressSpinnerModule],
})
export class LoadingSpinnerComponent {
    @Input() fixed = false
}
