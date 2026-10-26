import { ComponentFixture, TestBed } from '@angular/core/testing'

import { BehaviralBiasesComponent } from './behaviral-biases.component'
import { mainUserReducer } from '../../mainUserStore/main-users.reducer'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'
import { StoreModule } from '@ngrx/store'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'

describe('BehaviralBiasesComponent', () => {
    let component: BehaviralBiasesComponent
    let fixture: ComponentFixture<BehaviralBiasesComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PrimengModule, StoreModule.forRoot({ dashboardReducer: dashboardReducer, mainUserReducer: mainUserReducer }), BehaviralBiasesComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(BehaviralBiasesComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Behavioral Biases')
    })

    it('should render horizontal bar chart', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="bar-chart"]')
        expect(el).toBeTruthy()
    })
})
