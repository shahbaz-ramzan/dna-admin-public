import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AvatarModule } from 'primeng/avatar'
import { AvatarGroupModule } from 'primeng/avatargroup'

@Component({
    selector: 'app-three-user-infor-bar',
    standalone: true,
    imports: [CommonModule, AvatarModule, AvatarGroupModule],
    templateUrl: './three-user-infor-bar.component.html',
    styleUrls: ['./three-user-infor-bar.component.scss'],
})
export class ThreeUserInforBarComponent implements OnChanges {
    @Input() selectedUsers: any

    label = 'Donnie Smith'
    date = '------'
    uniqueStyle = '------'
    advisor = 'Monica Simon'
    tag = '------'
    showMultiAvatar = false
    additionalUsers = 0
    images: string[] = []

    ngOnChanges(changes: SimpleChanges): void {
        if (this.selectedUsers.length > 3) {
            this.showMultiAvatar = true
            this.additionalUsers = this.selectedUsers.length - 3
        } else {
            this.showMultiAvatar = false
        }

        this.selectedUsers.forEach((element: any) => {
            this.images.push(element.profilePictureUrl ? element.profilePictureUrl : '../../../../assets/images/profile.svg')
        })
    }
}
