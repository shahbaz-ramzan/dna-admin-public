import { Routes } from '@angular/router'
import { ComparisonReportComponent } from './comparison-report/comparison-report.component'
import { FactorsReportComponent } from './factors-report/factors-report.component'
import { MainUsersComponent } from './main-users.component'
import { ParticipantBusinessReportComponent } from './participant-business-report/participant-business-report.component'
import { ParticipantFinancialReportComponent } from './participant-financial-report/participant-financial-report.component'
import { CoachingReportComponent } from './single-user-selection/coaching-report/coaching-report.component'
import { SalesReportComponent } from './single-user-selection/sales-report/sales-report.component'
import { TeamReportComponent } from './team-report/team-report.component'

// Relative routes, reused for both the /users and /myTeam prefixes - see home-routing.module.ts,
// which lazy-loads this route table from two separate paths.
export const MAIN_USERS_ROUTES: Routes = [
    { path: '', component: MainUsersComponent },
    { path: 'comparison-report', component: ComparisonReportComponent },
    { path: 'participant-business-report', component: ParticipantBusinessReportComponent },
    { path: 'participant-financial-report', component: ParticipantFinancialReportComponent },
    { path: 'factors-report', component: FactorsReportComponent },
    { path: 'team-report', component: TeamReportComponent },
    { path: 'sales-report', component: SalesReportComponent },
    { path: 'coaching-report', component: CoachingReportComponent },
]
