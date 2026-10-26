import { ComponentFixture, TestBed } from '@angular/core/testing'

import { AppcuesManagementComponent } from './appcues-management.component'

describe('AppcuesManagementComponent', () => {
    let component: AppcuesManagementComponent
    let fixture: ComponentFixture<AppcuesManagementComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppcuesManagementComponent],
        }).compileComponents()

        fixture = TestBed.createComponent(AppcuesManagementComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })
})
