import { CommonModule, Location } from '@angular/common'
import { Component, DestroyRef, inject, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Store } from '@ngrx/store'
import * as Highcharts from 'highcharts'
import * as moment from 'moment'
import { NgCircleProgressModule } from 'ng-circle-progress'
import { QrCodeModule } from 'ng-qrcode'
import { ButtonModule } from 'primeng/button'
import { ReportLoadingOverlayComponent } from 'src/app/components/common/report-loading-overlay/report-loading-overlay.component'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'
import { ChatbotComponent } from '../../../../chatbot/chatbot.component'
import {
    discoveryStatusResolvedAction,
    getBehaviralBiases,
    getCoachingReportAction,
    getCoachingReportActionSuccess,
    getEnvironmentKeys,
    getFactorRelationshipAction,
    getFactorRelationshipActionSuccess,
    getHiringDataAction,
    getHiringDataActionSuccess,
    getParticipantsDetailAction,
    getParticipantsDetailFailureAction,
    getParticipantsDetailSuccessAction,
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
import { BehaviralBiasesComponent } from '../behaviral-biases/behaviral-biases.component'
import { ArticlePipe } from '../sales-report/article.pipe'
import { WorkplaceInsightComponent } from '../sales-report/charts/workplace-insight/workplace-insight.component'
import { AzureCoachingDataPipe } from './azure-coaching-data.pipe'
import { MainSectionNumberPipe } from './main-section-number.pipe'

import { Actions, ofType } from '@ngrx/effects'
import { forkJoin } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { DashboardServiceService } from 'src/app/components/dashboard/dashboard-service.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import { Color, Label } from 'src/app/util/interfaces'

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { camelCase, capitalize } from 'lodash'
import { buildChatPayloadData, buildWorkTalentsInsights, disableWonderchat, enableWonderchat, shortenYoutubeUrl } from 'src/app/util/utils'
import { MainUsersService } from '../../../main-users.service'
import { DiscoveryIncompleteModalComponent } from '../../discovery-incomplete-modal/discovery-incomplete-modal.component'
import { SUCCESS_BEHAVIRAL_BIASES_ACTION } from '../../mainUserStore/main-users-actions-constants'
import { selectMainUserState } from '../../mainUserStore/main-users.selectors'
import { buildReportFileName, formatPersonName } from '../../report-file-name.util'
import { TScoresComponent } from '../t-scores/t-scores.component'
import {
    calculateTotalPages,
    getDisplayPageNumber as getDisplayPageNumberUtil,
    getSectionNumber as getSectionNumberUtil,
    isBDNAPage as isBDNAPageUtil,
    isFDNAPage as isFDNAPageUtil,
} from './coaching-report-pagination.util'
import { CoachingReportPdfExportService } from './coaching-report-pdf-export.service'
import { CoachingReportTScoreChartService } from './coaching-report-t-score-chart.service'

@Component({
    selector: 'app-coaching-report',
    templateUrl: './coaching-report.component.html',
    styleUrl: './coaching-report.component.css',
    standalone: true,
    imports: [
        DiscoveryIncompleteModalComponent,
        CommonModule,
        ButtonModule,
        NgCircleProgressModule,
        QrCodeModule,
        ChatbotComponent,
        ReportLoadingOverlayComponent,
        TScoresComponent,
        BehaviralBiasesComponent,
        WorkplaceInsightComponent,
        ArticlePipe,
        AzureCoachingDataPipe,
        MainSectionNumberPipe,
    ],
})
export class CoachingReportComponent {
    private destroyRef = inject(DestroyRef)
    discoveryIncomplete = false
    private discoveryCheckPersonId = ''
    private reportDataLoaded = false
    // Names for the downloaded PDF's file name - see reportFileName.
    private reportOwnerName = ''
    private navigationParticipantName = ''
    @ViewChild(TScoresComponent) tScoreComponent: TScoresComponent

    langId: any = K.APP.LANGUAGE_ID
    accountId: any
    selfRegId: any
    user_object: any
    logo: any
    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    secondaryColor: any = '#1a3462'
    isDigitalScan: boolean
    primaryColor: any
    participantName: string
    footerYear: string
    footerDate: string
    reportColor: any
    pieChartColors: Color[]
    chartLabels: string[] = [
        'Influencer',
        'Engager',
        'Community Builder',
        'Relationship Builder',
        'Facilitator',
        'Adapter',
        'Stylish Thinker',
        'Reflective Thinker',
        'Strategist',
        'Initiator',
    ]
    chartPosition: string = 'bottom'
    chartLagendsStyle: boolean = true
    boxSize: number = 6
    showLegends: boolean = true
    width: number = 700
    height: number = 345
    chartValues: number[] = new Array(10).fill(10) // Equal values for all segments
    chartColors: any[] = [{}]
    idSingle = 'single'

    isLoading: any
    uniqueStyleAndDescription: any
    dashboardFDNASetting: any
    performanceGuide: any
    videoUrl: any
    scoreFDNAObj: any
    scoreFDNA5: any[] = []

    uniqueStyleVideo: string = 'https://kb.dnabehavior.com/gene/dnabuniquestylevideolibrary'
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
    pageNumber = 47
    canvasPrepared = false
    vowels: any = ['a', 'e', 'i', 'o', 'u']
    word = ''
    reportName = 'Coaching Report'
    firstBiaseName = ''
    secondBiaseName = ''
    canvasData: any[] = []
    pdf: any

    pageNumberMap = new Map()
    personId: string
    chat_payload_data: any = {}

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
    firstTraitKeyHeading = ''
    secondTraitKeyHeading = ''
    traitsDescription: any = []
    coachingReportTraits: any = {}
    uniqueStyle = ''
    uniqueStyleDescriptions: any = {}
    tScoreChartData: any = [
        {
            name: '',
            data: [],
            color: this.secondaryColor2,
        },
    ]
    index = 1
    id: string = this.idSingle.concat(this.index.toString())
    workTalentsObject: {
        value: number
        comparison1: string
        comparison2: string
        description: string
        label: string
    }[] = []
    workTalentsInsights: { [key: string]: string } = {}
    bdnaUniqueStyleVideos: any = {}
    fdnaUniqueStyleVideos: any = {}

    indexs: string[] = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
    tScoreCharts: (Highcharts.Chart | undefined)[] = new Array(8).fill(undefined)

    finalChartData1: any = []

    chartData: any = [
        {
            name: '',
            data: [],
            color: this.secondaryColor,
        },
    ]
    leftLabels: Label[] = []

    rightLabels: Label[] = []

    bgColor: any = '#ffffff'

    coachingReportAzureData: any = []
    factorRelationships: any = []

    uniqueStyleName: any

    behaviralBiasesObject: any = {
        datasets: [
            {
                barPercentage: 0.7,
                categoryPercentage: 40,
                label: '',
                data: [],
            },
        ],
    }
    behavioralBiasesColor: Color[] = []
    behaviralBiasesLoading: boolean
    tScoreLoading: boolean
    factorRelationShipName: any
    uniqueStyleImages: any = {
        Influencer: '../../../../../../assets/images/Unique_Style_images/1 Influencer.svg',
        Engager: '../../../../../../assets/images/Unique_Style_images/2 Engager.svg',
        'Community Builder': '../../../../../../assets/images/Unique_Style_images/3 CommunityBuilder.svg',
        'Relationship Builder': '../../../../../../assets/images/Unique_Style_images/4 RelationshipBuilder.svg',
        Facilitator: '../../../../../../assets/images/Unique_Style_images/5 Facilitator.svg',
        Adapter: '../../../../../../assets/images/Unique_Style_images/6 Adapter.svg',
        'Stylish Thinker': '../../../../../../assets/images/Unique_Style_images/7 StylishThinker.svg',
        'Reflective Thinker': '../../../../../../assets/images/Unique_Style_images/9 ReflectiveThinker.svg',
        Strategist: '../../../../../../assets/images/Unique_Style_images/10 Strategist.svg',
        Initiator: '../../../../../../assets/images/Unique_Style_images/11 Initiator.svg',
    }
    isBDNA: any
    isFDNA: any
    progressPercentage: number = 0

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
        private tScoreChartService: CoachingReportTScoreChartService,
        private pdfExportService: CoachingReportPdfExportService
    ) {
        this.listenDiscoveryStatus()
        this.pieChartColors = [
            {
                backgroundColor: ['#DBF9DB', '#DBF9DB', '#DBF9DB', '#DBF9DB', '#227442'],
                pointBackgroundColor: ['#E05534', '#E5E5E5', '#EEAD32', '#2E9B66'],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: ['#E05534', '#E5E5E5', '#EEAD32', '#2E9B66'],
            },
        ]
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

        this.chartData = [
            {
                name: '',
                data: [],
                color: this.secondaryColor,
            },
        ]
        this.tScoreChartData = [
            {
                name: '',
                data: [],
                color: this.secondaryColor2,
            },
        ]

        if (this.primaryColor === K.APP.DEFAULT_PRIMARY_COLOR) {
            this.secondaryColor2 = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
            this.reportColor = this.secondaryColor2
        } else {
            this.secondaryColor2 = localStorage.getItem('secondaryColor')
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
        this.leftLabels = K.APP.SUB_FACTORS_LEFT_LABELS
        this.rightLabels = K.APP.SUB_FACTORS_RIGHT_LABELS
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
        this.isBDNA = history.state.selectedOptions?.some((el: any) => el?.key === 'bdna')
        this.isFDNA = history.state.selectedOptions?.some((el: any) => el?.key === 'fdna')
        this.calculatePageNumbers()

        if (history.state.discoverySettings) {
            localStorage.setItem('discoverySettings', JSON.stringify(this.discoveryDto))
            localStorage.setItem('participantName', this.participantName)
        }

        this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap: any) => {
            const params = paramMap.params
            this.personId = params.selectedParticipants
        })
        this.actions.pipe(ofType(SUCCESS_BEHAVIRAL_BIASES_ACTION), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            if (response?.behaviralBiasesPayload) {
                this.behaviralBiasesObject.datasets[0].data = []
                const biases_list: any = [response?.behaviralBiasesPayload?.body?.data?.behavioralBiasList]

                biases_list[0]?.forEach((element: any) => {
                    this.behaviralBiasesObject?.datasets[0]?.data?.push(element?.population)
                })
            }
        })
        // getParticipantsDetailSuccessAction is a global action type - any component that
        // dispatches getParticipantsDetailAction fires this subscribe too, so a response for a
        // different person must be ignored (see the same fix and full explanation in
        // login.component.ts). Classified on `body.data` presence, not `body.statusCode` (that
        // field doesn't exist on any response anymore - it was always mislabeling real successes
        // as "Failed" in Mixpanel).
        this.actions.pipe(ofType(getParticipantsDetailFailureAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ error }) => {
            console.log('[Mixpanel test] Get Participant Details Failed payload:', {
                accountID: this.accountId,
                errorMessage: error,
            })
            this.mixpanelService.track('Get Participant Details Failed', {
                accountID: this.accountId,
                errorMessage: error,
            })
        })
        this.actions.pipe(ofType(getParticipantsDetailSuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            const participantDetail = response?.body?.data?.[0]
            if (participantDetail && participantDetail.personId !== this.personId) return

            if (participantDetail) {
                this.mixpanelService.track('Get Participant Details Success', {
                    accountID: this.accountId,
                    participantDetail: participantDetail,
                })
            }
        })
        // getTraitsDescription's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally (notify: true).
        // Classified on `response.body.value` presence, not the dead `response.status` gate -
        // reaching here with no body would throw on a `.value` read otherwise.
        this.actions.pipe(ofType(getTraitsDescriptionActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.value) return
            this.traitsDescription = response.body.value
            this.firstTraitKey = capitalize(this.top2Traits[0][0]) + camelCase(this.top2Traits[0]).substring(1)
            this.secondTraitKey = capitalize(this.top2Traits[1][0]) + camelCase(this.top2Traits[1]).substring(1)
            this.firstTraitKeyHeading = this.top2Traits[0]
            this.secondTraitKeyHeading = this.top2Traits[1]
        })
        // getCoachingReportData's effect attaches `error` on any failure and dispatches
        // `coachingReportTableData: undefined` - ApiErrorNotificationEffects toasts it globally
        // (notify: true). Classified on `.body.value` presence, not the dead `.status` gate.
        this.actions.pipe(ofType(getCoachingReportActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ coachingReportTableData }) => {
            if (!coachingReportTableData?.body?.value) return
            this.coachingReportAzureData = coachingReportTableData.body.value
        })
        // getFactorRelationship's effect attaches `error` on any failure and dispatches
        // `response: undefined` - ApiErrorNotificationEffects toasts it globally (notify: true).
        // Classified on `.body.value` presence, not the dead `.status` gate.
        this.actions.pipe(ofType(getFactorRelationshipActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body?.value) return
            this.factorRelationships = response.body.value
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
                this.updateChartColors()
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
            this.createTScoreGraph()
            this.tScoreComponent.createTScoreGraph()
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
                    state.getCoachingReprtLoading ||
                    state.getFactorRelationshipLoading

                this.tScoreLoading = state?.getTScoreLoading

                if (this.vowels.includes(this.uniqueStyleAndDescription?.behaviorTypeName?.at(0).toLowerCase())) {
                    this.word = 'An'
                } else {
                    this.word = 'A'
                }

                // Process work talents data FIRST to build insights
                if (state?.workTalentsPayload?.data != undefined) {
                    const workTalentsData = state?.workTalentsPayload?.data

                    // Build work talents insights
                    this.workTalentsInsights = buildWorkTalentsInsights(workTalentsData)

                    this.workTalentsObject = []
                    this.workTalentsObject.push({
                        value: workTalentsData?.resultsVsRelationships.value,
                        comparison1: 'Results',
                        comparison2: 'Relationships',
                        description: workTalentsData?.resultsVsRelationships.description,
                        label: workTalentsData?.resultsVsRelationships.label,
                    })
                } else if (!Object.keys(this.workTalentsInsights).length) {
                    this.workTalentsObject = []
                    this.workTalentsInsights = buildWorkTalentsInsights(null)
                }

                // Process TScore data
                if (state?.tScorePaylaod?.data != undefined) {
                    const tscoreData = state?.tScorePaylaod?.data?.tscore
                    this.chartData[0].name = state?.tScorePaylaod?.data?.firstName
                    this.chartData[0].data = this.changeTScoreData(tscoreData)
                    this.tScoreChartData[0].name = ''
                    this.tScoreChartData[0].data = this.changeTScoreData(tscoreData)
                } else {
                    this.tScoreChartData[0].name = ''
                    this.tScoreChartData[0].data = []
                }

                // Build chat payload whenever we have TScore data (regardless of when work talents arrive)
                if (state?.tScorePaylaod?.data != undefined) {
                    const payloadData = {
                        twoStrongestTraits: [state?.tScorePaylaod?.data?.strogestFactors[0], state?.tScorePaylaod?.data?.strogestFactors[1]],
                        description_data: state?.uniqueStyleAndDescription?.data,
                        tScoreData: state?.tScorePaylaod?.data?.tscore,
                        personName: state?.tScorePaylaod?.data?.firstName,
                        reportType: 'Coaching Report',
                        workTalentsInsights: this.workTalentsInsights, // Always use current insights
                    }
                    this.chat_payload_data = buildChatPayloadData(payloadData)
                }
                this.behaviralBiasesObject.datasets[0].label = ''

                this.behavioralBiasesColor = [{ backgroundColor: this.secondaryColor2 }]
                this.behaviralBiasesLoading = state?.getBehaviralBiasesLoading

                this.dashboardFDNASetting = state.dashboardFDNASettingData?.data
                this.performanceGuide = state.environmentKeysPayload?.data
                this.videoUrl = state.videoUrlData?.data
                this.scoreFDNAObj = state.FDNAScorePayload?.data
                this.uniqueStyleName = this.uniqueStyle.replace(/\s+/g, '')

                if (this.top2Traits?.length && this.factorRelationships?.length) {
                    this.factorRelationShipName = this.factorRelationships?.find(
                        (el: any) => el?.FactorName == this.top2Traits?.[0] + '_' + this.top2Traits?.[1]
                    )
                }

                this.marketMood = state.marketMoodData?.data
                this.behavioralBiases = state.behaviralBiasesPayload?.data?.behavioralBiasList
                this.discoveryDto = localStorage.getItem('discoverySettings') || ''
                this.participantName = localStorage.getItem('participantName') || ''
                this.participantName = state?.tScorePaylaod?.data?.firstName + ' ' + state?.tScorePaylaod?.data?.lastName

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
                    // Use the unique style name to get the video URL
                    const uniqueStyleName = this.uniqueStyle
                    if (this.isBDNA) {
                        const videoUrl = this.bdnaUniqueStyleVideos[uniqueStyleName]
                        this.uniqueStyleVideo = shortenYoutubeUrl(videoUrl)
                    } else if (this.isFDNA) {
                        const videoUrl = this.fdnaUniqueStyleVideos[uniqueStyleName]
                        this.uniqueStyleVideo = shortenYoutubeUrl(videoUrl)
                    }

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
        forkJoin([
            this.userService.getCoachingReportTraitsData().pipe(
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
            ),
            this.userService.getBDNAUniqueStyleVideoLinks().pipe(
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
            ),
            this.userService.getFDNAUniqueStyleVideoLinks().pipe(
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
            ),
        ])
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe()

        this.store.dispatch(getUniqueStyleAndDescriptionAction(this.personId, this.langId))
        this.store.dispatch(getSalesInsightsAction(this.personId))
        this.store.dispatch(getHiringDataAction(this.personId))
        this.store.dispatch(getTScoreAction(this.personId))
        this.store.dispatch(getWorkPlaceInsight(this.personId, '22'))
        this.store.dispatch(getEnvironmentKeys(this.personId, K.APP.LANGUAGE_ID))
        this.store.dispatch(getTScoreAction(this.personId))
        this.store.dispatch(getParticipantsDetailAction([{ personId: this.personId }], this.accountId))
        this.store.dispatch(getWorkTalentsAction(this.personId, K.APP.LANGUAGE_ID))
        this.store.dispatch(getBehaviralBiases(this.personId, this.accountId))
        this.store.dispatch(getCoachingReportAction())
        this.store.dispatch(getFactorRelationshipAction())
    }

    ngAfterViewInit(): void {
        this.createTScoreGraph()
    }

    setBrandLogo() {
        this.pdfExportService.setBrandLogo(this)
    }
    onBack() {
        this._location.back()
    }

    async prepareCanvas() {
        await this.pdfExportService.prepareCanvas(this)
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
        this.pdfExportService.downloadPdf(this)
    }

    loadText() {
        return this.pdfExportService.loadText(this)
    }

    changeTScoreData(array: number[]) {
        return array?.map((x) => x - 50)
    }

    getPrimaryColor(condition: boolean) {
        return { backgroundColor: condition ? this.primaryColor : '', color: condition ? 'white' : '' }
    }
    updateChartColors() {
        // Find the index of the current unique style
        const styleIndex = this.chartLabels.findIndex((label) => label === this.uniqueStyle)
        if (styleIndex !== -1) {
            // Create new backgroundColor array with all light green except current style
            const newBackgroundColors = new Array(10).fill('#DBF9DB')
            newBackgroundColors[styleIndex] = '#227442' // Dark green for current style

            // Update chart colors
            this.pieChartColors = [
                {
                    ...this.pieChartColors[0],
                    backgroundColor: newBackgroundColors,
                },
            ]
        }
    }

    getChartData() {
        this.tScoreChartService.getChartData(this)
    }

    getOptions(start: number, end: number) {
        return this.tScoreChartService.getOptions(this, start, end)
    }

    createTScoreGraph() {
        this.tScoreChartService.createTScoreGraph(this)
    }

    getCurrentUniqueStyleImage(): string {
        return this.uniqueStyleImages[this.uniqueStyle] || ''
    }

    calculatePageNumbers() {
        this.pageNumber = calculateTotalPages(this.isBDNA, this.isFDNA)
    }

    isBDNAPage(pageNumber: number): boolean {
        return isBDNAPageUtil(pageNumber)
    }

    isFDNAPage(pageNumber: number): boolean {
        return isFDNAPageUtil(pageNumber)
    }

    getDisplayPageNumber(pageId: number): number {
        return getDisplayPageNumberUtil(pageId, this.isBDNA, this.isFDNA)
    }

    getSectionNumber(baseSection: number, subSection: number): string {
        return getSectionNumberUtil(baseSection, subSection, this.isBDNA, this.isFDNA)
    }

    ngOnDestroy() {
        this.tScoreCharts.forEach((chart) => chart?.destroy())
        enableWonderchat()
    }

    trackByIndex(index: number, item?: unknown): number {
        return index
    }

    // `<Report name> - <First> <Last>.pdf`. Prefers the name from the participant's own data; falls back
    // to the name the users page passed when navigating here, then to the report name alone.
    get reportFileName(): string {
        return buildReportFileName(`${this.reportName}`, this.reportOwnerName || formatPersonName(this.navigationParticipantName))
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
