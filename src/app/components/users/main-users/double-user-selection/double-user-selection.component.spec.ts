import { ComponentFixture, TestBed } from '@angular/core/testing'

import { DoubleUserSelectionComponent } from './double-user-selection.component'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from 'src/app/components/settings/settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { ConfirmationService } from 'primeng/api'
import { MainUsersService } from '../../main-users.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { SortablejsModule } from '@maksim_m/ngx-sortablejs'
import { CommonModule } from '@angular/common'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'
import { mainUserReducer } from '../mainUserStore/main-users.reducer'
import { RouterTestingModule } from '@angular/router/testing'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from 'src/app/components/settings/mocks/mock-settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MockConfirmationService } from 'src/mocks/mock-confirmation.service'
import { MockMainUsersService } from 'src/mocks/mock-main-users.service'
import { By } from '@angular/platform-browser'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'

describe('DoubleUserSelectionComponent', () => {
    let component: DoubleUserSelectionComponent
    let fixture: ComponentFixture<DoubleUserSelectionComponent>
    let activatedRoute: ActivatedRoute
    let httpMock: HttpTestingController
    let msalService: MsalService
    let settingService: SettingsService
    let msgService: MsgService
    let mixpanelService: MixpanelService
    let confirmationService: ConfirmationService
    let mainUsersService: MainUsersService
    let store: MockStore
    let initialState = {}

    beforeEach(() => {
        localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify({ personId: 'test-person-id' })))
        localStorage.setItem('tScoreColor', Encryption.encryptData('#ffffff'))
    })

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                SortablejsModule,
                CommonModule,
                PrimengModule,
                StoreModule.forRoot({ dashboardReducer: dashboardReducer, mainUserReducer: mainUserReducer }),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                DoubleUserSelectionComponent,
            ],
            providers: [
                provideMockStore(),
                { provide: MsalService, useClass: MockMsalService },
                { provide: SettingsService, useClass: MockSettingsService },
                { provide: MsgService, useClass: MockMsgService },
                { provide: MixpanelService, useClass: MockMixPanelService },
                { provide: ConfirmationService, useClass: MockConfirmationService },
                { provide: MainUsersService, useClass: MockMainUsersService },
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
        fixture = TestBed.createComponent(DoubleUserSelectionComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render tabs and call "handleChange" on tab change', () => {
        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="tabview"]')
        expect(el).toBeTruthy()

        spyOn(component, 'handleChange')
        el = fixture.debugElement.query(By.css('[data-testId="tabview"]'))
        el.triggerEventHandler('onChange', null)

        expect(component.handleChange).toHaveBeenCalled()
    })

    it('should render user-info-bar component', () => {
        const el_1 = fixture.debugElement.nativeElement.querySelector('[data-testId="user-info-bar"]')
        expect(el_1).toBeTruthy()

        const el_2 = fixture.debugElement.nativeElement.querySelector('[data-testId="user-info-bar-2"]')
        expect(el_2).toBeTruthy()

        const el_3 = fixture.debugElement.nativeElement.querySelector('[data-testId="user-info-bar-2"]')
        expect(el_3).toBeTruthy()
    })

    it('should render risk-behavior component', () => {
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-RiskBehavior'] = true
        fixture.detectChanges()

        let el1 = fixture.debugElement.nativeElement.querySelector('[data-testId="risk-behavior"]')
        expect(el1).toBeTruthy()

        let el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="risk-behavior-2"]')
        expect(el2).toBeTruthy()
    })

    it('should render financial-dna-score component', () => {
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-FinancialDNA5scores'] = true
        fixture.detectChanges()

        let el1 = fixture.debugElement.nativeElement.querySelector('[data-testId="dna-score"]')
        expect(el1).toBeTruthy()

        let el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="dna-score-2"]')
        expect(el2).toBeTruthy()
    })

    it('should render financial-behavior component', () => {
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-MarketMood'] = true
        fixture.detectChanges()

        let el1 = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-behavior"]')
        expect(el1).toBeTruthy()

        let el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-behavior-2"]')
        expect(el2).toBeTruthy()
    })

    it("should render 'app-style-match' component in Work Talent tab", () => {
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-StyleMatch'] = true
        component.permissionObject['Business-User-Card-StyleMatch'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-style-match"]')
        expect(el).toBeTruthy()

        const el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="app-style-match-2"]')
        expect(el2).toBeTruthy()
    })

    it('should render financial-biases component', () => {
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-BehavioralBiases'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-biases"]')
        expect(el).toBeTruthy()
    })

    it('should render t-scores component', () => {
        component.index = 0
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-T-Scores'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="t-scores"]')
        expect(el).toBeTruthy()

        component.index = 1
        fixture.detectChanges()
        let el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="t-scores-2"]')
        expect(el2).toBeTruthy()
    })

    it('should render environment-keys component for communication keys, struggles and strengths', () => {
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-EnvironmentKeys'] = true
        component.permissionObject['Business-User-Card-EnvironmentKeys'] = true
        fixture.detectChanges()

        let elComm_1 = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-communication-keys-person-1"]')
        expect(elComm_1).toBeTruthy()

        let elComm_2 = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-communication-keys-person-2"]')
        expect(elComm_2).toBeTruthy()

        let elStruggles_1 = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-struggles-person-1"]')
        expect(elStruggles_1).toBeTruthy()

        let elStruggles_2 = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-struggles-person-2"]')
        expect(elStruggles_2).toBeTruthy()

        let elStrengths_1 = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-strengths-person-1"]')
        expect(elStrengths_1).toBeTruthy()

        let elStrengths_2 = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-strengths-person-2"]')
        expect(elStrengths_2).toBeTruthy()

        let elWorkTalentTab_p1 = fixture.debugElement.nativeElement.querySelector('[data-testId="env-keys-work-talent-tab-p1"]')
        expect(elWorkTalentTab_p1).toBeTruthy()

        let elWorkTalentTab_p2 = fixture.debugElement.nativeElement.querySelector('[data-testId="env-keys-work-talent-tab-p2"]')
        expect(elWorkTalentTab_p2).toBeTruthy()

        let elWorkTalentTabStruggles_p1 = fixture.debugElement.nativeElement.querySelector('[data-testId="env-keys-work-talent-tab-struggles-p1"]')
        expect(elWorkTalentTabStruggles_p1).toBeTruthy()

        let elWorkTalentTabStruggles_p2 = fixture.debugElement.nativeElement.querySelector('[data-testId="env-keys-work-talent-tab-struggles-p2"]')
        expect(elWorkTalentTabStruggles_p2).toBeTruthy()

        let elWorkTalentTabStrengths_p1 = fixture.debugElement.nativeElement.querySelector('[data-testId="env-keys-work-talent-tab-strengths-p1"]')
        expect(elWorkTalentTabStrengths_p1).toBeTruthy()

        let elWorkTalentTabStrengths_p2 = fixture.debugElement.nativeElement.querySelector('[data-testId="env-keys-work-talent-tab-strengths-p2"]')
        expect(elWorkTalentTabStrengths_p2).toBeTruthy()
    })

    it('should render communication component', () => {
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-Communication'] = true
        fixture.detectChanges()

        let el_1 = fixture.debugElement.nativeElement.querySelector('[data-testId="communication-person-1"]')
        expect(el_1).toBeTruthy()

        let el_2 = fixture.debugElement.nativeElement.querySelector('[data-testId="communication-person-2"]')
        expect(el_2).toBeTruthy()

        let elWorkTalentTab_p1 = fixture.debugElement.nativeElement.querySelector('[data-testId="work-talent-tab-comm-p1"]')
        expect(elWorkTalentTab_p1).toBeTruthy()

        let elWorkTalentTab_p2 = fixture.debugElement.nativeElement.querySelector('[data-testId="work-talent-tab-comm-p2"]')
        expect(elWorkTalentTab_p2).toBeTruthy()
    })

    it('should render legacy-reports component', () => {
        component.showLegacyReports1 = true
        component.showLegacyReports2 = true
        fixture.detectChanges()

        let el1 = fixture.debugElement.nativeElement.querySelector('[data-testId="legacy-reports-person-1"]')
        expect(el1).toBeTruthy()

        let el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="legacy-reports-person-2"]')
        expect(el2).toBeTruthy()

        let elWorkTalentTab_p1 = fixture.debugElement.nativeElement.querySelector('[data-testId="work-talent-tab-legacy-reports-p1"]')
        expect(elWorkTalentTab_p1).toBeTruthy()

        let elWorkTalentTab_p2 = fixture.debugElement.nativeElement.querySelector('[data-testId="work-talent-tab-legacy-reports-p2"]')
        expect(elWorkTalentTab_p2).toBeTruthy()
    })

    it('should render financial-reports component', () => {
        component.completionDate1 = true
        component.completionDate2 = true
        component.permissionObject = {}
        component.permissionObject['Feature-User-Card-Reports'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-reports"]')
        expect(el).toBeTruthy()

        let elWorkTalentTab = fixture.debugElement.nativeElement.querySelector('[data-testId="work-talent-tab-financial-reports"]')
        expect(elWorkTalentTab).toBeTruthy()
    })

    it('should render radar-chart component', () => {
        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="radar-chart"]')
        expect(el).toBeTruthy()
    })

    it('should render radar chart labels in user comparison screen in following order (clockwise): Influencer, Engager, Community Builder, Relationship Builder, Facilitator, Adapter, Stylish Thinker, Reflective Thinker, Strategist, Initiator.', () => {
        const labels = [
            'Influencer',
            'Engager',
            'Community Builder',
            'Relationship Builder',
            'Facilitator',
            'Adapter',
            'Stylish Thinker',
            'Reflective Thinker',
            'Strategist',
            'Initiator',
        ]
        let isMatch = true
        for (let i = 0; i < labels.length; i++) {
            if (labels[i] !== component.uniqueStyle[i]) {
                isMatch = false
            }
        }
        expect(isMatch).toEqual(true)
    })

    it('should render work talent tab panel component', () => {
        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="tab-panel-work-talents"]')
        expect(el).toBeTruthy()
    })

    it('should render app-work-talent component', () => {
        component.workTalentLoading_1 = false
        component.workTalentLoading_2 = false
        component.permissionObject = {}
        component.permissionObject['Business-User-Card-BusinessDNA5Scores'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-work-talent"]')
        expect(el).toBeTruthy()

        let el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="app-work-talent-2"]')
        expect(el2).toBeTruthy()
    })

    it('should render app-strongest-factors component', () => {
        component.permissionObject = {}
        component.permissionObject['Business-User-Card-TheStrongestFactors'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-strongest-factors"]')
        expect(el).toBeTruthy()

        let el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="app-strongest-factors-2"]')
        expect(el2).toBeTruthy()
    })

    it("should render 'app-career-insights' component", () => {
        component.permissionObject = {}
        component.permissionObject['Business-User-CareerInsights'] = true
        fixture.detectChanges()

        const el1 = fixture.debugElement.nativeElement.querySelector('[data-testId="app-career-insights-person-1"]')
        expect(el1).toBeTruthy()

        const el2 = fixture.debugElement.nativeElement.querySelector('[data-testId="app-career-insights-person-2"]')
        expect(el2).toBeTruthy()
    })
})
