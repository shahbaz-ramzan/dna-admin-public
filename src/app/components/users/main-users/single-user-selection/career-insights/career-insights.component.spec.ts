import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CareerInsightsComponent } from './career-insights.component'

describe('CareerInsightsComponent', () => {
    let component: CareerInsightsComponent
    let fixture: ComponentFixture<CareerInsightsComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CareerInsightsComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(CareerInsightsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Career Insights')
    })

    it('should render content', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="content"]')
        expect(el).toBeTruthy()
    })
})
