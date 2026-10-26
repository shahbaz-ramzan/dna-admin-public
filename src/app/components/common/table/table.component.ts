import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css'],
    standalone: true,
    imports: [CommonModule, PrimengModule],
})
export class TableComponent {
    @Input() header: string[] = []
    @Input() dataKeys: string[] = []
    @Input() data: any[] = []
    @Input() showPagination = false
    @Input() rows = 10
    @Input() showIcon = false
    @Input() iconCol = ''
    @Input() canSelect = false
    @Input() iconArrow = false
    @Output() usersDataEvent = new EventEmitter()

    selectedItems = []

    getSelectedItems() {
        this.usersDataEvent.emit(this.selectedItems)
    }

    trackByIndex(index: number): number {
        return index
    }
}
