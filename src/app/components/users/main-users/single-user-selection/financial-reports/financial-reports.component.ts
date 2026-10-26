import { Component, Input, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { DialogModule } from 'primeng/dialog'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { RadioButtonModule } from 'primeng/radiobutton'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'

@Component({
    selector: 'app-financial-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, DialogModule, ButtonModule, InputTextModule, RadioButtonModule, LoadingSpinnerComponent],
    templateUrl: './financial-reports.component.html',
    styleUrls: ['./financial-reports.component.scss'],
})
export class FinancialReportsComponent implements OnInit {
    // possible values for pageType: 'double-user', 'three-user'
    @Input() pageType: string
    @Input() selectedParticipants: any[]
    @Input() loading: boolean

    leader: string
    teamName: string
    root: string
    retportTitle = ''
    reportRoute = ''

    financialReports: {
        title: string
        link: string
        isExternalLink: boolean
        isFirst: boolean
    }[]
    constructor(private router: Router) {}

    ngOnInit(): void {
        if (this.pageType === 'single-user') {
            this.retportTitle = 'Participant Report'
            this.reportRoute = 'participant-report'
        } else if (this.pageType === 'double-user') {
            this.retportTitle = 'Comparison Report'
            this.reportRoute = 'comparison-report'
        } else {
            this.retportTitle = 'Team Report'
            this.reportRoute = 'team-report'
        }
        this.financialReports = [
            {
                title: this.retportTitle,
                link: this.reportRoute,
                isExternalLink: false,
                isFirst: true,
            },
        ]
    }

    leaderModal: boolean

    goToReport() {
        if (this.pageType === 'double-user' || this.pageType === 'single-user') {
            this.leaderModal = false
            this.root = window.location.href.split('/')[3].split('?')[0]
            this.router.navigate([`/${this.root}/`, this.financialReports[0].link], {
                queryParamsHandling: 'preserve',
            })
        } else {
            this.root = '/' + window.location.href.split('/')[3].split('?')[0] + '/'
            this.leaderModal = true
        }
    }

    displayModal: boolean

    showModalDialog() {
        this.displayModal = true
    }
}
