import { ComponentFixture, TestBed } from '@angular/core/testing'

import { LegacyReportsComponent } from './legacy-reports.component'

describe('LegacyReportsComponent', () => {
    let component: LegacyReportsComponent
    let fixture: ComponentFixture<LegacyReportsComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LegacyReportsComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(LegacyReportsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render "Legacy Reports" title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Legacy Reports')
    })

    it('should render content', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="content"]')
        expect(el).toBeTruthy()
    })
})
