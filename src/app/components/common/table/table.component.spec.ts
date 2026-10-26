import { ComponentFixture, TestBed } from '@angular/core/testing'

import { TableComponent } from './table.component'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'

describe('TableComponent', () => {
    let component: TableComponent
    let fixture: ComponentFixture<TableComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PrimengModule, TableComponent],
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(TableComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render table', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="table"]')
        expect(el).toBeTruthy()
    })
})
