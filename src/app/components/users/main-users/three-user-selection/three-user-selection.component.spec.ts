import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'

import { ThreeUserSelectionComponent } from './three-user-selection.component'
import { provideMockStore } from '@ngrx/store/testing'
import { MsalService } from '@azure/msal-angular'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from 'src/app/components/settings/mocks/mock-settings.service'
import { SettingsService } from 'src/app/components/settings/settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MockConfirmationService } from 'src/mocks/mock-confirmation.service'
import { ConfirmationService } from 'primeng/api'
import { MainUsersService } from '../../main-users.service'
import { MockMainUsersService } from 'src/mocks/mock-main-users.service'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'
import { mainUserReducer } from '../mainUserStore/main-users.reducer'

describe('ThreeUserSelectionComponent', () => {
    let component: ThreeUserSelectionComponent
    let fixture: ComponentFixture<ThreeUserSelectionComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                PrimengModule,
                StoreModule.forRoot({ dashboardReducer: dashboardReducer, mainUserReducer: mainUserReducer }),
                RouterTestingModule.withRoutes([]),
                ThreeUserSelectionComponent,
            ],
            providers: [provideMockStore(), { provide: MixpanelService, useClass: MockMixPanelService }],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(ThreeUserSelectionComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'unique style' chart", () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-unique-style"]')
        expect(el).toBeTruthy()
    })

    it("should render 'Financial Report'", () => {
        component.permissionObject = {}
        component.permissionObject['Feature-User-Card-Reports'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-financial-report"]')
        expect(el).toBeTruthy()
    })

    it('should render discovery-inprogress alert', () => {
        component.isSomeDiscoveryInProgress = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="discovery-inprogress-alert"]')
        expect(el).toBeTruthy()
    })
})
