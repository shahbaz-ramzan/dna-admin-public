import { CommonModule, Location } from '@angular/common'
import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Store } from '@ngrx/store'
import { ButtonModule } from 'primeng/button'
import { ReportLoadingOverlayComponent } from 'src/app/components/common/report-loading-overlay/report-loading-overlay.component'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import { ChatbotComponent } from '../../../../chatbot/chatbot.component'
import { ArticlePipe } from './article.pipe'
import { SalesCareerInsightComponent } from './charts/sales-career-insight/sales-career-insight.component'
import { WorkplaceInsightComponent } from './charts/workplace-insight/workplace-insight.component'

import {
    discoveryStatusResolvedAction,
    getHiringDataAction,
    getHiringDataActionSuccess,
    getSalesInsightsAction,
    getSalesInsightsActionSuccess,
    getTraitsDescriptionAction,
    getTraitsDescriptionActionSuccess,
    getTScoreAction,
    getTScoreActionSuccess,
    getUniqueStyleAction,
    getUniqueStyleAndDescriptionAction,
    getUniqueStyleAndDescriptionActionSuccess,
    getUniqueStyleDescriptionAction,
    getUniqueStyleDescriptionActionSuccess,
    getWorkPlaceInsight,
    getWorkPlaceInsightSuccess,
    getWorkTalentsAction,
} from '../../mainUserStore/main-users.actions'

import { Actions, ofType } from '@ngrx/effects'
import { DashboardServiceService } from 'src/app/components/dashboard/dashboard-service.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { camelCase, capitalize } from 'lodash'
import { buildChatPayloadData, buildWorkTalentsInsights, disableWonderchat, enableWonderchat } from 'src/app/util/utils'
import { MainUsersService } from '../../../main-users.service'
import { DiscoveryIncompleteModalComponent } from '../../discovery-incomplete-modal/discovery-incomplete-modal.component'
import { selectMainUserState } from '../../mainUserStore/main-users.selectors'
import { buildReportFileName, formatPersonName } from '../../report-file-name.util'

@Component({
    selector: 'app-sales-report',
    templateUrl: './sales-report.component.html',
    styleUrl: './sales-report.component.css',
    standalone: true,
    imports: [
        DiscoveryIncompleteModalComponent,
        CommonModule,
        ButtonModule,
        ChatbotComponent,
        ReportLoadingOverlayComponent,
        ArticlePipe,
        SalesCareerInsightComponent,
        WorkplaceInsightComponent,
    ],
})
export class SalesReportComponent implements OnInit, OnDestroy {
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

    isDownloadReady: boolean = false
    pageNumber = 6
    canvasPrepared = false
    vowels: any = ['a', 'e', 'i', 'o', 'u']
    word = ''
    reportName = 'Sales Talent DNA'
    firstBiaseName = ''
    secondBiaseName = ''
    canvasData: any[] = []
    pdf: any

    pageNumberMap = new Map()
    personId: string

    salesInsights: any = []
    workplaceInsights: any = []
    bdnaWorkplaceInsights: any = {}
    hiringData: any = {
        talents: [],
        roles: [],
        rewards: [],
    }
    top2Traits: string[] = []
    firstTraitKey = ''
    secondTraitKey = ''
    traitsDescription: any[] = []
    uniqueStyle = ''
    uniqueStyleDescriptions: any = {}
    chat_payload_data: any = {}
    workTalentsInsights: { [key: string]: string } = {}
    progressPercentage = 0

    constructor(
        private store: Store<{
            fdnaReportReducer: any
            mainUserReducer: any
        }>,
        private _location: Location,
        private dashboardService: DashboardServiceService,
        private mixpanelService: MixpanelService,
        private actions: Actions,
        private msgService: MsgService,
        private userService: MainUsersService,
        private route: ActivatedRoute
    ) {
        this.listenDiscoveryStatus()
        this.accountId = Encryption.decryptData(localStorage.getItem('accountId') || '')
        this.selfRegId = localStorage.getItem('registrationId')

        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        this.user_object = JSON.parse(this.user_object)

        const _now = new Date()
        this.footerYear = _now.getFullYear().toString()
        const _day = ('0' + _now.getDate()).slice(-2)
        const _month = _now.toLocaleString('en-US', { month: 'short' })
        const _year2 = _now.getFullYear().toString().slice(-2)
        this.footerDate = `${_day}-${_month}-${_year2}`

        this.primaryColor = localStorage.getItem('primaryColor')
        this.secondaryColor = localStorage.getItem('secondaryColor')
        document.documentElement.style.setProperty(`--primary-color`, this.primaryColor)
        document.documentElement.style.setProperty(`--secondary-color`, this.secondaryColor)

        if (this.primaryColor === K.APP.DEFAULT_PRIMARY_COLOR) {
            this.reportColor = this.secondaryColor
            this.secondaryColor = this.primaryColor
        } else {
            this.reportColor = this.primaryColor
        }
        this.mixpanelService.track('Sales talent report Viewed', {
            ...this.user_object,
            discoveryType: 'Investor',
        })
        disableWonderchat()
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

        // const currentDate = moment().format('DD-MM-YYYY')
        this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap: any) => {
            const params = paramMap.params
            this.personId = params.selectedParticipants
        })
        // getTraitsDescription's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally (notify: true).
        // Classified on `.body.value` presence, not the dead `.status` gate.
        this.actions.pipe(ofType(getTraitsDescriptionActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.value) return
            this.traitsDescription = response.body.value
            this.firstTraitKey = capitalize(this.top2Traits[0][0]) + camelCase(this.top2Traits[0]).substring(1)
            this.secondTraitKey = capitalize(this.top2Traits[1][0]) + camelCase(this.top2Traits[1]).substring(1)
        })
        // getUniqueStyleDescription's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally (notify: true).
        // Classified on `.body.value` presence, not the dead `.status` gate.
        this.actions.pipe(ofType(getUniqueStyleDescriptionActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.value) return
            const uniqueStyleInPascalCase = capitalize(this.uniqueStyle[0]) + camelCase(this.uniqueStyle).substring(1)
            this.uniqueStyleAndDescription = response.body.value[2][uniqueStyleInPascalCase]
        })
        // getUniqueStyleDetails's effect has no gate of its own and passes through real data on
        // success - its OTHER consumers (single/double-user-selection.component.ts) already
        // correctly read the real transport `.status`, not a body field. Matched here (D3/D4/D6 -
        // see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md).
        this.actions.pipe(ofType(getUniqueStyleAndDescriptionActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ uniqueStyleAndDescription }) => {
            if (uniqueStyleAndDescription?.status !== 200) return
            this.uniqueStyle = uniqueStyleAndDescription.body.data.behaviorTypeName || ''
            if (this.uniqueStyle) {
                this.store.dispatch(getUniqueStyleDescriptionAction())
            }
        })
        // getSalesInsights's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally. Classified on
        // `body.data` presence, not `body.statusCode` (D1/D4/D6).
        this.actions.pipe(ofType(getSalesInsightsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.data) return
            this.salesInsights = Object.entries(response.body.data)
                .map(([key, value]) => [key, value])
                .filter(([_, value]) => typeof value === 'number')
                .sort((a: any, b: any) => b[1] - a[1])
        })
        // workPlaceInsightData's effect has no gate of its own and passes through real data on
        // success - matched here on `body.data` presence rather than a dead `body.statusCode`
        // field (D3/D4/D6).
        this.actions.pipe(ofType(getWorkPlaceInsightSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ workPlaceInsightPayload }) => {
            if (!workPlaceInsightPayload?.body?.data) return
            this.workplaceInsights = [...workPlaceInsightPayload.body.data.insight].sort((a: any, b: any) => b.population - a.population)
        })
        // getHiringData's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally. Classified on
        // `body.data` presence, not `body.statusCode` (D1/D4/D6).
        this.actions.pipe(ofType(getHiringDataActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.data) return
            // Reset before repopulating - this handler can now fire more than once for the same
            // dispatch (cache-hit followed by a background-refresh-with-changed-data emission),
            // and these arrays were previously only ever pushed to once.
            this.hiringData.talents = []
            this.hiringData.rewards = []
            this.hiringData.roles = []
            const talents = response.body.data.talents
            Object.values(talents).forEach((t: any) => {
                this.hiringData.talents.push({ id: t.id, name: t.name })
            })
            const rewards = response.body.data.rewards
            Object.values(rewards).forEach((t: any) => {
                this.hiringData.rewards.push({ id: t.id, name: t.name })
            })
            const roles = response.body.data.roles
            Object.values(roles).forEach((t: any) => {
                this.hiringData.roles.push({ id: t.id, name: t.name })
            })
        })
        // tScoreData's effect attaches `error` on any failure and dispatches `tScorePaylaod:
        // undefined` - ApiErrorNotificationEffects toasts it globally (notify: true). Classified
        // on `.body.data` presence, not the dead `.status` gate.
        this.actions.pipe(ofType(getTScoreActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ tScorePaylaod }) => {
            if (!tScorePaylaod?.body?.data) return
            this.top2Traits = tScorePaylaod.body.data.strogestFactors
            this.store.dispatch(getTraitsDescriptionAction())
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
                    state.getUniqueStyleDescLoading ||
                    state.getTraitsDescLoading ||
                    state.getHiringDataLoading ||
                    state.getSalesInsightsLoading ||
                    state.getWorkTalentsLoading

                if (this.vowels.includes(this.uniqueStyleAndDescription?.behaviorTypeName?.at(0).toLowerCase())) {
                    this.word = 'An'
                } else {
                    this.word = 'A'
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
                    reportType: 'Sales Talent Report',
                    workTalentsInsights: this.workTalentsInsights,
                }

                this.chat_payload_data = buildChatPayloadData(payloadData)

                this.dashboardFDNASetting = state.dashboardFDNASettingData?.data
                this.performanceGuide = state.environmentKeysPayload?.data
                this.videoUrl = state.videoUrlData?.data
                this.scoreFDNAObj = state.FDNAScorePayload?.data

                this.marketMood = state.marketMoodData?.data
                this.behavioralBiases = state.behaviralBiasesPayload?.data?.behavioralBiasList
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
                    marketMood: this.discoveryDto?.isMarketMood,
                    fbInsights: this.discoveryDto?.isFDNA5Score,
                    bBiases: this.discoveryDto?.isBehavioralBiases,
                }
                if (!this.isLoading) {
                    this.behavioralBiases = this.dashboardService.parseBehaviorBiasesList(this.behavioralBiases)
                    this.firstBiaseName = this.behavioralBiases[0]?.name
                    this.biasesVideo.firstBiase = K.APP.BEHAVIORAL_BIASES_VIDEOS[this.firstBiaseName]
                    this.secondBiaseName = this.behavioralBiases[1]?.name
                    this.biasesVideo.secondBiase = K.APP.BEHAVIORAL_BIASES_VIDEOS[this.secondBiaseName]
                    this.marketMood = {
                        ...this.marketMood,
                        marketMoodDescriptions: this.dashboardService.removeBoldTagFromMoodData(this.marketMood?.marketMoodDescriptions),
                    }
                    if (!this.canvasPrepared && this.reportName) {
                        this.setPageNumber()
                        this.prepareCanvas()
                        this.canvasPrepared = true
                    }
                }
            })

        // Last, so every response listener above is subscribed before any request is made - see
        // loadReportData().
        this.checkDiscoveryStatus(this.personId)
    }

    // Every API call this report makes - only reached once Discovery/GetUniqueStyle confirms the
    // participant has completed Discovery (or the check itself failed). Response listeners and store
    // subscriptions stay in ngOnInit so the template's state is initialized either way.
    private loadReportData() {
        if (this.reportDataLoaded) return
        this.reportDataLoaded = true
        this.store.dispatch(getUniqueStyleAndDescriptionAction(this.personId, this.langId))
        this.store.dispatch(getSalesInsightsAction(this.personId))
        this.store.dispatch(getHiringDataAction(this.personId))
        this.store.dispatch(getTScoreAction(this.personId))
        this.store.dispatch(getWorkPlaceInsight(this.personId, '22'))
        // Add work talents API call for dynamic insights
        this.store.dispatch(getWorkTalentsAction(this.personId, this.langId))
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
    onBack() {
        this._location.back()
    }

    async prepareCanvas() {
        this.isDownloadReady = false
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
            this.progressPercentage = Math.round((i / this.pageNumber) * 100)
        }
        this.pdf.deletePage(1)
        this.isDownloadReady = true
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
        this.mixpanelService.track('Sales talent report Downloaded', {
            ...this.user_object,
            reportType: 'Sales Talent DNA Report',
        })
        this.pdf.save(this.reportFileName)
    }

    loadText() {
        const dotCount = 1 + (this.canvasData.length % 3)
        const text = 'Preparing Download' + '.'.repeat(dotCount)
        return text
    }

    getPrimaryColor(condition: boolean) {
        return { backgroundColor: condition ? this.primaryColor : '', color: condition ? 'white' : '' }
    }

    ngOnDestroy() {
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
                this.loadReportData()
            } else {
                this.discoveryIncomplete = true
            }
        })
    }
}
