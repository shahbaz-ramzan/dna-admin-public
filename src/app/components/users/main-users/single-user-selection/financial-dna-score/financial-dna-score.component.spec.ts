import { ComponentFixture, TestBed } from '@angular/core/testing'

import { FinancialDnaScoreComponent } from './financial-dna-score.component'
import { StoreModule } from '@ngrx/store'
import { NgCircleProgressModule } from 'ng-circle-progress'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'
import { mainUserReducer } from '../../mainUserStore/main-users.reducer'

describe('FinancialDnaScoreComponent', () => {
    let component: FinancialDnaScoreComponent
    let fixture: ComponentFixture<FinancialDnaScoreComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({ dashboardReducer, mainUserReducer }), NgCircleProgressModule.forRoot({}), FinancialDnaScoreComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(FinancialDnaScoreComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="score-title"]')
        expect(el.textContent).toContain('Financial DNA 5-scores')
    })

    it('should render circle progress chart', () => {
        component.financialBehaviours = [{ description: 'description', title: 'title', value: 50 }]
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="circle-progress"]')
        expect(el).toBeTruthy()
    })
})
