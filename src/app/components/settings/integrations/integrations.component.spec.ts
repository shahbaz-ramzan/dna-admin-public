import { ComponentFixture, TestBed } from '@angular/core/testing'

import { StoreModule } from '@ngrx/store'
import { MockStore } from '@ngrx/store/testing'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { settingsReducer } from '../settingsStore/settings.reducer'
import { IntegrationsComponent } from './integrations.component'

describe('IntegrationsComponent', () => {
    let component: IntegrationsComponent
    let fixture: ComponentFixture<IntegrationsComponent>
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({ settingsReducer: settingsReducer }), PrimengModule, IntegrationsComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(IntegrationsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it("should render 'Zapier Integration' heading", () => {
        const headingEl = fixture.debugElement.nativeElement.querySelector('[data-testId="integration-heading"]')
        expect(headingEl.textContent).toContain('Zapier Integrations')
    })

    it("should render 'Zapier Sync All' heading", () => {
        const headingEl = fixture.debugElement.nativeElement.querySelector('[data-testId="sync-all-heading"]')
        expect(headingEl.textContent).toContain('Zapier Sync All')
    })

    it("should render 'Sync' button and call 'onSyncAll' method on click", () => {
        const btnEl = fixture.debugElement.nativeElement.querySelector('[data-testId="sync-all-btn"]')
        expect(btnEl.textContent).toContain('Sync')

        component.isZapierBulkStatusInProgress = false
        fixture.detectChanges()
        spyOn(component, 'onSyncAll').and.callThrough()
        btnEl.click()
        expect(component.onSyncAll).toHaveBeenCalledTimes(1)
    })
})
