import { ComponentFixture, TestBed } from '@angular/core/testing'

import { StrongestFactorsComponent } from './strongest-factors.component'

describe('StrongestFactorsComponent', () => {
    let component: StrongestFactorsComponent
    let fixture: ComponentFixture<StrongestFactorsComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StrongestFactorsComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(StrongestFactorsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Two Strongest Traits')
    })

    it('should render circle progress chart', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="content"]')
        expect(el).toBeTruthy()
    })
})
