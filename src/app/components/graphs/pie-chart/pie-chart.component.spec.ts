import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideMockStore, MockStore } from '@ngrx/store/testing'
import { NgChartsModule } from 'ng2-charts'
import { PieChartComponent } from './pie-chart.component'

describe('PieChartComponent', () => {
    let component: PieChartComponent
    let fixture: ComponentFixture<PieChartComponent>
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgChartsModule, PieChartComponent],
            providers: [provideMockStore({ initialState })],
        }).compileComponents()

        store = TestBed.inject(MockStore)
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(PieChartComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render the pie chart canvas', () => {
        const compiled = fixture.debugElement.nativeElement
        expect(compiled.querySelector('[data-chartId="pie-chart"]')).toBeTruthy()
    })

    // Regression test: a parent that keeps this component instance alive across updates (e.g.
    // three-user-selection.component.ts does NOT recreate its children on every participant
    // selection change) previously froze the chart at whatever data was passed on the FIRST
    // ngOnChanges, because ngOnChanges only rebuilt chartOptions, never pieChartData - the object
    // ng2-charts' [data] binding actually watches for a reference change. See
    // PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md - this bug became visible once per-person
    // caching made repeated selection updates land on the same live component instance instead
    // of a freshly recreated one.
    it('rebuilds pieChartData (a new object reference) with the new labels/data when inputs change after init', () => {
        // ngOnInit already ran once (with the default ['a','b','c','d'] inputs) via the outer
        // beforeEach's fixture.detectChanges(). Simulate the FIRST real parent update - as would
        // happen the first time three-user-selection.component.ts calls handleParticipantDetailResponse
        // after this chart's initial mount.
        component.chartLabels = ['Adapter', 'Engager', 'Initiator']
        component.chartData = [1, 1, 1]
        component.chartColors = [{ backgroundColor: ['red', 'green', 'blue'] } as any]
        component.ngOnChanges({
            chartLabels: { previousValue: ['a', 'b', 'c', 'd'], currentValue: component.chartLabels, firstChange: false, isFirstChange: () => false },
        } as any)

        const firstPieChartData = component.pieChartData
        expect(firstPieChartData.labels).toEqual(['Adapter', 'Engager', 'Initiator'])
        expect(firstPieChartData.datasets[0].data).toEqual([1, 1, 1])

        // Simulate a parent adding a 4th participant with a new distinct style - new array
        // references, as the real caller (handleParticipantDetailResponse) always produces.
        component.chartLabels = ['Adapter', 'Engager', 'Initiator', 'Facilitator']
        component.chartData = [1, 1, 1, 1]
        component.ngOnChanges({
            chartLabels: { previousValue: ['Adapter', 'Engager', 'Initiator'], currentValue: component.chartLabels, firstChange: false, isFirstChange: () => false },
        } as any)

        expect(component.pieChartData).not.toBe(firstPieChartData)
        expect(component.pieChartData.labels).toEqual(['Adapter', 'Engager', 'Initiator', 'Facilitator'])
        expect(component.pieChartData.datasets[0].data).toEqual([1, 1, 1, 1])
    })
})
