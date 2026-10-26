import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'

import { FinancialReportsComponent } from './financial-reports.component'

describe('FinancialReportsComponent', () => {
    let component: FinancialReportsComponent
    let fixture: ComponentFixture<FinancialReportsComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes([]), FinancialReportsComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(FinancialReportsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Reports')
    })

    it('should render financial reports', () => {
        component.financialReports = [{ isExternalLink: true, isFirst: true, link: 'link', title: 'title' }]
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="reports"]')
        expect(el).toBeTruthy()
    })
})
