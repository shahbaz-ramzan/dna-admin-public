import { ComponentFixture, TestBed } from '@angular/core/testing'

import { EnvironmentKeysComponent } from './environment-keys.component'

describe('EnvironmentKeysComponent', () => {
    let component: EnvironmentKeysComponent
    let fixture: ComponentFixture<EnvironmentKeysComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EnvironmentKeysComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(EnvironmentKeysComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el).toBeTruthy()
    })

    it('should render content', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="content"]')
        expect(el).toBeTruthy()
    })
})
