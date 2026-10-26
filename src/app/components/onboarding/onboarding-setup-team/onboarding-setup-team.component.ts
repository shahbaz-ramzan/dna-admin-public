import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { ButtonModule } from 'primeng/button'
import { DropdownModule } from 'primeng/dropdown'
@Component({
    selector: 'app-onboarding-setup-team',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, DropdownModule],
    templateUrl: './onboarding-setup-team.component.html',
    styleUrls: ['./onboarding-setup-team.components.scss'],
})
export class OnboardingSetupTeamComponent implements AfterContentInit {
    @Output() getUsersEvent = new EventEmitter()
    @Input() isTeamSetupFormValidated = false
    roles: any = []
    form = this.fb.group({
        teamMembers: this.fb.array([]),
    })

    constructor(private fb: UntypedFormBuilder) {}

    ngAfterContentInit(): void {
        this.roles = [
            {
                name: 'User',
            },
            {
                name: 'Admin',
            },
        ]

        for (let i = 0; i < 2; i++) {
            const newMemberForm = this.fb.group({
                firstName: ['', Validators.required],
                lastName: ['', Validators.required],
                role: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
            })
            this.teamMembers.push(newMemberForm)
        }

        this.getUsers()
    }

    get teamMembers() {
        return this.form.controls['teamMembers'] as UntypedFormArray
    }

    addTeamMember() {
        const newMemberForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            role: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
        })
        this.teamMembers.push(newMemberForm)
        this.getUsers()
    }

    deleteTeamMember(index: number) {
        this.teamMembers.removeAt(index)
    }

    getUsers() {
        this.getUsersEvent.emit(this.teamMembers)
    }
}
