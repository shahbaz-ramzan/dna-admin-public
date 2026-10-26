import { ComponentFixture, TestBed } from '@angular/core/testing'

import { UniqueStyleComponent } from './unique-style.component'

describe('UniqueStyleComponent', () => {
    let component: UniqueStyleComponent
    let fixture: ComponentFixture<UniqueStyleComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UniqueStyleComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(UniqueStyleComponent)
        component = fixture.componentInstance
        component.chartLabels = []
        component.chartValues = []
        component.chartColors = []
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Unique Style')
    })

    it('should render pie-chart', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="pie-chart"]')
        expect(el).toBeTruthy()
    })
})
