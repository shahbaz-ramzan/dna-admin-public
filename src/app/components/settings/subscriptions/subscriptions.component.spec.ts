import { ComponentFixture, TestBed } from '@angular/core/testing'

import { SubscriptionsComponent } from './subscriptions.component'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from '../settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { StoreModule } from '@ngrx/store'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../mocks/mock-settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MockConfirmationService } from 'src/mocks/mock-confirmation.service'
import { ConfirmationService } from 'primeng/api'
import { AppService } from 'src/app/service/app.service'
import { MockAppService } from 'src/mocks/mock-app.service'

describe('SubscriptionsComponent', () => {
    let component: SubscriptionsComponent
    let fixture: ComponentFixture<SubscriptionsComponent>
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
                BrowserDynamicTestingModule,
                FormsModule,
                ReactiveFormsModule,
                PrimengModule,
                StoreModule.forRoot({ settingsReducer: settingsReducer }),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                SubscriptionsComponent,
            ],
            providers: [
                provideMockStore(),
                { provide: MsalService, useClass: MockMsalService },
                { provide: SettingsService, useClass: MockSettingsService },
                { provide: MsgService, useClass: MockMsgService },
                { provide: MixpanelService, useClass: MockMixPanelService },
                { provide: ConfirmationService, useClass: MockConfirmationService },
                { provide: AppService, useClass: MockAppService },
                // { provide: MixpanelService, useClass: MockMixPanelService },
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
        fixture = TestBed.createComponent(SubscriptionsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    beforeEach(() => {
        component.permissionObject = {}
        component.permissionObject['Settings-Subscriptions'] = true
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Subscription heading'", () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="subscription-heading"]')
        expect(el?.textContent).toContain('Subscriptions')
    })

    it("should render 'Subscription Name' label with its input", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="name-label"]')
        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="name-input"]')

        expect(label.textContent).toContain('Subscription Name')
        expect(input).toBeTruthy()
    })

    it("should render 'Subscription Status' label with its input", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="status-label"]')
        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="status-input"]')

        expect(label.textContent).toContain('Subscription Status')
        expect(input).toBeTruthy()
    })

    it("should render 'Subscribed Until' label with its input", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="until-label"]')
        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="until-input"]')

        expect(label.textContent).toContain('Subscribed Until')
        expect(input).toBeTruthy()
    })

    it("should render 'Subscription ID' label with its input", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="id-label"]')
        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="id-input"]')

        expect(label.textContent).toContain('Subscription ID')
        expect(input).toBeTruthy()
    })

    it("should render 'Manage Subscription' label with its input", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="manage-label"]')
        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="manage-input"]')

        expect(label.textContent).toContain('Manage Subscription')
        expect(input).toBeTruthy()
    })

    it("should render 'Referral Code' label with its input", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="code-label"]')
        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="code-input"]')

        expect(label.textContent).toContain('Referral Code')
        expect(input).toBeTruthy()
    })
})
