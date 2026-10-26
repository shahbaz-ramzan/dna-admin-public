import { ComponentFixture, TestBed } from '@angular/core/testing'

import { TScoresComponent } from './t-scores.component'
import { DoubleAxesHorizontalBarComponent } from 'src/app/components/graphs/double-axes-horizontal-bar/double-axes-horizontal-bar.component'

describe('TScoresComponent', () => {
    let component: TScoresComponent
    let fixture: ComponentFixture<TScoresComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TScoresComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(TScoresComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    beforeEach(() => {
        component.bgColor = '#ffffff'
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('T-Scores')
    })

    it('should render double axes horizontal bar', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="double-axe-chart"]')
        expect(el).toBeTruthy()
    })
})
