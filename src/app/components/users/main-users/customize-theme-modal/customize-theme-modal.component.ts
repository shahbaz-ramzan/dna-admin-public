import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ButtonModule } from 'primeng/button'
import { InputSwitchModule } from 'primeng/inputswitch'
import { RippleModule } from 'primeng/ripple'
import { SidebarModule } from 'primeng/sidebar'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import { UpdateColorAction, UpdateColorSuccessAction, getDarkModeStatus } from '../mainUserStore/main-users.actions'
import { selectDarkModeSwitch } from '../mainUserStore/main-users.selectors'

@Component({
    selector: 'app-customize-theme-modal',
    standalone: true,
    imports: [FormsModule, SidebarModule, ButtonModule, RippleModule, InputSwitchModule],
    templateUrl: './customize-theme-modal.component.html',
    styleUrls: ['./customize-theme-modal.component.scss'],
})
export class CustomizeThemeModalComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    @Input() visible = false
    @Input() permissionObject: any = {}
    @Input() accountId: any

    @Output() visibleChange = new EventEmitter<boolean>()
    @Output() darkModeToggled = new EventEmitter<void>()

    primaryColorFlag: boolean
    secondaryColorFlag: boolean
    primaryColor: string
    secondaryColor: string
    darkModeStatus: boolean
    darkModeText: string

    constructor(
        private store: Store<{ mainUserReducer: any }>,
        private dashboardStore: Store<{ dashboardReducer: any }>,
        private actions: Actions,
        private router: Router
    ) {
        this.primaryColorFlag = false
        this.secondaryColorFlag = false
        this.darkModeStatus = false
        this.darkModeText = 'Dark Mode Off'
    }

    ngOnInit(): void {
        this.dashboardStore
            .select((store) => store.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (store?.accountColorPayload?.data?.primaryColor && store?.accountColorPayload?.data?.secondaryColor) {
                    this.primaryColor = store?.accountColorPayload?.data?.primaryColor
                    this.secondaryColor = store?.accountColorPayload?.data?.secondaryColor
                } else {
                    this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
                    this.secondaryColor = K.APP.DEFAULT_SECONDARY_COLOR
                }
            })

        this.store
            .select(selectDarkModeSwitch)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((darkModeSwitch) => {
                if (darkModeSwitch?.checked) {
                    this.darkModeStatus = true
                    this.darkModeText = 'Dark Mode On'
                    localStorage.setItem('tScoreColor', Encryption.encryptData('#000000'))
                } else {
                    this.darkModeStatus = false
                    this.darkModeText = 'Dark Mode Off'
                    localStorage.setItem('tScoreColor', Encryption.encryptData('#ffffff'))
                }
            })

        this.actions.pipe(ofType(UpdateColorSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            document.documentElement.style.setProperty(`--primary-color`, K.APP.DEFAULT_PRIMARY_COLOR)
            document.documentElement.style.setProperty(`--secondary-color`, K.APP.DEFAULT_SECONDARY_COLOR)
            document.documentElement.style.setProperty(`--secondary-color2`, K.APP.DEFAULT_SECONDARY_COLOR2)
            this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
            this.secondaryColor = K.APP.DEFAULT_SECONDARY_COLOR
            this.router.navigate([''])
        })
    }

    show(): void {
        this.visible = true
        this.visibleChange.emit(true)
    }

    close(): void {
        this.visible = false
        this.visibleChange.emit(false)
    }

    onVisibleChange(value: boolean): void {
        this.visible = value
        this.visibleChange.emit(value)
    }

    colorChange(): void {
        this.store.dispatch(
            UpdateColorAction({
                accountId: this.accountId,
                primaryColor: this.primaryColor,
                secondaryColor: this.secondaryColor,
            })
        )

        this.close()
        this.router.navigate([''])
    }

    setDefaultColors(): void {
        this.store.dispatch(
            UpdateColorAction({
                accountId: this.accountId,
                primaryColor: K.APP.DEFAULT_PRIMARY_COLOR,
                secondaryColor: K.APP.DEFAULT_SECONDARY_COLOR,
            })
        )
    }

    darkThemeToggle(value: any): void {
        this.store.dispatch(getDarkModeStatus({ checked: value.checked }))
        document.body.classList.toggle('dark-theme')
        this.darkModeToggled.emit()
    }

    primaryColorMethod(): void {
        this.primaryColorFlag = true
    }

    secondaryColorMethod(): void {
        this.secondaryColorFlag = true
    }
}
