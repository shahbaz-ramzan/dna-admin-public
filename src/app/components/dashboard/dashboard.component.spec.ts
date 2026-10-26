import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CommonModule } from '@angular/common'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { MsalService } from '@azure/msal-angular'
import { StoreModule } from '@ngrx/store'
import { EffectsModule } from '@ngrx/effects'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { NgChartsModule } from 'ng2-charts'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockSettingsService } from '../settings/mocks/mock-settings.service'
import { SettingsService } from '../settings/settings.service'
import { DashboardComponent } from './dashboard.component'
import { SharedChartsModule } from 'src/app/shared/charts/shared-charts.module'
import { RecentActivitiesComponent } from './recent-activities/recent-activities.component'
import { RecentCompletionsComponent } from './recent-completions/recent-completions.component'
import { dashboardReducer } from './dashboard.reducer'
import { initialTourState } from '../tour/tour.reducer'

describe('DashboardComponent', () => {
    let component: DashboardComponent
    let fixture: ComponentFixture<DashboardComponent>
    let store: MockStore
    let initialState = { tourReducer: initialTourState }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                PrimengModule,
                StoreModule.forRoot({ settingsReducer: dashboardReducer }),
                EffectsModule.forRoot([]),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                CommonModule,
                NgChartsModule,
                SharedChartsModule,
                DashboardComponent,
                RecentActivitiesComponent,
                RecentCompletionsComponent,
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
        fixture = TestBed.createComponent(DashboardComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render username', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="username"]')
        expect(el).toBeTruthy()
    })

    it("should render 'Your Teams & Clients' heading along with its corresponding bar chart", () => {
        component.permissionObject = {}
        component.permissionObject['Dashboard-Your-Team-And-Clients'] = true
        component.uniqueStyleGraphLaoding = false
        fixture.detectChanges()

        const heading = fixture.debugElement.nativeElement.querySelector('[data-testId="teams-client-graph"]')
        expect(heading.textContent).toContain('Your Team & Clients')

        const chartEl = fixture.debugElement.nativeElement.querySelector('[data-testId="single-line-chart"]')
        expect(chartEl).toBeTruthy()
    })

    it("should render 'Market Mood' heading along with its corresponding pie chart and smilies", () => {
        component.permissionObject = {}
        component.permissionObject['Dashboard-marketmood'] = true
        component.marketMoodLaoding = false
        fixture.detectChanges()

        const heading = fixture.debugElement.nativeElement.querySelector('[data-testId="market-mood-label"]')
        expect(heading.textContent).toContain('Market Mood')

        const chartEl = fixture.debugElement.nativeElement.querySelector('[data-testId="market-mood-graph"]')
        expect(chartEl).toBeTruthy()

        const smiliesEl = fixture.debugElement.nativeElement.querySelector('[data-testId="market-mood-smilies"]')
        expect(smiliesEl).toBeTruthy()
    })

    it('should render recent activities section', () => {
        component.permissionObject = {}
        component.permissionObject['Dashboard-recent-activity'] = true
        fixture.detectChanges()

        const chartEl = fixture.debugElement.nativeElement.querySelector('[data-testId="recent-activities"]')
        expect(chartEl).toBeTruthy()
    })

    it('should render recent completions section', () => {
        component.permissionObject = {}
        component.permissionObject['Dashboard-30daycompletion'] = true
        fixture.detectChanges()

        const chartEl = fixture.debugElement.nativeElement.querySelector('[data-testId="recent-completions"]')
        expect(chartEl).toBeTruthy()
    })
})
