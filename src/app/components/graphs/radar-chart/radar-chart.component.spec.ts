import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RadarChartComponent } from './radar-chart.component'
import { NgChartsModule } from 'ng2-charts'

describe('RadarChartComponent', () => {
    let component: RadarChartComponent
    let fixture: ComponentFixture<RadarChartComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgChartsModule, RadarChartComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(RadarChartComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render the radar chart canvas', () => {
        component.showRadarChart = true
        component.loading = false
        component.content = []
        fixture.detectChanges()
        const compiled = fixture.debugElement.nativeElement
        expect(compiled.querySelector(`[data-chartId="radar-chart"]`)).toBeTruthy()
    })
})
