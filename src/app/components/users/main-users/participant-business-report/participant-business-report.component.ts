import { CommonModule, Location } from '@angular/common'
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { camelCase, capitalize } from 'lodash'
import * as moment from 'moment'
import { NgCircleProgressModule } from 'ng-circle-progress'
import { QrCodeModule } from 'ng-qrcode'
import { ButtonModule } from 'primeng/button'
import { catchError, map } from 'rxjs/operators'
import { ReportLoadingOverlayComponent } from 'src/app/components/common/report-loading-overlay/report-loading-overlay.component'
import { DashboardServiceService } from 'src/app/components/dashboard/dashboard-service.service'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { buildChatPayloadData, buildWorkTalentsInsights, disableWonderchat, enableWonderchat, shortenYoutubeUrl } from 'src/app/util/utils'
import { ChatbotComponent } from '../../../chatbot/chatbot.component'
import { MainUsersService } from '../../main-users.service'
import { DiscoveryIncompleteModalComponent } from '../discovery-incomplete-modal/discovery-incomplete-modal.component'
import {
    discoveryStatusResolvedAction,
    getCareersInsights,
    getCareersInsightsSuccess,
    getCustomReportNameAction,
    getCustomReportNameSuccessAction,
    getEnvironmentKeys,
    getEnvironmentKeysSuccess,
    getFactorRelationshipAction,
    getFactorRelationshipActionSuccess,
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
    selector: 'app-participant-business-report',
    templateUrl: './participant-business-report.component.html',
    styleUrls: ['./participant-business-report.component.scss'],
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
export class ParticipantBusinessReportComponent implements OnInit, OnDestroy {
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
    footerDate: any
    footerYear: any
    participantName: any
    isDigitalScan: boolean
    isLoading: any
    tScoreLoading: boolean
    uniqueStyleAndDescription: any
    dashboardBDNASetting: any
    performanceGuide: any
    videoUrl: any
    scoreBDNA5: any
    scoreBDNAObj: any
    uniqueStyleVideo: string
    discoveryDto: any
    showCard: any = {
        video: true,
        performanceKeys: true,
        report: true,
        careerInsights: false,
        workTalents: false, // only in Talent case,
    }
    reportColor: any
    reportName = 'Work Talent'
    environmentKeysData: any = []
    strugglesData: any[] = []
    strengthsData: any[] = []
    traitsDescription: any = []
    firstTraitKey = ''
    secondTraitKey = ''
    firstTraitKeyHeading = ''
    secondTraitKeyHeading = ''
    top2Traits: string[] = []
    factorRelationships: any = []
    factorRelationShipName: any

    get uniqueStyleImages() {
        return this.reportShared.uniqueStyleImages
    }

    isDownloadReady: boolean = false
    pageNumber = 7
    canvasPrepared = false
    vowels: any = ['a', 'e', 'i', 'o', 'u']
    word = ''
    careerInsightsData: any
    coachingReportTraits: any = {}
    pageNumberMap = new Map()
    chat_payload_data: any = {}
    workTalentsInsights: { [key: string]: string } = {}
    progressPercentage = 0
    bdnaUniqueStyleVideos: { [key: string]: string } = {}
    desiredTeamRoles: any[] = []
    desiredWorkEnvironment: any[] = []
    desiredWorkRewards: any[] = []

    constructor(
        private store: Store<{ bdnaReportReducer: any; mainUserReducer: any }>,
        private _location: Location,
        private actions: Actions,
        private router: Router,
        private msgService: MsgService,
        private mixpanelService: MixpanelService,
        private route: ActivatedRoute,
        private userService: MainUsersService,
        private dashboardService: DashboardServiceService,
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
            this.reportColor = this.secondaryColor
        } else {
            this.reportColor = this.primaryColor
        }

        disableWonderchat()

        this.mixpanelService.track('Participant business report Viewed', {
            ...this.user_object,
            discoveryType: 'Talent',
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
        if (this.discoveryDto) {
            localStorage.setItem('discoverySettings', JSON.stringify(this.discoveryDto))
            localStorage.setItem('participantName', this.participantName)
            localStorage.setItem('isDigitalScan', this.isDigitalScan.toString())
        }

        let personId = ''
        this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap: any) => {
            const params = paramMap.params
            personId = params.selectedParticipants
        })
        // getEnvironmentKeys's effect was already correctly migrated - it gates on `body.data` and
        // delivers real data - but this handler still branched on `body.statusCode`, which never
        // exists, so it fell into neither case and silently discarded good data. Fixed to match
        // the effect (D3/D4/D6 - see REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md).
        this.actions.pipe(ofType(getEnvironmentKeysSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ environmentKeysPayload }) => {
            if (!environmentKeysPayload?.body?.data) return
            this.environmentKeysData = environmentKeysPayload.body.data.environmentKeys
            this.strugglesData = environmentKeysPayload.body.data.struggles
            this.strengthsData = environmentKeysPayload.body.data.strengths
        })
        // careersInsights's effect has no validity gate of its own (main-users-reports.effects.ts)
        // and passes through real data unconditionally on success - `careerInsightsData` was the
        // only field gated behind the dead `body.statusCode` field here (D4/D6).
        // getCareersInsights's effect attaches `error` on any failure and dispatches
        // `careersInsightsPayload: undefined` - ApiErrorNotificationEffects toasts it globally
        // (notify: true). Classified on `.body.data` presence, not the dead `.status` gate.
        this.actions.pipe(ofType(getCareersInsightsSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ careersInsightsPayload }) => {
            if (!careersInsightsPayload?.body?.data) return
            this.desiredTeamRoles = careersInsightsPayload.body.data.roles
            this.desiredWorkEnvironment = careersInsightsPayload.body.data.environments
            this.desiredWorkRewards = careersInsightsPayload.body.data.rewards
            this.careerInsightsData = careersInsightsPayload.body.data.talents
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
            if (!this.canvasPrepared) {
                this.isDownloadReady = false
                setTimeout(() => {
                    this.prepareCanvas() //wait for the data to be downloaded from the server
                }, 10000)
                this.canvasPrepared = true
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
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((state) => {
                this.isLoading =
                    state.isUniqueStyleLoading ||
                    state.isDashboardBDNASettingLoading ||
                    state.isPerformanceGuideLoading ||
                    state.isVideoUrlLoading ||
                    state.isScoreBDNA5Loading ||
                    state.isCareerInsightsLoading ||
                    state.getWorkTalentsLoading

                this.tScoreLoading = state?.getTScoreLoading

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
                    twoStrongestTraits: [state?.tScorePaylaod?.data?.strogestFactors?.[0], state?.tScorePaylaod?.data?.strogestFactors?.[1]],
                    description_data: state?.uniqueStyleAndDescription?.data,
                    tScoreData: state?.tScorePaylaod?.data?.tscore,
                    personName: state?.tScorePaylaod?.data?.firstName,
                    reportType: 'Participant Business Report',
                    workTalentsInsights: this.workTalentsInsights,
                }
                this.chat_payload_data = buildChatPayloadData(payloadData)

                this.uniqueStyleAndDescription = state.uniqueStyleAndDescription?.data

                if (this.vowels.includes(this.uniqueStyleAndDescription?.behaviorTypeName[0].toLowerCase())) {
                    this.word = 'An'
                } else {
                    this.word = 'A'
                }

                this.dashboardBDNASetting = state.dashboardBDNASettingData?.data

                this.performanceGuide = state.environmentKeysPayload?.data
                this.videoUrl = state.videoUrlData?.data
                // this.scoreBDNA5 = state.scoreBDNA5Data?.data;
                this.scoreBDNAObj = state.workTalentsPayload?.data

                this.careerInsightsData = state.careersInsightsPayload?.data?.talents

                this.discoveryDto = localStorage.getItem('discoverySettings') || ''
                this.participantName = localStorage.getItem('participantName') || ''
                this.isDigitalScan = localStorage.getItem('isDigitalScan') === 'true'
                if (this.discoveryDto) this.discoveryDto = JSON.parse(this.discoveryDto)
                this.showCard = {
                    workTalents: this.discoveryDto?.isBDNA5KeyWorkTalents,
                    careerInsights: this.discoveryDto?.isDesiredTaskBasedTalent,
                    performanceKeys: this.discoveryDto?.isPGuide,
                    video: this.discoveryDto?.isVideo,
                    topTraits: this.discoveryDto?.topTraits,
                }

                localStorage.setItem('discoveryDto', JSON.stringify(this.discoveryDto))
                if (!this.isLoading) {
                    this.scoreBDNA5 = this.dashboardService.parseFDNAandBDNAObjects(this.scoreBDNAObj)
                    this.scoreBDNA5?.map((talent: any) => {
                        talent['titleSparsed'] = talent?.title?.split(' ')
                    })
                    // Use the unique style name to get the video URL
                    const uniqueStyleName = this.uniqueStyleAndDescription?.behaviorTypeName
                    if (uniqueStyleName) {
                        const videoUrl = this.bdnaUniqueStyleVideos[uniqueStyleName]
                        this.uniqueStyleVideo = shortenYoutubeUrl(videoUrl)
                    }
                    // Only prepare canvas if not already done via getTScoreActionSuccess
                    if (!this.canvasPrepared && this.reportName) {
                        this.setPageNumber()
                        setTimeout(() => {
                            this.prepareCanvas()
                        }, 2000)
                        this.canvasPrepared = true
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
        this.store.dispatch(getUniqueStyleAndDescriptionAction(personId, this.langId))
        this.store.dispatch(
            getCustomReportNameAction({
                accountId: this.accountId,
                reportId: K.APP.REPORTS.WORK_TALENT_REPORT_ID,
            })
        )
        this.store.dispatch(getEnvironmentKeys(personId, this.langId))
        this.store.dispatch(getVideoUrlAction(personId))
        this.store.dispatch(getWorkTalentsAction(personId, this.langId))
        this.store.dispatch(getCareersInsights(personId))
        // Add tScore API call
        this.store.dispatch(getTScoreAction(personId))
        this.store.dispatch(getFactorRelationshipAction())
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
            .getBDNAUniqueStyleVideoLinks()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((response: any) => {
                    if (response?.status === 200) {
                        const videoMap: { [key: string]: string } = {}
                        response.body.value.forEach((item: any) => {
                            videoMap[item.UniqueStyle] = item.videoURL
                        })
                        this.bdnaUniqueStyleVideos = videoMap
                    }
                }),
                catchError((error) => {
                    console.error('Error fetching BDNA video links:', error)
                    this.msgService.errorMessage('Error loading BDNA video links')
                    return ''
                })
            )
            .subscribe()
    }

    onBack() {
        this._location.back()
    }

    setBrandLogo() {
        this.reportShared.getBrandLogo$(this.userService).subscribe((logo) => {
            this.logo = logo
        })
    }
    canvasData: any[] = []
    pdf: any
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

        this.mixpanelService.track('Participant business report Downloaded', {
            ...this.user_object,
            reportType: 'Work Talents Report',
        })
        this.pdf.save(this.reportFileName)
    }

    loadText() {
        return this.reportShared.loadText(this.canvasData.length)
    }
    getCurrentUniqueStyleImage(): string {
        return this.reportShared.getUniqueStyleImage(this.uniqueStyleAndDescription?.behaviorTypeName)
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
                this.loadReportData(personId)
            } else {
                this.discoveryIncomplete = true
            }
        })
    }
}
