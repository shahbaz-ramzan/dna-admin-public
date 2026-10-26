import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NgCircleProgressModule } from 'ng-circle-progress'

import { WorkTalentComponent } from './work-talent.component'

describe('WorkTalentComponent', () => {
    let component: WorkTalentComponent
    let fixture: ComponentFixture<WorkTalentComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkTalentComponent, NgCircleProgressModule.forRoot({})],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkTalentComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Work Talents')
    })

    it('should render circle progress content', () => {
        component.workTalentObject = [{ description: 'description', value: 50, comparison1: '1', comparison2: '2', label: 'label' }]
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="circle-progress-content"]')
        expect(el).toBeTruthy()
    })
})
