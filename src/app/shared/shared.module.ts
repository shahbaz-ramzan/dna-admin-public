import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { PrimengModule } from './primeng/primeng.module'
import { PopoverComponent } from '../components/common/popover/popover.component'
import { AppcuesItemPopoverComponent } from '../components/common/appcues-item-popover/appcues-item-popover.component'
import { LoadingSpinnerComponent } from '../components/common/loading-spinner/loading-spinner.component'
import { ReportLoadingOverlayComponent } from '../components/common/report-loading-overlay/report-loading-overlay.component'

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        PrimengModule,
        ReactiveFormsModule,
        ProgressSpinnerModule,
        LoadingSpinnerComponent,
        PopoverComponent,
        AppcuesItemPopoverComponent,
        ReportLoadingOverlayComponent,
    ],
    exports: [PopoverComponent, AppcuesItemPopoverComponent, LoadingSpinnerComponent, ReportLoadingOverlayComponent],
    providers: [],
})
export class SharedModule {}
