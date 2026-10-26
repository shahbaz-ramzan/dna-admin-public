import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RiskBehaviorComponent } from './risk-behavior.component'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'

describe('RiskBehaviorComponent', () => {
    let component: RiskBehaviorComponent
    let fixture: ComponentFixture<RiskBehaviorComponent>
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PrimengModule, StoreModule.forRoot({ dashboardReducer }), RiskBehaviorComponent],
            providers: [provideMockStore()],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(RiskBehaviorComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render "Risk Behavior" title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="riek-behavior-title"]')
        expect(el.textContent).toContain('Risk Behavior')
    })

    it('should render guage chart', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="guage-chart"]')
        expect(el).toBeTruthy()
    })
})
