import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'

import { EmailSettingsComponent } from './email-settings.component'
import { StoreModule } from '@ngrx/store'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { MsalService } from '@azure/msal-angular'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../mocks/mock-settings.service'
import { SettingsService } from '../settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { FormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { RouterTestingModule } from '@angular/router/testing'
import { By } from '@angular/platform-browser'
import { mainUserReducer } from '../../users/main-users/mainUserStore/main-users.reducer'
import { dashboardReducer } from '../../dashboard/dashboard.reducer'
import { onboardingReducer } from '../../onboarding/store/onboarding.reducer'

describe('EmailSettingsComponent', () => {
    let component: EmailSettingsComponent
    let fixture: ComponentFixture<EmailSettingsComponent>
    let activatedRoute: ActivatedRoute
    let httpMock: HttpTestingController
    let msalService: MsalService
    let settingService: SettingsService
    let msgService: MsgService
    let mixpanelService: MixpanelService
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                PrimengModule,
                StoreModule.forRoot({
                    settingsReducer,
                    mainUserReducer,
                    dashboardReducer,
                    onboardingReducer,
                }),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                EmailSettingsComponent,
            ],
            providers: [
                provideMockStore(),
                { provide: MsalService, useClass: MockMsalService },
                { provide: SettingsService, useClass: MockSettingsService },
                { provide: MsgService, useClass: MockMsgService },
                { provide: MixpanelService, useClass: MockMixPanelService },
            ],
        }).compileComponents()
    })

    beforeEach(() => {
        store = TestBed.get(MockStore)
        spyOn(store, 'select').and.callThrough()
        spyOn(store, 'dispatch')
        store.setState(initialState)
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(EmailSettingsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Email Settings' heading", () => {
        component.permissionObject = {}
        component.permissionObject['Email-Setting'] = true
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="heading"]')
        expect(el.textContent).toContain('Email Settings')
    })

    it("should render 'Automated Reminder Emails' label with corresponding switch", () => {
        component.permissionObject = {}
        component.permissionObject['Email-Setting'] = true
        fixture.detectChanges()
        const switchEl = fixture.debugElement.nativeElement.querySelector('[data-testId="email-reminder-switch"]')
        const labelEl = fixture.debugElement.nativeElement.querySelector('[data-testId="email-reminder-label"]')

        expect(switchEl).toBeTruthy()
        expect(labelEl.textContent).toContain('Automated Reminder Emails')
    })

    it("should render 'Customize the reminder email text' label with corresponding textarea", () => {
        component.permissionObject = {}
        component.permissionObject['Email-Setting'] = true
        fixture.detectChanges()
        const textareaEl = fixture.debugElement.nativeElement.querySelector('[data-testId="customize-textarea"]')
        const labelEl = fixture.debugElement.nativeElement.querySelector('[data-testId="customize-label"]')

        expect(labelEl.textContent).toContain('Customize the reminder email text')
        expect(textareaEl).toBeTruthy()
    })

    it("should render Save button and call 'saveCustomizeEmailText' method on click", fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Email-Setting'] = true
        component.customEmailText = 'example@example.com'
        fixture.detectChanges()
        spyOn(component, 'saveCustomizeEmailText')

        const btnEl = fixture.debugElement.nativeElement.querySelector('[data-testId="save-btn"]')
        expect(btnEl.textContent).toContain('Save')
        btnEl.click()
        tick()
        expect(component.saveCustomizeEmailText).toHaveBeenCalled()
    }))

    it("should render 'Automated Reminder Emails' icon and call 'onTooltipInfoClick' method on click", fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Email-Setting'] = true
        fixture.detectChanges()
        spyOn(component, 'onTooltipInfoClick')

        const btnEl = fixture.debugElement.nativeElement.querySelector('[data-testId="icon-information"]')
        expect(btnEl).toBeTruthy()
        btnEl.click()
        tick()
        expect(component.onTooltipInfoClick).toHaveBeenCalled()
    }))
})
