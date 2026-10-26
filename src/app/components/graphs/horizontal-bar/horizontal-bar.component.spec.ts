import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideMockStore, MockStore } from '@ngrx/store/testing'
import { HorizontalBarComponent } from './horizontal-bar.component'
import { NgChartsModule } from 'ng2-charts'

describe('HorizontalBarComponent', () => {
    let component: HorizontalBarComponent
    let fixture: ComponentFixture<HorizontalBarComponent>
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgChartsModule, HorizontalBarComponent],
            providers: [provideMockStore({ initialState })],
        }).compileComponents()

        store = TestBed.inject(MockStore)
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(HorizontalBarComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render the horizontal bar chart canvas', () => {
        const compiled = fixture.debugElement.nativeElement
        expect(compiled.querySelector(`[data-testId="horizontal-bar-chart"]`)).toBeTruthy()
    })
})
