import { CommonModule, Location } from '@angular/common'
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Store } from '@ngrx/store'
import * as moment from 'moment'
import { NgCircleProgressModule } from 'ng-circle-progress'
import { QrCodeModule } from 'ng-qrcode'
import { ButtonModule } from 'primeng/button'
import { ReportLoadingOverlayComponent } from 'src/app/components/common/report-loading-overlay/report-loading-overlay.component'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import { ChatbotComponent } from '../../../chatbot/chatbot.component'

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Actions, ofType } from '@ngrx/effects'
import { camelCase, capitalize } from 'lodash'
import { catchError, map } from 'rxjs/operators'
import { DashboardServiceService } from 'src/app/components/dashboard/dashboard-service.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import { buildChatPayloadData, buildWorkTalentsInsights, disableWonderchat, enableWonderchat, shortenYoutubeUrl } from 'src/app/util/utils'
import { MainUsersService } from '../../main-users.service'
import { DiscoveryIncompleteModalComponent } from '../discovery-incomplete-modal/discovery-incomplete-modal.component'
import {
    discoveryStatusResolvedAction,
    getBehaviralBiases,
    getCustomReportNameAction,
    getCustomReportNameSuccessAction,
    getEnvironmentKeys,
    getEnvironmentKeysSuccess,
    getFDNAFinancialPlanningInsightsAction,
    getFDNAFinancialPlanningInsightsActionSuccess,
    getFDNAScoreAction,
    getFactorRelationshipAction,
    getFactorRelationshipActionSuccess,
    getMarketMoodArrayAction,
    getRiskAllocation,
    getRiskAllocationSuccess,
    getTScoreAction,
    getTScoreActionSuccess,
    getUniqueStyleAction,
    getUniqueStyleAndDescriptionAction,
    getVideoUrlAction,
    getWorkTalentsAction,
} from '../mainUserStore/main-users.actions'
import { selectMainUserState } from '../mainUserStore/main-users.selectors'
import { buildReportFileName, formatPersonName } from '../report-file-name.util'
import { ReportSharedService } from '../report-shared.service'
@Component({
    selector: 'app-participant-financial-report',
    templateUrl: './participant-financial-report.component.html',
    styleUrls: ['./participant-financial-report.component.scss'],
    standalone: true,
    imports: [
        DiscoveryIncompleteModalComponent,
        CommonModule,
        ButtonModule,
        NgCircleProgressModule,
        QrCodeModule,
        ChatbotComponent,
        ReportLoadingOverlayComponent,
    ],
})
export class ParticipantFinancialReportComponent implements OnInit, OnDestroy {
    private destroyRef = inject(DestroyRef)
    discoveryIncomplete = false
    private discoveryCheckPersonId = ''
    private reportDataLoaded = false
    // Names for the downloaded PDF's file name - see reportFileName.
    private reportOwnerName = ''
    private navigationParticipantName = ''
    langId: any = K.APP.LANGUAGE_ID
    accountId: any
    selfRegId: any
    user_object: any
    logo: any
    secondaryColor2: any
    secondaryColor: any
    primaryColor: any
    participantName: string
    isDigitalScan: boolean
    footerYear: string
    footerDate: string
    reportColor: any

    isLoading: any
    tScoreLoading: boolean
    uniqueStyleAndDescription: any
    dashboardFDNASetting: any
    performanceGuide: any
    videoUrl: any
    scoreFDNAObj: any
    scoreFDNA5: any[] = []

    uniqueStyleVideo: string
    marketMood: any
    behavioralBiases: any
    discoveryDto: any
    biasesVideo: any = {
        firstBiase: '',
        secondBiase: '',
    }
    marketMoodVideo = 'https://www.youtube.com/embed/pcIbrCrxgZA'
    showCard: any = {
        video: true,
        performanceKeys: true,
        report: true,
        fbOverview: true, // only in case of investor
        marketMood: true, // only in case of investor
        fbInsights: true, // only in case of investor
        bBiases: true, // only in case of investor
    }

    // elementType = NgxQrcodeElementTypes.URL
    // correctionLevel = NgxQrcodeErrorCorrectionLevels.HIGH
    isDownloadReady: boolean = false
    pageNumber = 10
    canvasPrepared = false
    canvasInProgress = false
    vowels: any = ['a', 'e', 'i', 'o', 'u']
    word = ''
    reportName = 'Financial Behavior'
    firstBiaseName = ''
    secondBiaseName = ''
    canvasData: any[] = []
    pdf: any

    pageNumberMap = new Map()
    personId: string
    riskGroup: number

    financialPlanningInsights: any[] = []
    chat_payload_data: any = {}
    workTalentsInsights: any = {}
    fdnaUniqueStyleVideos: any = {}
    progressPercentage = 0
    get uniqueStyleImages() {
        return this.reportShared.uniqueStyleImages
    }
    environmentKeysData: any = []
    strugglesData: any[] = []
    strengthsData: any[] = []
    firstTraitKey = ''
    secondTraitKey = ''
    firstTraitKeyHeading = ''
    secondTraitKeyHeading = ''
    top2Traits: string[] = []
    factorRelationships: any = []
    factorRelationShipName: any
    coachingReportTraits: any = {}

    constructor(
        private store: Store<{
            fdnaReportReducer: any
            mainUserReducer: any
        }>,
        private _location: Location,
        private dashboardService: DashboardServiceService,
        private router: Router,
        private mixpanelService: MixpanelService,
        private actions: Actions,
        private msgService: MsgService,
        private userService: MainUsersService,
        private route: ActivatedRoute,
        private reportShared: ReportSharedService
    ) {
        this.listenDiscoveryStatus()
        this.accountId = Encryption.decryptData(localStorage.getItem('accountId') || '')
        this.selfRegId = localStorage.getItem('registrationId')

        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        this.user_object = JSON.parse(this.user_object)

        this.footerYear = moment(new Date()).format('YYYY')
        this.footerDate = moment(new Date()).format('DD-MMM-YY')

        this.primaryColor = localStorage.getItem('primaryColor')
        this.secondaryColor = localStorage.getItem('secondaryColor')
        document.documentElement.style.setProperty(`--primary-color`, this.primaryColor)
        document.documentElement.style.setProperty(`--secondary-color`, this.secondaryColor)

        if (this.primaryColor === K.APP.DEFAULT_PRIMARY_COLOR) {
            this.secondaryColor2 = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
            this.reportColor = this.secondaryColor2
        } else {
            this.secondaryColor2 = localStorage.getItem('secondaryColor')
            this.reportColor = this.primaryColor
        }

        disableWonderchat()

        this.mixpanelService.track('Participant investor report Viewed', {
            ...this.user_object,
            discoveryType: 'Investor',
        })
    }

    ngOnInit(): void {
        this.setBrandLogo()
        this.discoveryDto = history.state.discoverySettings
        this.participantName = history.state.participantName
        this.navigationParticipantName = history.state?.participantName || ''
        // Downloaded file name: the participant's name from their own T-score response, accepted only
        // for this report's participant (the store can still hold an earlier one's) - see
        // report-file-name.util.ts.
        this.actions.pipe(ofType(getTScoreActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ tScorePaylaod, personId }) => {
            const data = tScorePaylaod?.body?.data
            if (personId !== this.discoveryCheckPersonId || !data) return
            this.reportOwnerName = formatPersonName(data.firstName, data.lastName)
        })
        this.isDigitalScan = history.state.isDigitalScan
        if (history.state.discoverySettings) {
            localStorage.setItem('discoverySettings', JSON.stringify(this.discoveryDto))
            localStorage.setItem('participantName', this.participantName)
            localStorage.setItem('isDigitalScan', this.isDigitalScan.toString())
        }
        let personId = ''
        this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap: any) => {
            const params = paramMap.params
            personId = params.selectedParticipants
        })
        this.personId = personId
        // getEnvironmentKeys's effect (environmentKeysData in main-users-reports.effects.ts) was
        // already correctly migrated - it gates on `body.data` and delivers real data - but this
        // handler still branched on `body.statusCode`, which never exists, so it fell into neither
        // case and silently discarded good data. Fixed to match the effect (D3/D4/D6).
        this.actions.pipe(ofType(getEnvironmentKeysSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ environmentKeysPayload }) => {
            if (!environmentKeysPayload?.body?.data) return
            this.environmentKeysData = environmentKeysPayload.body.data.environmentKeys
            this.strugglesData = environmentKeysPayload.body.data.struggles
            this.strengthsData = environmentKeysPayload.body.data.strengths
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
        // Add tScore success subscription
        this.actions.pipe(ofType(getTScoreActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            // Only prepare canvas if not already prepared or in progress
            if (!this.canvasPrepared && !this.canvasInProgress && this.reportName) {
                this.isDownloadReady = false
                setTimeout(() => {
                    this.prepareCanvas() //wait for the data to be downloaded from the server
                }, 10000)
            }
        })
        // Factor Relationship
        // getFactorRelationship's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally (notify: true).
        // Classified on `.body.value` presence, not the dead `.status` gate.
        this.actions.pipe(ofType(getFactorRelationshipActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.value) return
            this.factorRelationships = response.body.value
            if (this.top2Traits?.length && this.factorRelationships?.length) {
                this.factorRelationShipName = this.factorRelationships?.find((el: any) => el?.FactorName == this.top2Traits?.[0] + '_' + this.top2Traits?.[1])
            }
        })
        // getRiskAllocations's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally. Classified on
        // `body.data` presence, not `body.statusCode` (D1/D4/D6 - see
        // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md).
        this.actions.pipe(ofType(getRiskAllocationSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.data) return
            this.riskGroup = response.body.data.riskGroup
        })
        // Same pattern as getRiskAllocationSuccess above.
        this.actions.pipe(ofType(getFDNAFinancialPlanningInsightsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            const data = response?.body?.data
            if (!data) return
            this.financialPlanningInsights = Array.from({ length: 13 }, (_, i) => data?.[`insight${i + 1}`]).filter(Boolean)
        })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.isLoading =
                    state?.isUniqueStyleLoading ||
                    state?.isDashboardFDNASettingLoading ||
                    state.isPerformanceGuideLoading ||
                    state.isVideoUrlLoading ||
                    state.getFDNAScoreLoading ||
                    state.isMarketMoodLoading ||
                    state.getBehaviralBiasesLoading ||
                    state.getTScoreLoading ||
                    state.getWorkTalentsLoading

                // this.tScoreLoading = state?.getTScoreLoading

                // Set top2Traits from tScore data
                const strongestFactors = state?.tScorePaylaod?.data?.strogestFactors
                if (strongestFactors?.length >= 2) {
                    if (!this.top2Traits?.length) {
                        this.top2Traits = strongestFactors
                    }
                    const [firstTrait, secondTrait] = this.top2Traits
                    // Trait keys & headings
                    if (firstTrait && secondTrait) {
                        this.firstTraitKey = capitalize(firstTrait[0]) + camelCase(firstTrait).substring(1)

                        this.secondTraitKey = capitalize(secondTrait[0]) + camelCase(secondTrait).substring(1)

                        this.firstTraitKeyHeading = firstTrait
                        this.secondTraitKeyHeading = secondTrait
                    }
                    // Relationship
                    if (this.factorRelationships?.length && !this.factorRelationShipName) {
                        const relationKey = `${firstTrait}_${secondTrait}`

                        this.factorRelationShipName = this.factorRelationships.find((el: any) => el?.FactorName === relationKey)
                    }
                }

                // Process work talents data for dynamic insights
                if (state?.workTalentsPayload?.data != undefined) {
                    this.workTalentsInsights = buildWorkTalentsInsights(state?.workTalentsPayload?.data)
                } else if (!Object.keys(this.workTalentsInsights).length) {
                    // Use default insights if work talents data is not available
                    this.workTalentsInsights = buildWorkTalentsInsights(null)
                }

                const payloadData = {
                    twoStrongestTraits: [state?.tScorePaylaod?.data?.strogestFactors[0], state?.tScorePaylaod?.data?.strogestFactors[1]],
                    description_data: state?.uniqueStyleAndDescription?.data,
                    tScoreData: state?.tScorePaylaod?.data?.tscore,
                    personName: state?.tScorePaylaod?.data?.firstName,
                    reportType: 'Participant Financial Report',
                    workTalentsInsights: this.workTalentsInsights,
                }
                this.chat_payload_data = buildChatPayloadData(payloadData)

                this.uniqueStyleAndDescription = state.uniqueStyleAndDescription?.data

                if (this.vowels.includes(this.uniqueStyleAndDescription?.behaviorTypeName[0].toLowerCase())) {
                    this.word = 'An'
                } else {
                    this.word = 'A'
                }

                this.dashboardFDNASetting = state.dashboardFDNASettingData?.data
                this.performanceGuide = state.environmentKeysPayload?.data
                this.videoUrl = state.videoUrlData?.data
                this.scoreFDNAObj = state.FDNAScorePayload?.data

                this.marketMood = state.marketMoodData?.data
                this.behavioralBiases = state.behaviralBiasesPayload?.data?.behavioralBiasList
                // this.discoveryDto = this.dashboardFDNASetting;
                this.discoveryDto = localStorage.getItem('discoverySettings') || ''
                this.participantName = localStorage.getItem('participantName') || ''
                this.isDigitalScan = localStorage.getItem('isDigitalScan') === 'true'
                if (this.discoveryDto) this.discoveryDto = JSON.parse(this.discoveryDto)
                this.showCard = {
                    ...this.showCard,
                    report: this.discoveryDto?.isViewReport,
                    video: this.discoveryDto?.isVideo,
                    performanceKeys: this.discoveryDto?.isPGuide,
                    fbOverview: this.discoveryDto?.isBehavOverview,
                    fbInsights: this.discoveryDto?.isFDNA5Score,
                    topTraits: this.discoveryDto?.topTraits,
                    interactiveInsights: this.discoveryDto?.interactiveInsights,
                    financialPlanningInsights: this.discoveryDto?.isFinancialPlanningInsights,
                    riskPortfolioGroup: this.discoveryDto?.riskPortfolioGroup,
                }
                if (!this.isLoading) {
                    // Use the unique style name to get the video URL
                    const uniqueStyleName = this.uniqueStyleAndDescription?.behaviorTypeName
                    if (uniqueStyleName) {
                        const videoUrl = this.fdnaUniqueStyleVideos[uniqueStyleName]
                        this.uniqueStyleVideo = shortenYoutubeUrl(videoUrl)
                    }
                    this.scoreFDNA5 = this.dashboardService.parseFDNAandBDNAObjects(this.scoreFDNAObj)

                    this.behavioralBiases = this.dashboardService.parseBehaviorBiasesList(this.behavioralBiases)
                    this.firstBiaseName = this.behavioralBiases[0]?.name
                    this.biasesVideo.firstBiase = K.APP.BEHAVIORAL_BIASES_VIDEOS[this.firstBiaseName]
                    this.secondBiaseName = this.behavioralBiases[1]?.name
                    this.biasesVideo.secondBiase = K.APP.BEHAVIORAL_BIASES_VIDEOS[this.secondBiaseName]
                    this.marketMood = {
                        ...this.marketMood,
                        marketMoodDescriptions: this.dashboardService.removeBoldTagFromMoodData(this.marketMood?.marketMoodDescriptions),
                    }
                    if (!this.canvasPrepared && !this.canvasInProgress && this.reportName) {
                        this.setPageNumber()
                        this.prepareCanvas()
                    }
                }
            })

        // Last, so every response listener above is subscribed before any request is made - see
        // loadReportData().
        this.checkDiscoveryStatus(personId)
    }

    // Every API call this report makes - only reached once Discovery/GetUniqueStyle confirms the
    // participant has completed Discovery (or the check itself failed). Response listeners and store
    // subscriptions stay in ngOnInit so the template's state is initialized either way.
    private loadReportData(personId: string) {
        if (this.reportDataLoaded) return
        this.reportDataLoaded = true
        const currentDate = moment().format('DD-MM-YYYY')
        this.store.dispatch(
            getCustomReportNameAction({
                accountId: this.accountId,
                reportId: K.APP.REPORTS.FINANCIAL_BEHAVIOR_REPORT_ID,
            })
        )
        this.store.dispatch(getUniqueStyleAndDescriptionAction(personId, this.langId))
        // this.mixpanelService.track('Report Content Permission Request', {
        //     ...this.user_object,
        //     discoveryType: 'investor',
        //     requestBody: {
        //         selfRegId: this.selfRegId,
        //         accountId: this.accountId,
        //     },
        // })
        this.store.dispatch(getEnvironmentKeys(personId, this.langId))
        this.store.dispatch(getVideoUrlAction(personId))
        this.store.dispatch(getFDNAScoreAction(personId, this.langId))
        this.store.dispatch(getMarketMoodArrayAction(personId, -1, currentDate))
        this.store.dispatch(getBehaviralBiases(personId, this.langId))
        this.store.dispatch(getRiskAllocation(this.personId))
        this.store.dispatch(getFDNAFinancialPlanningInsightsAction(this.personId))
        // Add tScore API call
        this.store.dispatch(getTScoreAction(this.personId))
        this.store.dispatch(getFactorRelationshipAction())
        // Add work talents API call for dynamic insights
        this.store.dispatch(getWorkTalentsAction(this.personId, this.langId))
        this.userService
            .getCoachingReportTraitsData()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((response: any) => {
                    if (response?.status === 200) {
                        this.coachingReportTraits = response?.body?.value?.find((el: any) => el?.TraitsName === 'TraitsDescription') || {}
                    } else {
                        this.msgService.errorMessage('Failed to load coaching report traits data')
                    }
                }),
                catchError((error) => {
                    console.error('Error fetching coaching report traits:', error)
                    this.msgService.errorMessage('Error loading coaching report traits data')
                    return ''
                })
            )
            .subscribe()
        this.userService
            .getFDNAUniqueStyleVideoLinks()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((response: any) => {
                    if (response?.status === 200) {
                        const videoMap: { [key: string]: string } = {}
                        response.body.value.forEach((item: any) => {
                            videoMap[item.UniqueStyle] = item.videoURL
                        })
                        this.fdnaUniqueStyleVideos = videoMap
                    }
                }),
                catchError((error) => {
                    console.error('Error fetching FDNA video links:', error)
                    this.msgService.errorMessage('Error loading FDNA video links')
                    return ''
                })
            )
            .subscribe()
    }

    setBrandLogo() {
        this.reportShared.getBrandLogo$(this.userService).subscribe((logo) => {
            this.logo = logo
        })
    }
    onBack() {
        this._location.back()
    }

    async prepareCanvas() {
        // Prevent multiple simultaneous calls
        if (this.canvasInProgress || this.canvasPrepared) {
            return
        }
        this.canvasInProgress = true
        this.isDownloadReady = false
        this.progressPercentage = 0
        try {
            const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
            if (!this.pdf) {
                this.pdf = new JsPDF('p', 'mm', 'letter', true)
            }
            for (let i = 1; i <= this.pageNumber; i++) {
                const data: any = document.getElementById(i.toString())
                if (data) {
                    data.style.fontFeatureSettings = '"liga" 0'
                    const canvas = await html2canvas(data, { scale: 2 })
                    this.canvasData.push(canvas)
                    const imgWidth = 215
                    const imgHeight = (canvas.height * imgWidth) / canvas.width
                    const contentDataURL = canvas.toDataURL('image/png')
                    this.pdf.addPage()
                    this.pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
                }
                // Update progress incrementally
                this.progressPercentage = Math.round((i / this.pageNumber) * 100)
            }
            this.pdf.deletePage(1)
            this.isDownloadReady = true
            this.canvasPrepared = true
        } catch (error) {
            console.error('Error during canvas preparation:', error)
            this.isDownloadReady = false
        } finally {
            this.canvasInProgress = false
        }
    }
    setPageNumber() {
        let currentPageNumber = 0
        for (let i = 1; i <= this.pageNumber; i++) {
            const data: any = document.getElementById(i.toString())
            if (data) {
                currentPageNumber++
                this.pageNumberMap.set(data.id, currentPageNumber)
            }
        }
    }
    downloadPdf() {
        this.msgService.reportsSuccessMessage("Report Downloading... Access the report in your 'Downloads' folder")
        this.mixpanelService.track('Participant investor report Downloaded', {
            ...this.user_object,
            reportType: 'Financial Behavior Report',
        })
        this.pdf.save(this.reportFileName)
    }

    loadText() {
        return this.reportShared.loadText(this.canvasData.length)
    }
    // Get progress display text for button
    getProgressText(): string {
        if (this.isDownloadReady) {
            return 'Download'
        } else if (this.canvasInProgress) {
            return `Preparing... ${this.progressPercentage}%`
        } else {
            return `Preparing... ${this.progressPercentage}%`
        }
    }

    getPrimaryColor(condition: boolean) {
        return { backgroundColor: condition ? this.reportColor : '', color: condition ? 'white' : '' }
    }

    getThumbPosition(value: number) {
        switch (value) {
            case 1:
                return 7
            case 2:
                return 22
            case 3:
                return 39
            case 4:
                return 53
            case 5:
                return 68
            case 6:
                return 82
            case 7:
                return 97
            default:
                return null
        }
    }
    getCurrentUniqueStyleImage(): string {
        return this.reportShared.getUniqueStyleImage(this.uniqueStyleAndDescription?.behaviorTypeName)
    }

    ngOnDestroy() {
        // Clean up canvas preparation state
        this.canvasInProgress = false
        this.canvasPrepared = false

        enableWonderchat()
    }

    trackByIndex(index: number, item?: unknown): number {
        return index
    }

    // `<Report name> - <First> <Last>.pdf`. Prefers the name from the participant's own data; falls back
    // to the name the users page passed when navigating here, then to the report name alone.
    get reportFileName(): string {
        return buildReportFileName(`${this.reportName} Report`, this.reportOwnerName || formatPersonName(this.navigationParticipantName))
    }

    // Discovery/GetUniqueStyle gates the rest of this page: a participant who hasn't completed
    // Discovery has no data, so none of the report's other APIs are called and the modal is shown.
    private checkDiscoveryStatus(personId: string) {
        if (!personId) return
        this.discoveryCheckPersonId = personId
        this.store.dispatch(getUniqueStyleAction({ personId }))
    }

    // Subscribed from the constructor rather than ngOnInit so it's in place before the first
    // dispatch - a warm-cache (30s) response is delivered synchronously.
    private listenDiscoveryStatus() {
        this.actions.pipe(ofType(discoveryStatusResolvedAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ personId, completed }) => {
            if (personId !== this.discoveryCheckPersonId) return
            if (completed) {
                this.loadReportData(personId)
            } else {
                this.discoveryIncomplete = true
            }
        })
    }
}
