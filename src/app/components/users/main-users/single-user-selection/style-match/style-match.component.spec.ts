import { ComponentFixture, TestBed } from '@angular/core/testing'

import { StyleMatchComponent } from './style-match.component'
import { mainUserReducer } from '../../mainUserStore/main-users.reducer'
import { dashboardReducer } from 'src/app/components/dashboard/dashboard.reducer'
import { StoreModule } from '@ngrx/store'

describe('StyleMatchComponent', () => {
    let component: StyleMatchComponent
    let fixture: ComponentFixture<StyleMatchComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({ dashboardReducer: dashboardReducer, mainUserReducer: mainUserReducer }), StyleMatchComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(StyleMatchComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render title', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="title"]')
        expect(el.textContent).toContain('Style Match')
    })

    it('should render content', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="content"]')
        expect(el).toBeTruthy()
    })
})
