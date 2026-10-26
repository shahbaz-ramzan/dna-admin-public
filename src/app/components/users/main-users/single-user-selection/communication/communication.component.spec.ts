import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CommunicationComponent } from './communication.component'

describe('CommunicationComponent', () => {
    let component: CommunicationComponent
    let fixture: ComponentFixture<CommunicationComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommunicationComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(CommunicationComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Preferred Contact Methods')
    })

    it('should render content', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="content"]')
        expect(el).toBeTruthy()
    })
})
