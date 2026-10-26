import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideMockStore, MockStore } from '@ngrx/store/testing'
import { NgChartsModule } from 'ng2-charts'
import { LineChartComponent } from './line-chart.component'

describe('LineChartComponent', () => {
    let component: LineChartComponent
    let fixture: ComponentFixture<LineChartComponent>
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgChartsModule, LineChartComponent],
            providers: [provideMockStore({ initialState })],
        }).compileComponents()

        store = TestBed.inject(MockStore)
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(LineChartComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render the line chart canvas', () => {
        const compiled = fixture.debugElement.nativeElement
        expect(compiled.querySelector(`[data-chartId="line-chart"]`)).toBeTruthy()
    })
})
