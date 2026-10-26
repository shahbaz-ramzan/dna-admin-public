import { ComponentFixture, TestBed } from '@angular/core/testing'

import { DiscoveryInprogressAlertComponent } from './discovery-inprogress-alert.component'

describe('DiscoveryInprogressAlertComponent', () => {
    let component: DiscoveryInprogressAlertComponent
    let fixture: ComponentFixture<DiscoveryInprogressAlertComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DiscoveryInprogressAlertComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(DiscoveryInprogressAlertComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render warning', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="warning"]')
        expect(el).toBeTruthy()
    })
})
