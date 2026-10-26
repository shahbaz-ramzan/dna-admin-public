import { CommonModule, Location } from '@angular/common'
import { Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Params } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import * as moment from 'moment'
import { ButtonModule } from 'primeng/button'
import { forkJoin, Observable } from 'rxjs'
import { ReportLoadingOverlayComponent } from 'src/app/components/common/report-loading-overlay/report-loading-overlay.component'
import K from 'src/app/constants'
import { ensureApiError } from 'src/app/service/api-error'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { buildMultiUserChatPayload, buildWorkTalentsInsights, disableWonderchat, enableWonderchat, generateTScorePayload } from 'src/app/util/utils'
import { ChatbotComponent } from '../../../chatbot/chatbot.component'
import { MainUsersService } from '../../main-users.service'
import { DiscoveryIncompleteModalComponent } from '../discovery-incomplete-modal/discovery-incomplete-modal.component'
import {
    discoveryStatusResolvedAction,
    getCustomReportNameAction,
    getCustomReportNameSuccessAction,
    getUniqueStyleAction,
} from '../mainUserStore/main-users.actions'
import { ReportColorService } from '../report-color.service'
import { buildReportFileName, formatPersonName, joinPersonNames } from '../report-file-name.util'
import { TScoresComponent } from '../single-user-selection/t-scores/t-scores.component'

@Component({
    selector: 'app-comparison-report',
    templateUrl: './comparison-report.component.html',
    styleUrls: ['./comparison-report.component.scss'],
    standalone: true,
    imports: [CommonModule, ButtonModule, ChatbotComponent, ReportLoadingOverlayComponent, TScoresComponent, DiscoveryIncompleteModalComponent],
})
export class ComparisonReportComponent implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef)
    discoveryIncomplete = false
    multipleIncomplete = false
    // personId -> has completed Discovery, for the participants in this report.
    private discoveryResults: Record<string, boolean> = {}
    private reportDataLoaded = false
    selectedParticipants: any = []
    styleMatch = 0
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    isReportLoading = false
    isDownloadReady = false
    accountId: string | null
    workplaceData: any[] = []
    pageNumber = 3
    footerYear = moment(new Date()).format('YYYY')
    footerDate = moment(new Date()).format('DD-MMM-YY')
    tScoreChartData: any = [
        {
            name: '',
            data: [],
            color: this.secondaryColor2,
        },
        {
            name: '',
            data: [],
            color: this.primaryColor,
        },
    ]

    @ViewChild(TScoresComponent) tScoreComponent: TScoresComponent
    idDouble = 'double'
    index = 0
    id: string = this.idDouble.concat(this.index.toString())
    reportColors: any
    isColorDefault = true
    logo = ''
    personId: string
    reportName = 'Comparison'
    canvasData: any[] = []
    usersFinalPayloadsMap: any[] = [] // Keep plain object for easy modification
    chat_payload_data: any = {}
    progressPercentage = 0

    constructor(
        private activatedRoute: ActivatedRoute,
        private userService: MainUsersService,
        private msgService: MsgService,
        private _location: Location,
        private store: Store<any>,
        private actions: Actions,
        private mixpanelService: MixpanelService,
        private reportColorService: ReportColorService
    ) {
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.personId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        this.mixpanelService.track('Report page viewed', {
            accountId: this.accountId,
            reportType: 'Comparison Report',
        })
        disableWonderchat()
        this.listenDiscoveryStatus()
    }

    ngOnInit(): void {
        this.queryParamsSubscription()
        this.setBrandLogo()
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
                    this.primaryColor = accountColor.primaryColor
                    this.secondaryColor2 = accountColor.secondaryColor2
                    this.secondaryColor = accountColor.secondaryColor

                    this.reportColors = this.reportColorService.getColorVariants(this.primaryColor)
                } else {
                    this.isColorDefault = true
                    this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
                    this.secondaryColor2 = K.APP.DEFAULT_SECONDARY_COLOR2
                }
            })

        // Last, so every response listener above is subscribed before any request is made - see
        // loadReportData().
        this.checkDiscoveryStatus()
    }

    setBrandLogo() {
        const coBrandLogo = JSON.parse(Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || ''))?.cobrandingLogoPath
        if (coBrandLogo) {
            // converting coBrandLogo to base64, so that it can be available in
            // generated pdf
            this.userService.toDataURL(coBrandLogo, (dataUrl: any) => {
                this.logo = dataUrl
            })
        } else {
            this.logo = 'assets/images/logo.png'
        }
    }

    queryParamsSubscription() {
        this.activatedRoute.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: Params) => {
            this.selectedParticipants = []
            const selectedParticipantsQueryString: string = params['selectedParticipants']
            selectedParticipantsQueryString.split(',').forEach((id) => {
                this.selectedParticipants.push({ id: id })
            }) // populating selectedParticipants List
        })
    }

    getParticipantDetailSuccess(responseBody: any) {
        const participantDetails = responseBody?.data
        for (const pIndex in participantDetails) {
            const participant = {
                firstName: participantDetails[pIndex]?.firstName,
                lastName: participantDetails[pIndex]?.lastName,
                email: participantDetails[pIndex]?.email,
                uniqueStyle: participantDetails[pIndex]?.uniqueStyle,
                isDigitalScan: participantDetails[pIndex]?.isDigitalScanV1_5Imported,
            }
            const targetIndex = this.selectedParticipants.findIndex((p: any) => p.id === participantDetails[pIndex]?.personId)
            if (targetIndex != null)
                this.selectedParticipants[targetIndex] = {
                    ...this.selectedParticipants[targetIndex],
                    ...participant,
                }
        }
    }

    // requestDataFromMultipleSources() is a plain forkJoin over raw HTTP responses (see
    // multipleRequestSubscription() below) - ApiErrorInterceptor already converts a genuine
    // transport failure before forkJoin would ever deliver it here, so a resolved `responseBody`
    // reaching any of these six methods is always a real success. `body.statusCode` doesn't exist
    // on any response anymore (see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md), so the
    // `case 400/500` branches below were already unreachable in practice, not just `case 200` -
    // dropped the dead switch in each rather than fixing a condition that can't fire either way.
    getTScoreSuccess(responseBody: any) {
        const tscoreData = responseBody?.data
        if (tscoreData) {
            // Find the participant details for this user to get uniqueStyle and behaviorTypeDescription
            const participantDetail = this.selectedParticipants.find((p: any) => p.id === tscoreData.personID)
            // Combine tScore data with participant details for complete payload
            const workTalentsData = participantDetail?.workTalentsData
            const workTalentsInsights = workTalentsData ? buildWorkTalentsInsights(workTalentsData) : buildWorkTalentsInsights(null)

            const combinedData = {
                ...tscoreData,
                uniqueStyle: participantDetail?.uniqueStyle,
                behaviorTypeName: participantDetail?.behaviorTypeName || participantDetail?.uniqueStyle,
                behaviorTypeDescription: participantDetail?.behaviorTypeDescription,
                workTalentsInsights: workTalentsInsights,
            }

            const formattedPayload = generateTScorePayload(combinedData)
            this.usersFinalPayloadsMap.push(formattedPayload)
        }
        const targetIndex = this.selectedParticipants.findIndex((p: any) => p.id === tscoreData?.personID)
        if (targetIndex != null) {
            this.selectedParticipants[targetIndex]['tScoreData'] = tscoreData
            this.tScoreChartData = this.modifyTScoreData()
        }
    }

    getWorkplaceInsightSuccess(responseBody: any) {
        const workplaceData = responseBody?.data
        if (!workplaceData) return
        const targetIndex = this.selectedParticipants.findIndex((p: any) => p.id === workplaceData.personID)
        if (targetIndex != null) this.selectedParticipants[targetIndex]['workplaceData'] = workplaceData
    }

    getStyleMatchSuccess(responseBody: any) {
        this.styleMatch = responseBody?.data
    }

    getPerformanceGuideSuccess(responseBody: any) {
        const performanceData = responseBody?.data
        if (!performanceData) return
        const targetIndex = this.selectedParticipants.findIndex((p: any) => p.id === performanceData.personID)
        if (targetIndex != null) this.selectedParticipants[targetIndex]['performanceData'] = performanceData
    }

    getWorkTalentsSuccess(responseBody: any) {
        const workTalentsData = responseBody?.data
        if (!workTalentsData) return
        const targetIndex = this.selectedParticipants.findIndex((p: any) => p.id === workTalentsData.personID)
        if (targetIndex !== -1) {
            this.selectedParticipants[targetIndex]['workTalentsData'] = workTalentsData
        }
    }

    getUniqueStyleAndDescriptionSuccess(responseBody: any) {
        const uniqueStyleData = responseBody?.data
        if (!uniqueStyleData) return
        const targetIndex = this.selectedParticipants.findIndex((p: any) => p.id === uniqueStyleData?.personID)
        if (targetIndex !== -1) {
            this.selectedParticipants[targetIndex]['behaviorTypeDescription'] = uniqueStyleData?.behaviorTypeDescription
            this.selectedParticipants[targetIndex]['behaviorTypeName'] = uniqueStyleData?.behaviorTypeName
        }
    }

    public requestDataFromMultipleSources(): Observable<any[]> {
        const userDetailRequest = this.userService.getParticipantsDetailRequest(this.selectedParticipants, this.accountId)
        const tScoreRequests = this.userService.getTScoreRequests(this.selectedParticipants)
        const workplaceRequests = this.userService.getWorkplaceInsightRequests(this.selectedParticipants)
        const styleMatchRequest = this.userService.getStyleMatchRequest(this.selectedParticipants)
        const perfomanceRequests = this.userService.getPerformanceGuideRequests(this.selectedParticipants)
        const workTalentsRequests = this.userService.getWorkTalentsRequests(this.selectedParticipants)
        const uniqueStyleRequests = this.userService.getUniqueStyleAndDescriptionRequests(this.selectedParticipants)

        return forkJoin([
            userDetailRequest,
            ...tScoreRequests,
            ...workplaceRequests,
            styleMatchRequest,
            ...perfomanceRequests,
            ...workTalentsRequests,
            ...uniqueStyleRequests,
        ])
    }

    multipleRequestSubscription() {
        this.isReportLoading = true
        this.requestDataFromMultipleSources().subscribe({
            next: (combinedResponse) => {
                // Process responses in correct order:
                // 1. Participant details first
                // 2. Unique style and description second
                // 3. Work talents data third (to build insights)
                // 4. TScore data last (to use all data in payload)

                // Step 1: Process participant details
                // `userDetailRequest` is always index 0 in the forkJoin array built by
                // requestDataFromMultipleSources() below - routed by position, not by sniffing
                // `response?.url`, because it goes through mainUserService.getParticipantsDetail()
                // (the cached per-person service method), whose response is a synthesized
                // `{ body: { statusCode, data } }` object with no `.url` property at all - not a raw
                // HttpResponse like every other request in this forkJoin. The old `response?.url?.
                // includes('GetParticipantsDetails')` check could never match it, so this handler
                // never ran and participant names never populated - a structural mismatch between the
                // caching layer and this component's URL-sniffing routing, unrelated to the
                // `body.statusCode` contract change (see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md -
                // this bug is not part of that family).
                this.getParticipantDetailSuccess(combinedResponse?.[0]?.body)

                // Step 2: Process unique style and description data
                combinedResponse?.forEach((response) => {
                    if (response?.url?.includes('GetUniqueStyleAndDescription')) this.getUniqueStyleAndDescriptionSuccess(response?.body)
                })

                // Step 3: Process work talents data BEFORE tScore data
                combinedResponse?.forEach((response) => {
                    if (response?.url?.includes('GetBDNA5Scores')) this.getWorkTalentsSuccess(response?.body)
                })

                // Step 4: Process other data including tScore (which needs all previous data)
                combinedResponse?.forEach((response) => {
                    if (response?.url?.includes('GetAssessmentResultsArray')) this.getTScoreSuccess(response?.body)
                    else if (response?.url?.includes('GetBDNAWorkplaceInsightsArray')) this.getWorkplaceInsightSuccess(response?.body)
                    else if (response?.url?.includes('GetStyleMatch')) this.getStyleMatchSuccess(response?.body)
                    else if (response?.url?.includes('GetPerformanceGuideArray')) this.getPerformanceGuideSuccess(response?.body)
                })
                this.createWorkplaceInsightPages()
                this.pageNumber = this.pageNumber + this.workplaceData.length
                this.isReportLoading = false
                this.isDownloadReady = false

                // Build chat payload for multiple users
                this.chat_payload_data = buildMultiUserChatPayload(this.usersFinalPayloadsMap, 'Comparison Report')

                setTimeout(() => {
                    this.prepareCanvas() //wait for the data to be downloaded from the server
                }, 15000)
            },
            // This forkJoin previously had no error callback at all: a single failing sub-request
            // (out of the ~6+ parallel requests it combines) meant `next` never ran, no message
            // ever showed, and isReportLoading stayed true forever (a permanent spinner). forkJoin
            // fails as one unit on the first error, so unlike the per-widget messages the old dead
            // `switch (statusCode)` blocks in each *Success handler were written for, only a single
            // generic message is possible here - restoring per-widget granularity would require
            // replacing forkJoin with a structure that reports each request's own outcome.
            error: (err) => {
                this.isReportLoading = false
                this.msgService.errorMessage(ensureApiError(err).message)
            },
        })
    }

    workplaceTagCSS(insightHml: string) {
        let cssClass = 'tag'
        switch (insightHml) {
            case 'High':
                cssClass = 'tag high'
                break
            case 'Medium':
                cssClass = 'tag'
                break
            case 'Low':
                cssClass = 'tag low'
                break
        }
        return cssClass
    }

    createTScoreGraph() {
        this.tScoreComponent?.createTScoreGraph()
    }

    modifyTScoreData() {
        const chartData: any = []
        for (let i = 0; i < this.selectedParticipants.length; i++) {
            const dataObject = {
                name: this.selectedParticipants[i]?.firstName,
                data: this.modifyTScoreBarData(this.selectedParticipants[i]?.tScoreData?.tscore),
                color: i % 2 === 1 ? this.primaryColor : this.secondaryColor2,
            }
            chartData.push(dataObject)
        }
        return chartData
    }

    modifyTScoreBarData(array: number[]) {
        return array?.map((x) => x - 50)
    }

    factor16Description(factor: string) {
        return K.APP.FACTORS_16_DESCRIPTIONS[factor as keyof typeof K.APP.FACTORS_16_DESCRIPTIONS]
    }

    async prepareCanvas() {
        this.isDownloadReady = false
        const totalPages = this.pageNumber + 3
        const { default: html2canvas } = await import('html2canvas')
        for (let i = 1; i <= totalPages; i++) {
            const data: any = document.getElementById('cp-report-page' + i)
            data.style.fontFeatureSettings = '"liga" 0'
            const canvas = await html2canvas(data, { scale: 2 })
            this.canvasData.push(canvas)
            this.progressPercentage = Math.round((i / totalPages) * 100)
        }
        this.isDownloadReady = true
    }

    downloadPdf() {
        this.isDownloadReady = false
        setTimeout(async () => {
            const { jsPDF } = await import('jspdf')
            const pdf = new jsPDF('p', 'mm', 'letter', true)
            this.msgService.reportsSuccessMessage("Report Downloading... Access the report in your 'Downloads' folder")

            for (let i = 1; i <= this.pageNumber + 3; i++) {
                const canvas = this.canvasData[i - 1]
                const imgWidth = 215
                const pageHeight = 286
                const imgHeight = (canvas.height * imgWidth) / canvas.width
                let heightLeft = imgHeight

                const contentDataURL = canvas.toDataURL('image/png')
                let position = 0
                pdf.addPage()
                pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
                if (imgHeight > pageHeight) {
                    heightLeft -= pageHeight
                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight + 6
                        pdf.addPage()
                        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
                        heightLeft -= pageHeight
                    }
                }
            }
            pdf.deletePage(1)
            this.isDownloadReady = true
            pdf.save(this.reportFileName)
            this.mixpanelService.track('Comparison report PDF downloaded', {
                accountId: this.accountId,
                reportType: 'Comparison Report',
            })
        }, 1000)
    }

    loadText() {
        const dotCount = 1 + (this.canvasData.length % 3)
        const text = 'Preparing Download' + '.'.repeat(dotCount)
        return text
    }

    backClick() {
        this._location.back()
    }

    createWorkplaceInsightPages() {
        this.selectedParticipants.forEach((participant: any) => {
            const pages = Math.ceil(participant?.workplaceData?.insight.length / 12)
            let start = 0
            let end = 12
            for (let i = 0; i < pages; i++) {
                this.workplaceData.push({
                    person: participant,
                    insight: participant?.workplaceData?.insight.slice(start, end),
                })
                start = end
                end = end + 10
            }
        })
    }
    // `<Report name> - A & B.pdf`, names from the participant details this report loads - see
    // report-file-name.util.ts.
    get reportFileName(): string {
        const names = this.selectedParticipants.map((participant: any) => formatPersonName(participant?.firstName, participant?.lastName))
        return buildReportFileName(this.reportName, joinPersonNames(names))
    }

    // Discovery/GetUniqueStyle gates this report: if any participant hasn't completed Discovery there's
    // nothing to compare, so none of the report's APIs are called and the modal names whoever is
    // incomplete. All participants are checked in parallel.
    private checkDiscoveryStatus() {
        const personIds = this.participantIds()
        if (!personIds.length) return
        // The report's own overlay covers the check, so the empty report never flashes. Left up
        // behind the modal if anyone is incomplete.
        this.isReportLoading = true
        this.discoveryResults = {}
        personIds.forEach((personId) => this.store.dispatch(getUniqueStyleAction({ personId })))
    }

    // Subscribed from the constructor rather than ngOnInit so it's in place before the first
    // dispatch - an already-known participant resolves synchronously.
    private listenDiscoveryStatus() {
        this.actions.pipe(ofType(discoveryStatusResolvedAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ personId, completed }) => {
            if (!this.participantIds().includes(personId)) return
            this.discoveryResults[personId] = completed
            this.evaluateDiscoveryStatus()
        })
    }

    // Waits until every participant has an answer, then either loads the report or shows the modal -
    // never a partial comparison.
    private evaluateDiscoveryStatus() {
        const personIds = this.participantIds()
        if (personIds.some((personId) => !(personId in this.discoveryResults))) return
        const incomplete = personIds.filter((personId) => !this.discoveryResults[personId])
        if (incomplete.length) {
            this.multipleIncomplete = incomplete.length > 1
            this.discoveryIncomplete = true
            return
        }
        this.loadReportData()
    }

    // Every API call this report makes - only reached once Discovery/GetUniqueStyle confirms all
    // participants have completed Discovery (or the check itself failed). Loaded once.
    private loadReportData() {
        if (this.reportDataLoaded) return
        this.reportDataLoaded = true
        this.multipleRequestSubscription()
        this.store.dispatch(
            getCustomReportNameAction({
                accountId: this.accountId,
                reportId: K.APP.REPORTS.COMPARISON_REPORT_ID,
            })
        )
    }

    private participantIds(): string[] {
        return (this.selectedParticipants ?? []).map((participant: any) => participant?.id).filter(Boolean)
    }

    ngOnDestroy() {
        enableWonderchat()
    }

    trackByIndex(index: number, item?: unknown): number {
        return index
    }
}
