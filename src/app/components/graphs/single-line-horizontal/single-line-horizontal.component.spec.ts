import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NgChartsModule } from 'ng2-charts'
import { SingleLineHorizontalComponent } from './single-line-horizontal.component'

describe('SingleLineHorizontalComponent', () => {
    let component: SingleLineHorizontalComponent
    let fixture: ComponentFixture<SingleLineHorizontalComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgChartsModule, SingleLineHorizontalComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleLineHorizontalComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render the chart canvas', () => {
        component.temp = true
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        expect(compiled.querySelector(`[data-chartId="single-line-horizontal-chart"]`)).toBeTruthy()
    })
})
