import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'

import { RegistrationComponent } from './registration.component'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from '../settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing'
// import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { StoreModule } from '@ngrx/store'
import { RouterTestingModule } from '@angular/router/testing'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../mocks/mock-settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { ConfirmationService, PrimeNGConfig } from 'primeng/api'
import { MockConfirmationService } from 'src/mocks/mock-confirmation.service'
import { AppService } from 'src/app/service/app.service'
import { MockAppService } from 'src/mocks/mock-app.service'
import { FormsModule } from '@angular/forms'
import { By } from '@angular/platform-browser'

describe('RegistrationComponent', () => {
    let component: RegistrationComponent
    let fixture: ComponentFixture<RegistrationComponent>
    let activatedRoute: ActivatedRoute
    let httpMock: HttpTestingController
    let msalService: MsalService
    let settingService: SettingsService
    let msgService: MsgService
    let mixpanelService: MixpanelService
    let confirmationService: ConfirmationService
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                BrowserDynamicTestingModule,
                PrimengModule,
                FormsModule,
                StoreModule.forRoot({ settingsReducer: settingsReducer }),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                RegistrationComponent,
            ],
            providers: [
                provideMockStore(),
                { provide: MsalService, useClass: MockMsalService },
                { provide: SettingsService, useClass: MockSettingsService },
                { provide: MsgService, useClass: MockMsgService },
                { provide: MixpanelService, useClass: MockMixPanelService },
                { provide: ConfirmationService, useClass: MockConfirmationService },
                { provide: AppService, useClass: MockAppService },
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
        fixture = TestBed.createComponent(RegistrationComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Self Registration Links' heading", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        const headingEl = fixture.debugElement.nativeElement.querySelector('[data-testId="registration-heading"]')
        expect(headingEl).toBeTruthy()
    })

    it("should render 'Legal Text' heading", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        const headingEl = fixture.debugElement.nativeElement.querySelector('[data-testId="legal-text-heading"]')
        expect(headingEl).toBeTruthy()
    })

    it("should render 'Add' button and call 'addRegistrationLink' method", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-Add-New-Self-Registration-Link'] = true
        fixture.detectChanges()

        let addButton = fixture.debugElement.nativeElement.querySelector('[data-testId="add-btn"]')
        expect(addButton).toBeTruthy()
        expect(addButton.textContent).toContain('Add')

        addButton = fixture.debugElement.query(By.css('[data-testId="add-btn"]'))
        expect(addButton).toBeTruthy()
        spyOn(component, 'addRegistrationLink')
        addButton.triggerEventHandler('onClick', null)

        expect(component.addRegistrationLink).toHaveBeenCalled()
    })

    it("should render 'Manage Tags' button and call 'showModalDialog' method", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-ManageTags'] = true
        fixture.detectChanges()

        let button = fixture.debugElement.nativeElement.querySelector('[data-testId="manage-tag-btn"]')
        expect(button).toBeTruthy()
        expect(button.textContent).toContain('Manage Tags')

        button = fixture.debugElement.query(By.css('[data-testId="manage-tag-btn"]'))
        expect(button).toBeTruthy()
        spyOn(component, 'showModalDialog')
        button.triggerEventHandler('click', null)

        expect(component.showModalDialog).toHaveBeenCalled()
    })

    it("should render 'Account' field in registration form", () => {
        component.selfRegistrationForm = { tags: [] }
        fixture.detectChanges()

        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="account-field"]')
        expect(label.textContent).toContain('Account')
    })

    it("should render 'Default link for account' label and checkbox under 'Account' field in registration form", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="account-link-label"]')
        const checkbox = fixture.debugElement.nativeElement.querySelector('[data-testId="account-link-checkbox"]')

        expect(label.textContent).toContain('Default link for account')
        expect(checkbox).toBeTruthy()
    })

    it("should render 'Tags' field in registration form", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="tags-heading"]')
        expect(label.textContent).toContain('Tags')
    })

    it("should render tags checkboxes under 'Tags' field in registration form", () => {
        component.selfRegistrationForm = {
            tags: [
                { tagId: '', value: null, name: '' },
                { tagId: '', value: null, name: '' },
                { tagId: '', value: null, name: '' },
            ],
        }
        fixture.detectChanges()

        const checkbox = fixture.debugElement.nativeElement.querySelector('[data-testId="tag-checkboxes"]')
        expect(checkbox).toBeTruthy()
    })

    it("should render 'namedUserLabel' dropdown along with its label in registration form", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="named-user-label"]')
        const dropdown = fixture.debugElement.nativeElement.querySelector('[data-testId="named-user-dropdown"]')

        expect(label).toBeTruthy()
        expect(dropdown).toBeTruthy()
    })

    it("should render 'Discovery Settings' label in registration form", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="discovery-settings"]')
        expect(label).toBeTruthy()
    })

    it("should render radio buttons under 'Discovery Settings' in registration form", () => {
        component.selfRegistrationForm = {}
        component.discoverySettings = [{}, {}, {}]
        fixture.detectChanges()

        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="discovery-settings-radio-btn"]')
        expect(label).toBeTruthy()
    })

    it("should render list under 'Discovery Settings' in registration form", () => {
        component.selfRegistrationForm = {}
        component.discoverySettings = [{}, {}, {}]
        fixture.detectChanges()

        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="discovery-settings-list"]')
        expect(label).toBeTruthy()
    })

    it("should render 'Save' button and call 'saveForm' method", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        let saveButton = fixture.debugElement.nativeElement.querySelector('[data-testId="save-btn"]')
        expect(saveButton).toBeTruthy()
        expect(saveButton.textContent).toContain('Save')

        saveButton = fixture.debugElement.query(By.css('[data-testId="save-btn"]'))
        spyOn(component, 'saveForm')
        saveButton.triggerEventHandler('onClick', null)

        expect(component.saveForm).toHaveBeenCalled()
    })

    it("should render 'Cancel' button and call 'resetRegistrationForm' method", () => {
        component.selfRegistrationForm = {}
        fixture.detectChanges()

        let saveButton = fixture.debugElement.nativeElement.querySelector('[data-testId="cancel-btn"]')
        expect(saveButton).toBeTruthy()
        expect(saveButton.textContent).toContain('Cancel')

        saveButton = fixture.debugElement.query(By.css('[data-testId="cancel-btn"]'))
        spyOn(component, 'resetRegistrationForm')
        saveButton.triggerEventHandler('click', null)

        expect(component.resetRegistrationForm).toHaveBeenCalled()
    })
})
