import { ComponentFixture, TestBed } from '@angular/core/testing'

import { VerticalBarComponent } from './vertical-bar.component'
import { NgChartsModule } from 'ng2-charts'

describe('VerticalBarComponent', () => {
    let component: VerticalBarComponent
    let fixture: ComponentFixture<VerticalBarComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgChartsModule, VerticalBarComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(VerticalBarComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render the chart canvas', () => {
        const compiled = fixture.debugElement.nativeElement
        expect(compiled.querySelector(`[data-chartId="vertical-bar-chart"]`)).toBeTruthy()
    })
})
