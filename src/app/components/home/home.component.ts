import { Component, OnInit, ViewContainerRef } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PrimeNGConfig } from 'primeng/api'
import { NavBarComponent } from '../common/nav-bar/nav-bar.component'
import { FooterComponent } from '../common/footer/footer.component'

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterModule, NavBarComponent, FooterComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
    visibleSidebar2 = false
    displayModal = false
    displaySideModal = false
    sideModalPosition = ''
    test = ''

    htmlOneAsString = `
    <div>Welcome Text Header</div>
  `

    htmlTwoAsString = `
    <div>Welcome Text Content</div>
  `

    htmlAsString = `
    <div><div>${this.htmlOneAsString}</div><div>${this.htmlTwoAsString}</div></div>
  `
    constructor(
        private primengConfig: PrimeNGConfig,
        private viewContainerRef: ViewContainerRef
    ) {}

    ngOnInit() {
        this.primengConfig.ripple = true
    }
    onModalClose(event: boolean) {
        this.displayModal = event
    }

    showModal() {
        this.displayModal = true
    }

    showSideModal(position: string) {
        this.sideModalPosition = position
        this.displaySideModal = true
    }

    onSideModalClose(event: boolean) {
        this.displaySideModal = event
    }
}
