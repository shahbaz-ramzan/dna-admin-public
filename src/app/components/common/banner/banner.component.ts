import { Component, EventEmitter, OnInit, Output } from '@angular/core'

@Component({
    selector: 'app-banner',
    standalone: true,
    imports: [],
    templateUrl: './banner.component.html',
    styleUrls: ['./banner.component.scss'],
})
export class BannerComponent implements OnInit {
    @Output() bannerDismissed = new EventEmitter<void>()
    @Output() tryItNow = new EventEmitter<void>()

    constructor() {}

    ngOnInit(): void {
        // Banner visibility is now controlled by parent component (navbar)
        console.log('Banner component initialized')
    }

    dismissBanner(): void {
        this.bannerDismissed.emit()
    }

    onTryItNow(): void {
        this.tryItNow.emit()
    }
}
