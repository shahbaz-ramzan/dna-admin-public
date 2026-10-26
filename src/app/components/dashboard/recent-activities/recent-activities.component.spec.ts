import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RecentActivitiesComponent } from './recent-activities.component'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { StoreModule } from '@ngrx/store'
import { EffectsModule } from '@ngrx/effects'
import { dashboardReducer } from '../dashboard.reducer'
import { CommonModule } from '@angular/common'
import { NgChartsModule } from 'ng2-charts'
import { TableComponent } from '../../common/table/table.component'

describe('RecentActivitiesComponent', () => {
    let component: RecentActivitiesComponent
    let fixture: ComponentFixture<RecentActivitiesComponent>
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
                RecentActivitiesComponent,
                TableComponent,
            ],
            providers: [provideMockStore()],
        }).compileComponents()
    })

    beforeEach(() => {
        store = TestBed.get(MockStore)
        spyOn(store, 'select').and.callThrough()
        spyOn(store, 'dispatch')
        store.setState(initialState)
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(RecentActivitiesComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Recent Activity' heading", () => {
        const headingEl = fixture.debugElement.nativeElement.querySelector('[data-testId="heading"]')
        expect(headingEl.textContent).toContain('Recent Activity')

        const tableEl = fixture.debugElement.nativeElement.querySelector('[data-testId="table"]')
        expect(tableEl).toBeTruthy()
    })
})
