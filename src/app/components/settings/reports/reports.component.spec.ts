import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ReportsComponent } from './reports.component'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { StoreModule } from '@ngrx/store'
import { MsalService } from '@azure/msal-angular'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../mocks/mock-settings.service'
import { SettingsService } from '../settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { By } from '@angular/platform-browser'

describe('ReportsComponent', () => {
    let component: ReportsComponent
    let fixture: ComponentFixture<ReportsComponent>
    let msgService: MsgService
    let mixpanelService: MixpanelService
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, ReactiveFormsModule, PrimengModule, StoreModule.forRoot({ settingsReducer: settingsReducer }), ReportsComponent],
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
        fixture = TestBed.createComponent(ReportsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    beforeEach(() => {
        component.permissionObject = {}
        component.permissionObject['Settings-Reports'] = true
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Customize Reports' heading", () => {
        const headingEl = fixture.debugElement.nativeElement.querySelector('[data-testId="reports-heading"]')
        expect(headingEl.textContent).toContain('Customize Reports')
    })

    it("should render 'Customize Discovery' heading", () => {
        const headingEl = fixture.debugElement.nativeElement.querySelector('[data-testId="Discovery-heading"]')
        expect(headingEl.textContent).toContain('Customize Discovery')
    })

    it('should render "Financial Behavior" tab', () => {
        const btnEl = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-tab"]')
        expect(btnEl).toBeTruthy()
        expect(btnEl.getAttribute('header')).toContain('Financial Behavior')
    })

    it('should render "Work Talent" tab', () => {
        const btnEl = fixture.debugElement.nativeElement.querySelector('[data-testId="talent-tab"]')
        expect(btnEl).toBeTruthy()
        expect(btnEl.getAttribute('header')).toContain('Work Talent')
    })

    it('should call "onChangeTab" method on tab click', () => {
        const btnEl = fixture.debugElement.query(By.css('[data-testId="tab-view"]'))
        expect(btnEl).toBeTruthy()

        spyOn(component, 'onChangeTab')
        btnEl.triggerEventHandler('onChange', null)
        expect(component.onChangeTab).toHaveBeenCalled()
    })

    it("should render 'Title' label along with its input field", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="title-label"]')
        expect(label.textContent).toContain('Title')

        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="title-input"]')
        expect(input).toBeTruthy()
    })

    it("should render 'Video Url' label along with its input field", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="url-label"]')
        expect(label.textContent).toContain('Video Url')

        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="url-input"]')
        expect(input).toBeTruthy()
    })

    it("should render 'Message' label along with its input field", () => {
        const label = fixture.debugElement.nativeElement.querySelector('[data-testId="message-label"]')
        expect(label.textContent).toContain('Message')

        const input = fixture.debugElement.nativeElement.querySelector('[data-testId="message-input"]')
        expect(input).toBeTruthy()
    })

    it('should render "Submit" button and call "onSubmit" method on click', () => {
        const btnEl = fixture.debugElement.nativeElement.querySelector('[data-testId="save-btn"]')
        expect(btnEl).toBeTruthy()
        expect(btnEl.textContent).toContain('Submit')

        const formEl = fixture.debugElement.query(By.css('[data-testId="form"]'))
        spyOn(component, 'onSubmit')
        formEl.triggerEventHandler('ngSubmit', null)
        expect(component.onSubmit).toHaveBeenCalled()
    })
})
