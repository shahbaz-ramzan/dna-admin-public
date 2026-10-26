import { ComponentFixture, TestBed } from '@angular/core/testing'

import { WorkplaceInsightsComponent } from './workplace-insights.component'
import { StoreModule } from '@ngrx/store'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'

describe('WorkplaceInsightsComponent', () => {
    let component: WorkplaceInsightsComponent
    let fixture: ComponentFixture<WorkplaceInsightsComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({ dashboardReducer: dashboardReducer }), WorkplaceInsightsComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkplaceInsightsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Workplace Insights')
    })

    it('should render single line chart', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="single-line-chart"]')
        expect(el).toBeTruthy()
    })
})
