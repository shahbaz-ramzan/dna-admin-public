import { ComponentFixture, TestBed } from '@angular/core/testing'
import { StoreModule } from '@ngrx/store'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

import { FinancialBehaviorComponent } from './financial-behavior.component'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'

describe('FinancialBehaviorComponent', () => {
    let component: FinancialBehaviorComponent
    let fixture: ComponentFixture<FinancialBehaviorComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PrimengModule, StoreModule.forRoot({ dashboardReducer }), NoopAnimationsModule, FinancialBehaviorComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(FinancialBehaviorComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Market Mood')
    })

    it('should render line chart', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="chart"]')
        expect(el).toBeTruthy()
    })

    it('should render accordion', () => {
        component.marketMoodArray = [{}]
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="accordion"]')
        expect(el).toBeTruthy()
    })
})
