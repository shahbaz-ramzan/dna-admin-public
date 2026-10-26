import { CommonModule, Location } from '@angular/common'
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Params } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import * as moment from 'moment'
import { Subject } from 'rxjs'
import { ButtonModule } from 'primeng/button'
import { ChatbotComponent } from '../../../chatbot/chatbot.component'
import { SingleLineHorizontalComponent } from 'src/app/components/graphs/single-line-horizontal/single-line-horizontal.component'
import { PieChartComponent } from 'src/app/components/graphs/pie-chart/pie-chart.component'
import { ReportLoadingOverlayComponent } from 'src/app/components/common/report-loading-overlay/report-loading-overlay.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { Color } from 'src/app/util/interfaces'
import { buildMultiUserChatPayload, buildWorkTalentsInsights, disableWonderchat, enableWonderchat, generateTScorePayload } from 'src/app/util/utils'
import { MainUsersService } from '../../main-users.service'
import { getCustomReportNameAction, getCustomReportNameSuccessAction } from '../mainUserStore/main-users.actions'
import { ReportColorService } from '../report-color.service'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TeamReportPaginationService } from './team-report-pagination.service'
import { TeamReportPdfExportService } from './team-report-pdf-export.service'
import { TeamReportDataService } from './team-report-data.service'
import { buildReportFileName } from '../report-file-name.util'

@Component({
    selector: 'app-team-report',
    templateUrl: './team-report.component.html',
    styleUrls: ['./team-report.component.css'],
    standalone: true,
    imports: [CommonModule, ButtonModule, ChatbotComponent, SingleLineHorizontalComponent, PieChartComponent, ReportLoadingOverlayComponent],
})
export class TeamReportComponent implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef)
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    selectedParticipantIds: any[] = []
    accountId: string | null
    usersData: any[] = []
    pageNumber: number
    resultsFocusedParticipants: any[] = []
    relationshipFocusedParticipants: any[] = []
    resultsFocusedPercentage: any
    relationshipFocusedPercentage: any
    leader: any
    loading = true
    chartLabels: string[] = []
    chartValues: number[] = []
    chartColors: string[] = []
    pieChartColors: Color[] = []
    chartPosition: any = 'bottom'
    boxSize: any = 15
    yAxisPosition = 'right'
    canvasData: any[] = []
    pdf: any
    lineChartColors: Color[] = [
        {
            backgroundColor: [this.primaryColor, this.secondaryColor],
            borderColor: [this.primaryColor, this.secondaryColor],
        },
    ]
    lineChartLabels: string[] = []
    barThicknessValue = 10
    lineChartData: {
        data: number[]
        label: string
        backgroundColor: string
        borderColor: string
        barThickness: number
    }[] = []

    // Static label metadata for the 8 core/work-life factors; leftValues/rightValues/midValues
    // are populated per-participant at runtime by fillTScoreTableData and must stay as separate
    // array instances per factor field below (not shared references).
    private readonly FACTOR_LABELS = [
        { factorName: 'Factor 1: Commanding', leftLabel: 'Cooperative (Practical)', rightLabel: 'Take Charge (Visionary)' },
        { factorName: 'Factor 2: People', leftLabel: 'Reserved (Focused)', rightLabel: 'Outgoing (Expressive)' },
        { factorName: 'Factor 3: Patience', leftLabel: 'Fast-Paced (Logical)', rightLabel: 'Patient (Tolerant)' },
        { factorName: 'Factor 4: Structure', leftLabel: 'Spontaneous (Instinctive)', rightLabel: 'Planned (Systematic)' },
        { factorName: 'Factor 5: Trust', leftLabel: 'Skeptical (Questioning)', rightLabel: 'Trusting (Believing)' },
        { factorName: 'Factor 6: Pioneering', leftLabel: 'Content (Balanced)', rightLabel: 'Pioneer (Goal Oriented)' },
        { factorName: 'Factor 7: Risk', leftLabel: 'Cautious (Conservative)', rightLabel: 'Risk Taker (Courageous)' },
        { factorName: 'Factor 8: Creativity', leftLabel: 'Anchored (Consistent)', rightLabel: 'Creative (Original)' },
    ]

    factor1 = { ...this.FACTOR_LABELS[0], leftValues: [], rightValues: [], midValues: [] }
    factor2 = { ...this.FACTOR_LABELS[1], leftValues: [], rightValues: [], midValues: [] }
    factor3 = { ...this.FACTOR_LABELS[2], leftValues: [], rightValues: [], midValues: [] }
    factor4 = { ...this.FACTOR_LABELS[3], leftValues: [], rightValues: [], midValues: [] }
    factor5 = { ...this.FACTOR_LABELS[4], leftValues: [], rightValues: [], midValues: [] }
    factor6 = { ...this.FACTOR_LABELS[5], leftValues: [], rightValues: [], midValues: [] }
    factor7 = { ...this.FACTOR_LABELS[6], leftValues: [], rightValues: [], midValues: [] }
    factor8 = { ...this.FACTOR_LABELS[7], leftValues: [], rightValues: [], midValues: [] }
    coreWorkLifeDrivers: any[] = [this.factor1, this.factor2, this.factor3, this.factor4, this.factor5]
    workLifePlanningDrivers: any[] = [this.factor6, this.factor7, this.factor8]

    appendixA: any[] = []
    appendixB: any[] = []
    behavioralStyles: any[] = []
    uniqueStyles: any[] = []
    resultsVsRelationship: any[] = []

    behavioralStylePageNumber: any[] = []
    resultVsRelationPageNumber: any[] = []
    uniqueStylesPageNumber: any[] = []
    coreWorkLifeDriversPageNumber: any[] = []
    workLifePlanningDriversPageNumber: any[] = []
    appendixAPageNumber: any[] = []
    appendixBPageNumber: any[] = []
    isReportLoading = false
    isDownloadReady = false
    footerYear = moment(new Date()).format('YYYY')
    footerDate = moment(new Date()).format('DD-MMM-YY')
    teamName: string
    reportColors: any
    isColorDefault = true
    logo = ''
    personId: string
    reportName = 'Team'
    usersFinalPayloadsMap: any[] = []
    chat_payload_data: any = {}
    progressPercentage = 0

    constructor(
        private activatedRoute: ActivatedRoute,
        private mainUsersService: MainUsersService,
        private _location: Location,
        private store: Store<any>,
        private msgService: MsgService,
        private mixpanelService: MixpanelService,
        private actions: Actions,
        private reportColorService: ReportColorService,
        private paginationService: TeamReportPaginationService,
        private pdfExportService: TeamReportPdfExportService,
        private dataService: TeamReportDataService
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.personId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        this.mixpanelService.track('Team report page viewed', {
            accountId: this.accountId,
            personID: this.personId,
            reportType: 'Team Report',
        })
        disableWonderchat()
    }

    ngOnInit(): void {
        this.setBrandLogo()
        this.store.dispatch(
            getCustomReportNameAction({
                accountId: this.accountId,
                reportId: K.APP.REPORTS.TEAM_REPORT_ID,
            })
        )

        this.pageNumber = 2
        this.activatedRoute.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: Params) => {
            const selectedParticipantsQueryString: string = params['selectedParticipants']
            this.leader = params['leader']
            this.teamName = params['team']
            this.selectedParticipantIds.push(this.leader)

            selectedParticipantsQueryString.split(',').forEach((id) => {
                if (id !== this.leader) this.selectedParticipantIds.push(id)
            })
        })

        // getCustomReportName's effect (main-users-reports.effects.ts) attaches `error` on any
        // failure and dispatches `response: undefined` - ApiErrorNotificationEffects toasts it
        // globally, so there's nothing left to branch on here beyond "did we get usable data".
        // See REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md D4/D5/D6.
        this.actions.pipe(ofType(getCustomReportNameSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.data) return
            if (response.body.data.customReports?.length) {
                this.reportName = response.body.data.customReports[0]?.customReportName
            } else {
                this.reportName = response.body.data.reportsList?.[0]?.reportName
            }
        })
        this.reportColorService
            .accountColor$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((accountColor) => {
                if (accountColor.primaryColor != K.APP.DEFAULT_PRIMARY_COLOR) {
                    this.isColorDefault = false
                    this.reportColors = this.reportColorService.getColorVariants(this.primaryColor)
                    this.lineChartColors = [
                        {
                            backgroundColor: [this.primaryColor, this.secondaryColor],
                            borderColor: [this.primaryColor, this.secondaryColor],
                        },
                    ]
                } else {
                    this.isColorDefault = true
                    this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
                    this.secondaryColor2 = K.APP.DEFAULT_SECONDARY_COLOR2
                    this.lineChartColors = [
                        {
                            backgroundColor: ['#4D7194', '#003366'],
                            borderColor: ['#4D7194', '#003366'],
                        },
                    ]
                }

                this.primaryColor = accountColor.primaryColor
                this.secondaryColor2 = accountColor.secondaryColor2
                this.secondaryColor = accountColor.secondaryColor
            })

        this.dataService.getAllResponses(this.selectedParticipantIds, this.accountId).subscribe((responses) => {
            //Set All Participants Details Data
            const participants = responses[0][0]?.body?.data
            participants.sort((a: any, b: any) => {
                const firstFullname = `${a.firstName} ${a.lastName}`.toLowerCase()
                const secondFullname = `${b.firstName} ${b.lastName}`.toLowerCase()

                if (firstFullname < secondFullname) return -1
                if (firstFullname > secondFullname) return 1
                return 0
            })
            // Sorting personIDs and moving the leader's ID to the start of the list
            const leaderId = this.selectedParticipantIds[0]
            this.selectedParticipantIds = participants.filter((p: any) => p.personId !== leaderId).map((p: any) => p.personId)
            this.selectedParticipantIds.unshift(leaderId)

            const participantDetail = this.transformParticipantArray(responses[0][0]?.body?.data)
            this.setParticipantDetailsData(participantDetail)
            this.setLeader(this.leader)

            //Set Unique Style and Description Data for All Participants
            responses[4].forEach((response: any) => {
                this.setParticipantUniqueStyleAndDescription(response?.body?.data)
            })

            /* Set Results Vs Realtionship Data for All Participants */
            // Sorting participants response according to the already sorted participant IDs
            const resVsRelParticipants = this.selectedParticipantIds.map((id: string) => {
                const participant = responses[1].find((res: any) => res.body.data.personID === id)
                return participant
            })
            resVsRelParticipants.forEach((response: any) => {
                this.setResultsVsRelationship(response?.body?.data)
            })
            this.resultsFocusedPercentage = Math.round((this.resultsFocusedParticipants.length / this.selectedParticipantIds.length) * 100)
            this.relationshipFocusedPercentage = Math.round((this.relationshipFocusedParticipants.length / this.selectedParticipantIds.length) * 100)
            this.lineChartLabels.push(this.resultsFocusedPercentage + '%', this.relationshipFocusedPercentage + '%')
            this.lineChartData = [
                {
                    data: [this.resultsFocusedPercentage, 0],
                    label: `Results Focused Team Members`,
                    backgroundColor: this.isColorDefault ? '#4D7194' : this.primaryColor,
                    borderColor: this.isColorDefault ? '#4D7194' : this.primaryColor,
                    barThickness: this.barThicknessValue,
                },
                {
                    data: [0, this.relationshipFocusedPercentage],
                    label: `Relationship Focused Team Members`,
                    backgroundColor: this.isColorDefault ? '#003366' : this.secondaryColor,
                    borderColor: this.isColorDefault ? '#003366' : this.secondaryColor,
                    barThickness: this.barThicknessValue,
                },
            ]
            //Set Work Talents Insights for All Participants
            responses[1].forEach((response: any) => {
                const workTalentsData = response?.body?.data
                const participantId = workTalentsData?.personID
                if (participantId) {
                    this.usersData[participantId]['workTalentsInsights'] = buildWorkTalentsInsights(workTalentsData)
                }
            })

            //Set Strongest Factors of All Participants
            responses[2].forEach((response: any) => {
                this.setParticipantStrongestFactors(response?.body?.data)
            })

            //Set Tscore of All Participants
            responses[2].forEach((response: any) => {
                this.setParticipantsTScore(response?.body?.data)

                // Combine API response data with user details for complete payload
                const participantData = response?.body?.data
                const userData = this.usersData[participantData?.personID]
                const combinedData = {
                    ...participantData,
                    uniqueStyle: userData?.uniqueStyle,
                    behaviorTypeName: userData?.behaviorTypeName || userData?.uniqueStyle,
                    behaviorTypeDescription: userData?.behaviorTypeDescription,
                    workTalentsInsights: userData?.workTalentsInsights,
                }

                const formattedPayload = generateTScorePayload(combinedData)
                this.usersFinalPayloadsMap.push(formattedPayload)
            })

            this.fillTScoreTableData()
            //Set Strengths and Struggles of All Participants
            responses[3].forEach((response: any) => {
                this.setParticipantStrengthAndStruggles(response?.body?.data)
            })
            this.createBehavioralStylesPages()
            this.createResultVsRealtionPages()
            this.createUniqueStylesPages()
            this.createCoreDriversPages()
            this.createWorkLifeDriversPages()
            this.createAppendixAPages()
            this.createAppendixBPages()
            this.loading = false

            // Build chat payload for multiple users (team) with complete data including behaviorTypeDescription
            this.chat_payload_data = buildMultiUserChatPayload(this.usersFinalPayloadsMap, 'Team Report')

            setTimeout(() => {
                this.prepareCanvas()
            }, 1000)
        })
    }

    setParticipantDetailsData(participantDetail: any) {
        for (const pIndex of this.selectedParticipantIds) {
            this.usersData[pIndex] = {
                firstName: participantDetail[pIndex]?.firstName,
                lastName: participantDetail[pIndex]?.lastName,
                email: participantDetail[pIndex]?.email,
                tags: participantDetail[pIndex]?.tags,
                completionDate: participantDetail[pIndex]?.completionDate,
                userLabel: participantDetail[pIndex]?.userLabel,
                uniqueStyle: participantDetail[pIndex]?.uniqueStyle,
                isLeader: false,
                facilitator: null,
                cdnaMigrated: participantDetail[pIndex]?.cdnaMigrated,
                isDigitalScan: participantDetail[pIndex]?.isDigitalScanV1_5Imported,
            }
            if (participantDetail[pIndex]?.cdnaMigrated)
                this.msgService.showMigratedToaster(participantDetail[pIndex]?.firstName + ' ' + participantDetail[pIndex]?.lastName)

            if (participantDetail[pIndex]?.facilitatorId && participantDetail[pIndex]?.facilitatorName) {
                this.usersData[pIndex]['facilitator'] = {
                    facilitatorId: participantDetail[pIndex]?.facilitatorId,
                    facilitatorName: participantDetail[pIndex]?.facilitatorName,
                }
            }
        }
        this.setUniqueStyleGraph()
    }

    getIsDigitalScan() {
        return this.selectedParticipantIds.some((participantId) => this.usersData[participantId]?.isDigitalScan)
    }

    setLeader(participant: any) {
        this.usersData[participant]['isLeader'] = true
    }

    transformParticipantArray(participantArray: any) {
        const tranformedArray: any[] = []
        participantArray.forEach((person: any) => {
            tranformedArray[person?.personId] = person
        })
        return tranformedArray
    }

    setParticipantStrongestFactors(participantData: any) {
        this.usersData[participantData?.personID]['strongestFactors'] = participantData?.strogestFactors
    }

    setResultsVsRelationship(participantDetail: any) {
        participantDetail?.resultsVsRelationships.label == 'Results'
            ? this.resultsFocusedParticipants.push(participantDetail?.personID)
            : this.relationshipFocusedParticipants.push(participantDetail?.personID)
    }

    setParticipantsTScore(participantData: any) {
        if (!participantData?.personID) return
        this.usersData[participantData?.personID]['tScore'] = participantData?.tscore
    }
    setParticipantStrengthAndStruggles(participantDetail: any) {
        this.usersData[participantDetail?.personID]['environmentKeys'] = participantDetail?.environmentKeys
        this.usersData[participantDetail?.personID]['strengths'] = participantDetail?.strengths
        this.usersData[participantDetail?.personID]['struggles'] = participantDetail?.struggles
    }
    fillTScoreTableData() {
        this.selectedParticipantIds?.forEach((participant) => {
            const participantTScore = this.usersData[participant]?.tScore
            for (let i = 0; i < 5; i++) {
                if (participantTScore[i] >= 20 && participantTScore[i] < 45) {
                    this.coreWorkLifeDrivers[i].leftValues.push({
                        name: this.usersData[participant]?.firstName + ' ' + this.usersData[participant]?.lastName,
                        value: participantTScore[i],
                        isLeader: this.usersData[participant]?.isLeader,
                    })
                } else if (participantTScore[i] >= 45 && participantTScore[i] <= 55) {
                    this.coreWorkLifeDrivers[i].midValues.push({
                        name: this.usersData[participant]?.firstName + ' ' + this.usersData[participant]?.lastName,
                        value: participantTScore[i],
                        isLeader: this.usersData[participant]?.isLeader,
                    })
                } else if (participantTScore[i] > 55 && participantTScore[i] <= 80) {
                    this.coreWorkLifeDrivers[i].rightValues.push({
                        name: this.usersData[participant].firstName + ' ' + this.usersData[participant].lastName,
                        value: participantTScore[i],
                        isLeader: this.usersData[participant].isLeader,
                    })
                }
            }
            let j = 0
            for (let i = 5; i < 8; i++) {
                if (participantTScore[i] >= 20 && participantTScore[i] < 45) {
                    this.workLifePlanningDrivers[j].leftValues.push({
                        name: this.usersData[participant].firstName + ' ' + this.usersData[participant].lastName,
                        value: participantTScore[i],
                        isLeader: this.usersData[participant].isLeader,
                    })
                } else if (participantTScore[i] >= 45 && participantTScore[i] <= 55) {
                    this.workLifePlanningDrivers[j].midValues.push({
                        name: this.usersData[participant].firstName + ' ' + this.usersData[participant].lastName,
                        value: participantTScore[i],
                        isLeader: this.usersData[participant].isLeader,
                    })
                } else if (participantTScore[i] > 55 && participantTScore[i] <= 80) {
                    this.workLifePlanningDrivers[j].rightValues.push({
                        name: this.usersData[participant].firstName + ' ' + this.usersData[participant].lastName,
                        value: participantTScore[i],
                        isLeader: this.usersData[participant].isLeader,
                    })
                }
                j = j + 1
            }
        })
    }
    setUniqueStyleGraph() {
        const uniqueStyles: any = {}
        const primaryColors: any = this.reportColorService.getColorVariants(this.isColorDefault ? '#003366' : this.primaryColor)
        const secondaryColors: any = this.reportColorService.getColorVariants(this.isColorDefault ? '#4D7194' : this.secondaryColor)

        this.chartColors = []
        let primaryIndex = 0
        let secondryIndex = 0

        this.selectedParticipantIds?.forEach((element: any, i: number) => {
            uniqueStyles[this.usersData[element].uniqueStyle] = (uniqueStyles[this.usersData[element].uniqueStyle] || 0) + 1
            if (i < 10) {
                if (i % 2 == 0) {
                    this.chartColors.push(primaryColors[primaryIndex])
                    primaryIndex++
                } else {
                    this.chartColors.push(secondaryColors[secondryIndex])
                    secondryIndex++
                }
            }
        })
        this.chartLabels = Object.keys(uniqueStyles)
        this.chartValues = Object.values(uniqueStyles)
        this.pieChartColors = [
            {
                backgroundColor: this.chartColors,
            },
        ]
    }
    backClick() {
        this._location.back()
    }

    createAppendixAPages() {
        this.paginationService.createAppendixAPages(this)
    }

    createAppendixBPages() {
        this.paginationService.createAppendixBPages(this)
    }

    createBehavioralStylesPages() {
        this.paginationService.createBehavioralStylesPages(this)
    }

    createUniqueStylesPages() {
        this.paginationService.createUniqueStylesPages(this)
    }

    createCoreDriversPages() {
        this.paginationService.createCoreDriversPages(this)
    }

    createWorkLifeDriversPages() {
        this.paginationService.createWorkLifeDriversPages(this)
    }

    createResultVsRealtionPages() {
        this.paginationService.createResultVsRealtionPages(this)
    }

    fillCoreDriversForFactor(factor: any) {
        this.paginationService.fillCoreDriversForFactor(this, factor)
    }

    fillWorkDriversForFactor(factor: any) {
        this.paginationService.fillWorkDriversForFactor(this, factor)
    }

    async prepareCanvas() {
        await this.pdfExportService.prepareCanvas(this)
    }

    // `<Report name> Report - <Team name>.pdf`, or the participant count when no team name was passed -
    // see report-file-name.util.ts.
    get reportFileName(): string {
        // selectedParticipantIds starts with the leader, who may be undefined when no leader param was passed.
        const participantCount = this.selectedParticipantIds.filter(Boolean).length
        const subject = this.teamName || (participantCount ? `${participantCount} Participants` : '')
        return buildReportFileName(`${this.reportName} Report`, subject)
    }

    downloadPdf() {
        this.pdfExportService.downloadPdf(this)
    }

    loadText() {
        return this.pdfExportService.loadText(this)
    }

    setBrandLogo() {
        this.pdfExportService.setBrandLogo(this)
    }

    setParticipantUniqueStyleAndDescription(participantData: any) {
        if (participantData?.personID) {
            this.usersData[participantData?.personID]['behaviorTypeDescription'] = participantData?.behaviorTypeDescription
            this.usersData[participantData?.personID]['behaviorTypeName'] = participantData?.behaviorTypeName
        }
    }

    ngOnDestroy(): void {
        enableWonderchat()
    }

    trackByIndex(index: number, item?: unknown): number {
        return index
    }
}
