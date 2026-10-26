import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'

import { SingleUserSelectionComponent } from './single-user-selection.component'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from 'src/app/components/settings/settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { ConfirmationService } from 'primeng/api'
import { MainUsersService } from '../../main-users.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { FormsModule } from '@angular/forms'
import { SortablejsModule } from '@maksim_m/ngx-sortablejs'
import { CommonModule } from '@angular/common'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { RouterTestingModule } from '@angular/router/testing'
import { settingsReducer } from 'src/app/components/settings/settingsStore/settings.reducer'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'
import { mainUserReducer } from '../mainUserStore/main-users.reducer'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from 'src/app/components/settings/mocks/mock-settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MockConfirmationService } from 'src/mocks/mock-confirmation.service'
import { MockMainUsersService } from 'src/mocks/mock-main-users.service'
import { By } from '@angular/platform-browser'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'

describe('SingleUserSelectionComponent', () => {
    let component: SingleUserSelectionComponent
    let fixture: ComponentFixture<SingleUserSelectionComponent>
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
                FormsModule,
                SortablejsModule,
                CommonModule,
                PrimengModule,
                StoreModule.forRoot({ settingsReducer, dashboardReducer, mainUserReducer }),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                SingleUserSelectionComponent,
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
        fixture = TestBed.createComponent(SingleUserSelectionComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render user-info-bar component', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="user-info-bar"]')
        expect(component).toBeTruthy()
    })

    it('should render tabs and call "handleChange" on tab change', () => {
        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="tabview"]')
        expect(component).toBeTruthy()

        spyOn(component, 'handleChange')
        el = fixture.debugElement.query(By.css('[data-testId="tabview"]'))
        el.triggerEventHandler('onChange', null)

        expect(component.handleChange).toHaveBeenCalled()
    })

    it('should render financial Behavior panel', () => {
        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-tab"]')
        expect(el).toBeTruthy()
    })

    it('should render sorter button and call "sortDialog" on tab change', () => {
        component.permissionObject = {}
        component.permissionObject['Feature-User-Sort-SortUserCards'] = true
        component.index = 0
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="sorter-btn"]')
        expect(component).toBeTruthy()

        spyOn(component, 'sortDialog')
        el = fixture.debugElement.query(By.css('[data-testId="sorter-btn"]'))
        el.triggerEventHandler('click', null)

        expect(component.sortDialog).toHaveBeenCalled()
    })

    it('should render financial Behavior section', () => {
        component.id = 'single0'
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-sec"]')
        expect(el).toBeTruthy()
    })

    it('should render risk-behavior component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Risk Behavior' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-RiskBehavior'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="risk-behavior"]')
        expect(el).toBeTruthy()
    })

    it('should render financial-dna-score component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Financial DNA Score' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-FinancialDNA5scores'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="dna-score"]')
        expect(el).toBeTruthy()
    })

    it('should render style-match component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Style Match' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-StyleMatch'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="style-match"]')
        expect(el).toBeTruthy()
    })

    it('should render financial-behavior component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Market Mood' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-MarketMood'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-behavior"]')
        expect(el).toBeTruthy()
    })

    it('should render financial-biases component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Behavioral Biases' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-BehavioralBiases'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="financial-biases"]')
        expect(el).toBeTruthy()
    })

    it('should render t-scores component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'T-Scores' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-T-Scores'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="t-scores"]')
        expect(el).toBeTruthy()
    })

    it('should render environment-keys component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Communication Keys' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-EnvironmentKeys'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys"]')
        expect(el).toBeTruthy()
    })

    it('should render communication component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Preferred Contact Methods' }]
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-Communication'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="communication"]')
        expect(el).toBeTruthy()
    })

    it('should render Struggles environment keys component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Struggles' }]
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-struggles"]')
        expect(el).toBeTruthy()
    })

    it('should render Strengths environment keys component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Strengths' }]
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="environment-keys-strengths"]')
        expect(el).toBeTruthy()
    })

    it('should render legacy-reports component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        component.financialBehaviorTabSorter = [{ cardName: 'Legacy Reports' }]
        component.showLegacyReports = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="legacy-reports"]')
        expect(el).toBeTruthy()
    })

    it('should render radar-chart component', () => {
        component.id = 'single0'
        component.displaySortingModal = false
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="radar-chart"]')
        expect(el).toBeTruthy()
    })

    it('should render radar chart labels in following order (clockwise): Influencer, Engager, Community Builder, Relationship Builder, Facilitator, Adapter, Stylish Thinker, Reflective Thinker, Strategist, Initiator.', () => {
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

    it("should render 'Work Talent' panel", () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="work-talent-panel"]')
        expect(el).toBeTruthy()
    })

    it("should render work talent sort button and call 'sortDialog' method on click", fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Feature-User-Sort-SortUserCards'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="work-talent-sort-btn"]')
        expect(el).toBeTruthy()

        spyOn(component, 'sortDialog')
        el.click()
        tick()
        expect(component.sortDialog).toHaveBeenCalled()
    }))

    it("should render 'app-work-talent' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Work Talents' }]
        component.workTalentLoading = false
        component.permissionObject = {}
        component.permissionObject['Business-User-Card-BusinessDNA5Scores'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-work-talent"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-strongest-factors' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Strongest Traits' }]
        component.workTalentLoading = false
        component.permissionObject = {}
        component.permissionObject['Business-User-Card-TheStrongestFactors'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-strongest-factors"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-style-match' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Style Match' }]
        component.workTalentLoading = false
        component.permissionObject = {}
        component.permissionObject['Business-User-Card-StyleMatch'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-style-match"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-t-scores' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'T-Scores' }]
        component.workTalentLoading = false
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-t-scores"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-workplace-insights' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Workplace Insights' }]
        component.workTalentLoading = false
        component.permissionObject = {}
        component.permissionObject['Business-User-Card-WorkplaceInsights'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-workplace-insights"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-career-insights' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Career Insights' }]
        component.workTalentLoading = false
        component.permissionObject = {}
        component.permissionObject['Business-User-CareerInsights'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-career-insights"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-environment-keys' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Communication Keys' }]
        component.workTalentLoading = false
        component.permissionObject = {}
        component.permissionObject['Business-User-Card-EnvironmentKeys'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-environment-keys"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-communication' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Preferred Contact Methods' }]
        component.workTalentLoading = false
        component.permissionObject = {}
        component.permissionObject['Financial-User-Card-Communication'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-communication"]')
        expect(el).toBeTruthy()
    })

    it("should render 'app-legacy-reports' component in Work Talent tab", () => {
        component.id = 'single1'
        component.displaySortingModal = false
        component.workTalentsTabSorter = [{ cardName: 'Legacy Reports' }]
        component.workTalentLoading = false
        component.showLegacyReports = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="app-legacy-reports"]')
        expect(el).toBeTruthy()
    })
})
