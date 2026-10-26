import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RecentCompletionsComponent } from './recent-completions.component'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { EffectsModule } from '@ngrx/effects'
import { CommonModule } from '@angular/common'
import { NgChartsModule } from 'ng2-charts'
import { dashboardReducer } from '../dashboard.reducer'
import { MockStore } from '@ngrx/store/testing'
import { TableComponent } from '../../common/table/table.component'

describe('RecentCompletionsComponent', () => {
    let component: RecentCompletionsComponent
    let fixture: ComponentFixture<RecentCompletionsComponent>
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                PrimengModule,
                StoreModule.forRoot({ settingsReducer: dashboardReducer }),
                EffectsModule.forRoot([]),
                CommonModule,
                NgChartsModule,
                RecentCompletionsComponent,
                TableComponent,
            ],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(RecentCompletionsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Completion in Last 30 Days' heading", () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="heading"]')
        expect(el.textContent).toContain('Completion in Last 30 Days')
    })

    it('should render table', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="table"]')
        expect(el).toBeTruthy()
    })
})
