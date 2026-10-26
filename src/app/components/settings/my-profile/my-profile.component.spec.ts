import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'

import { MyProfileComponent } from './my-profile.component'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from '../settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { RouterTestingModule } from '@angular/router/testing'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../mocks/mock-settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing'

describe('MyProfileComponent', () => {
    let component: MyProfileComponent
    let fixture: ComponentFixture<MyProfileComponent>
    let activatedRoute: ActivatedRoute
    let httpMock: HttpTestingController
    let msalService: MsalService
    let settingService: SettingsService
    let msgService: MsgService
    let mixpanelService: MixpanelService
    let store: MockStore
    let initialState = {}
    let formBuilder: FormBuilder
    let formGroup: FormGroup

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
                MyProfileComponent,
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
        fixture = TestBed.createComponent(MyProfileComponent)
        component = fixture.componentInstance
        formBuilder = TestBed.inject(FormBuilder)
        formGroup = new UntypedFormGroup({
            firstName: new UntypedFormControl(null, [Validators.required]),
            lastName: new UntypedFormControl(null, [Validators.required]),
            email: new UntypedFormControl(null, [Validators.required, Validators.email]),
        })
        component.myProfileForm = formGroup
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Profile' as heading", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-Profile'] = true
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="heading"]')
        expect(el.textContent).toContain('Profile')
    })

    it("should render 'Save' button and call 'saveUser' function on click", fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Settings-Profile'] = true
        component.myProfileForm.setValue({
            firstName: 'TestFirstName',
            lastName: 'TestLastName',
            email: 'test@example.com',
        })
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="save-btn"]')
        expect(el).toBeTruthy()
        el.removeAttribute('disabled')
        spyOn(component, 'saveUser')
        el.click()
        tick()
        expect(component.saveUser).toHaveBeenCalled()
    }))

    it("should render 'First Name' label along with its field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-Profile'] = true
        fixture.detectChanges()

        const labelEl = fixture.debugElement.nativeElement.querySelector('[data-testId="firstname-label"]')
        const inputEl = fixture.debugElement.nativeElement.querySelector('[data-testId="firstname-input"]')

        expect(labelEl.textContent).toEqual('First Name')
        expect(inputEl).toBeTruthy()
    })

    it("should render 'Last Name' label along with its field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-Profile'] = true
        fixture.detectChanges()

        const labelEl = fixture.debugElement.nativeElement.querySelector('[data-testId="lastname-label"]')
        const inputEl = fixture.debugElement.nativeElement.querySelector('[data-testId="lastname-input"]')

        expect(labelEl.textContent).toEqual('Last Name')
        expect(inputEl).toBeTruthy()
    })

    it("should render 'Email Address' label along with its field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-Profile'] = true
        fixture.detectChanges()

        const labelEl = fixture.debugElement.nativeElement.querySelector('[data-testId="email-address-label"]')
        const inputEl = fixture.debugElement.nativeElement.querySelector('[data-testId="email-address-input"]')

        expect(labelEl.textContent).toEqual('Email Address')
        expect(inputEl).toBeTruthy()
    })
})
