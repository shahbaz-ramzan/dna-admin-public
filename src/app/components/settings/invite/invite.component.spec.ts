import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'

import { InviteComponent } from './invite.component'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from '../settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { RouterTestingModule } from '@angular/router/testing'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../mocks/mock-settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { ConfirmationService } from 'primeng/api'
import { AppService } from 'src/app/service/app.service'
import { MockAppService } from 'src/mocks/mock-app.service'
import { MockConfirmationService } from 'src/mocks/mock-confirmation.service'

describe('InviteComponent', () => {
    let component: InviteComponent
    let fixture: ComponentFixture<InviteComponent>
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
                InviteComponent,
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
        fixture = TestBed.createComponent(InviteComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Add Subscription Admins' heading", () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="heading"]')
        expect(el?.textContent).toContain('Add Subscription Admins')
    })

    it("should render 'Current Subscription' heading", () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="current-subscription"]')
        expect(el?.textContent).toContain('Current Subscription')
    })

    it('should render "Add more" button and call "showModalDialog" on click', fakeAsync(() => {
        const btn = fixture.debugElement.nativeElement.querySelector('[data-testId="add-more-btn"]')
        spyOn(component, 'showModalDialog')
        expect(btn).toBeTruthy()

        btn.click()
        tick()
        expect(component.showModalDialog).toHaveBeenCalled()
    }))

    it('should render "Add User" button and call "addUser" on click', fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Settings-AddSubscriptionUsers'] = true
        fixture.detectChanges()
        const btn = fixture.debugElement.nativeElement.querySelector('[data-testId="add-user-btn"]')
        spyOn(component, 'addUser')
        expect(btn).toBeTruthy()
        btn.removeAttribute('disabled')

        btn.click()
        tick()
        expect(component.addUser).toHaveBeenCalled()
    }))

    it('should render "Select Role" dropdown', () => {
        component.permissionObject = {}
        component.permissionObject['Settings-AddSubscriptionUsers'] = true
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="dropdown"]')
        expect(el).toBeTruthy()
        expect(el.getAttribute('placeholder')).toContain('Select Role')
    })

    it('should render "Search by First Name" field', () => {
        component.permissionObject = {}
        component.permissionObject['Settings-AddSubscriptionUsers'] = true
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="search-field"]')
        expect(el).toBeTruthy()
        expect(el.getAttribute('placeholder')).toContain('Search by First Name')
    })
})
