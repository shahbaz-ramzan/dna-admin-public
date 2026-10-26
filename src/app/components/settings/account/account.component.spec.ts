import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { StoreModule } from '@ngrx/store'
import { AccountComponent } from './account.component'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { RouterTestingModule } from '@angular/router/testing'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import {
    getCompletionEmailSettingsAction,
    getDefaultToggleAction,
    getLanguageAction,
    getParticipantLabels,
    getUserLabels,
    getUsersAction,
} from '../settingsStore/settings.actions'
import { Observable } from 'rxjs'
import { cold } from 'jasmine-marbles'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { SettingsService } from '../settings.service'
import { MockSettingsService } from '../mocks/mock-settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { FormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { SharedModule } from 'src/app/shared/shared.module'

describe('AccountComponent', () => {
    let component: AccountComponent
    let fixture: ComponentFixture<AccountComponent>
    let activatedRoute: ActivatedRoute
    let httpMock: HttpTestingController
    let msalService: MsalService
    let settingService: SettingsService
    let msgService: MsgService
    let mixpanelService: MixpanelService
    // const router: Router

    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                PrimengModule,
                SharedModule,
                StoreModule.forRoot({ settingsReducer: settingsReducer }),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                AccountComponent,
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
        fixture = TestBed.createComponent(AccountComponent)
        component = fixture.componentInstance
        activatedRoute = TestBed.inject(ActivatedRoute)
        httpMock = TestBed.inject(HttpTestingController)
        msalService = TestBed.inject(MsalService)
        settingService = TestBed.inject(SettingsService)
        msgService = TestBed.inject(MsgService)
        mixpanelService = TestBed.inject(MixpanelService)

        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should dispatch getLanguageAction action', () => {
        const action = getLanguageAction()
        store.dispatch(action)
        expect(store.dispatch).toHaveBeenCalledWith(action)
    })

    it('should dispatch getParticipantLabels action', () => {
        const action = getParticipantLabels()
        store.dispatch(action)
        expect(store.dispatch).toHaveBeenCalledWith(action)
    })

    it('should dispatch getUserLabels action', () => {
        const action = getUserLabels()
        store.dispatch(action)
        expect(store.dispatch).toHaveBeenCalledWith(action)
    })

    it('should dispatch getUsersAction action', () => {
        component.accountId = 1
        fixture.detectChanges()
        const action = getUsersAction(component.accountId, true)
        store.dispatch(action)
        expect(store.dispatch).toHaveBeenCalledWith(action)
    })

    it('should dispatch getCompletionEmailSettingsAction action', () => {
        component.accountId = 1
        fixture.detectChanges()
        const action = getCompletionEmailSettingsAction(component.accountId)
        store.dispatch(action)
        expect(store.dispatch).toHaveBeenCalledWith(action)
    })

    it('should dispatch getDefaultToggleAction action', () => {
        component.accountId = 1
        component.personId = '1'
        fixture.detectChanges()
        const action = getDefaultToggleAction(component.personId, component.accountId)
        store.dispatch(action)
        expect(store.dispatch).toHaveBeenCalledWith(action)
    })

    it("should call saveForm method on 'Save' button click", fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Settings-YourAccount'] = true
        component.permissionObject['Settings-SystemLabels'] = true
        fixture.detectChanges()

        spyOn(component, 'saveForm')
        const compiled = fixture.debugElement.nativeElement
        const btnElement = compiled.querySelector('[data-testId="submit-button"]')
        btnElement.removeAttribute('disabled')
        fixture.detectChanges()
        btnElement.click()
        tick()
        expect(component.saveForm).toHaveBeenCalled()
    }))

    it("should create 'Default Toggle' dropdown", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-SystemLabels'] = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const element = compiled.querySelector('[data-testId="dropdown-default-toggle"]')

        expect(element).toBeTruthy()
    })

    it("should create 'Who you are getting to know?' dropdown", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-SystemLabels'] = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const element = compiled.querySelector('[data-testId="dropdown-label"]')

        expect(element).toBeTruthy()
    })

    it("should create 'Who reviews the results?' dropdown", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-SystemLabels'] = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const element = compiled.querySelector('[data-testId="dropdown-review"]')

        expect(element).toBeTruthy()
    })

    it("should give 'true' boolean value to 'Settings-SystemLabels' property in permissionObject to render dropdowns properly", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-SystemLabels'] = true
        fixture.detectChanges()

        expect(component.permissionObject['Settings-SystemLabels']).toBeTruthy()
    })

    it('should show spinner during initial page loading', () => {
        component.isLoading = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const element = compiled.querySelector('[data-testId="spinner"]')

        expect(element).toBeTruthy()
    })

    it("should render label 'Name' along with its corresponding input field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-YourAccount'] = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const labelElement = compiled.querySelector('[data-testId="label-name"]')
        const inputElement = compiled.querySelector('[data-testId="input-name"]')

        expect(labelElement).toBeTruthy()
        expect(inputElement).toBeTruthy()
    })

    it("should render label 'ID' along with its corresponding input field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-YourAccount'] = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const labelElement = compiled.querySelector('[data-testId="label-id"]')
        const inputElement = compiled.querySelector('[data-testId="input-id"]')

        expect(labelElement).toBeTruthy()
        expect(inputElement).toBeTruthy()
    })

    it("should render label 'Default Language' along with its corresponding dropdown field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-YourAccount'] = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const labelElement = compiled.querySelector('[data-testId="label-default-language"]')
        const inputElement = compiled.querySelector('[data-testId="dropdown-default-language"]')

        expect(labelElement).toBeTruthy()
        expect(inputElement).toBeTruthy()
    })

    it("should render label 'Default Account' along with its corresponding checkbox field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-YourAccount'] = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const labelElement = compiled.querySelector('[data-testId="label-default-account"]')
        const inputElement = compiled.querySelector('[data-testId="checkbox-default-account"]')

        expect(labelElement).toBeTruthy()
        expect(inputElement).toBeTruthy()
    })

    it("should render 'Logo' upload field", () => {
        component.permissionObject = {}
        component.permissionObject['Settings-Co-Branding'] = true
        component.selectedLogo = null
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        const inputElement = compiled.querySelector('[data-testId="logo-input"]')

        expect(inputElement).toBeTruthy()
    })

    it("should call 'deleteLogo' function on logo delete button click", fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Settings-Co-Branding'] = true
        fixture.detectChanges()

        spyOn(component, 'deleteLogo')
        const compiled = fixture.debugElement.nativeElement
        const btnElement = compiled.querySelector('[data-testId="logo-delete-btn"]')

        btnElement.click()
        tick()
        expect(component.deleteLogo).toHaveBeenCalled()
    }))
})
