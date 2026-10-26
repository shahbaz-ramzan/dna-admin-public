import { Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'
import { RippleModule } from 'primeng/ripple'

export interface PopoverButton {
    label: string
    action: string
    class?: string
}

export interface PopoverContent {
    title?: string
    description?: string
    listItems?: string[]
    footerText?: string
}

@Component({
    selector: 'app-popover',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, RippleModule],
    templateUrl: './popover.component.html',
    styleUrls: ['./popover.component.scss'],
})
export class PopoverComponent {
    @Input() visible: boolean = false
    @Input() header: string = 'Information'
    @Input() content: PopoverContent = {}
    @Input() popoverButtons: PopoverButton[] = []
    @Input() modal: boolean = true
    @Input() draggable: boolean = false
    @Input() resizable: boolean = false
    @Input() baseZIndex: number = 10000
    @Input() dialogClass: string = 'info-dialog'

    @Output() visibleChange = new EventEmitter<boolean>()
    @Output() popoverButtonAction = new EventEmitter<string>()

    onPopoverButtonClick(action: string): void {
        this.popoverButtonAction.emit(action)
    }

    onClose(): void {
        this.visible = false
        this.visibleChange.emit(false)
    }
}
