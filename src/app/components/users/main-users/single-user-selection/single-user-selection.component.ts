import { CommonModule } from '@angular/common'
import { Component, DestroyRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { SortablejsModule } from '@maksim_m/ngx-sortablejs'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import * as moment from 'moment'
import { MarkdownModule } from 'ngx-markdown'
import { PrimeNGConfig } from 'primeng/api'
import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { TabViewModule } from 'primeng/tabview'
import { take } from 'rxjs'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import { RadarChartComponent } from 'src/app/components/graphs/radar-chart/radar-chart.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { Color } from 'src/app/util/interfaces'
import { MainUsersService } from '../../main-users.service'
import { LegacyReportEntry, LegacyReportsResolverService } from '../legacy-reports-resolver.service'
import { SUCCESS_BEHAVIRAL_BIASES_ACTION } from '../mainUserStore/main-users-actions-constants'
import {
    getBehaviralBiases,
    getCareersInsights,
    getCommunicationInsightAction,
    getEnvironmentKeys,
    getFDNAScoreAction,
    getFDNAScoreActionSuccess,
    getFinancialStyleMatch,
    getMarketDataAction,
    getMarketDataActionSuccess,
    getMarketMoodArrayAction,
    getMarketMoodArraySuccessAction,
    getOldReportsAction,
    getOldReportsActionSuccess,
    getRiskBehaviorAction,
    getSelftRegistrationIdAction,
    getSelftRegistrationIdActionSuccess,
    getSortingOrderAction,
    getSortingOrderActionSuccess,
    getTScoreAction,
    getTScoreActionSuccess,
    getUniqueStyleAndDescriptionAction,
    getUniqueStyleAndDescriptionActionSuccess,
    getWorkPlaceInsight,
    getWorkRelatedMoneyInsightActionSuccess,
    getWorkTalentsAction,
    updateSortingOrderActionSuccess,
    getUniqueStyleAction,
    discoveryStatusResolvedAction,
} from '../mainUserStore/main-users.actions'
import { selectMainUserState } from '../mainUserStore/main-users.selectors'
import { buildFdnaScoresObject, buildWorkTalentsObject } from '../participant-report-object-builders.util'
import { BehaviralBiasesComponent } from './behaviral-biases/behaviral-biases.component'
import { CareerInsightsComponent } from './career-insights/career-insights.component'
import { CommunicationComponent } from './communication/communication.component'
import { EnvironmentKeysComponent } from './environment-keys/environment-keys.component'
import { FinancialBehaviorComponent } from './financial-behavior/financial-behavior.component'
import { FinancialDnaScoreComponent } from './financial-dna-score/financial-dna-score.component'
import { LegacyReportsComponent } from './legacy-reports/legacy-reports.component'
import { RiskBehaviorComponent } from './risk-behavior/risk-behavior.component'
import { SortingPreferencesService } from './sorting-preferences.service'
import { StrongestFactorsComponent } from './strongest-factors/strongest-factors.component'
import { StyleMatchComponent } from './style-match/style-match.component'
import { TScoresComponent } from './t-scores/t-scores.component'
import { UserInfoBarComponent } from './user-info-bar/user-info-bar.component'
import { WorkTalentComponent } from './work-talent/work-talent.component'
import { WorkplaceInsightsComponent } from './workplace-insights/workplace-insights.component'
import { DiscoveryIncompleteModalComponent } from '../discovery-incomplete-modal/discovery-incomplete-modal.component'

interface Sorter {
    name: string
    code: string
}

@Component({
    selector: 'app-single-user-selection',
    standalone: true,
    imports: [
        DiscoveryIncompleteModalComponent,
        CommonModule,
        TabViewModule,
        ButtonModule,
        DialogModule,
        SortablejsModule,
        LoadingSpinnerComponent,
        UserInfoBarComponent,
        RiskBehaviorComponent,
        FinancialDnaScoreComponent,
        StyleMatchComponent,
        FinancialBehaviorComponent,
        BehaviralBiasesComponent,
        TScoresComponent,
        EnvironmentKeysComponent,
        CommunicationComponent,
        LegacyReportsComponent,
        WorkTalentComponent,
        StrongestFactorsComponent,
        WorkplaceInsightsComponent,
        CareerInsightsComponent,
        RadarChartComponent,
        MarkdownModule,
    ],
    templateUrl: './single-user-selection.component.html',
    styleUrls: ['./single-user-selection.component.scss'],
})
export class SingleUserSelectionComponent implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef)
    discoveryIncomplete = false
    private initialized = false
    private participantDataLoaded = false
    private participantDataLoadPending = false
    @Input() workAPIs: any
    @Input() financialAPIs: any
    @Input() personId: string
    @Input() firstName = '-----'
    @Input() isFullView: boolean
    userObject: any
    userData: any = null
    logedInPersonName = ''
    accountId: string | null
    selfRegistrationId: number | null
    discoveryType = 'BDNA'

    loggedInPersonId: string | null
    subscriptionName: string | ''
    riskBehaviorObject: {
        portfolioStructure: string
        gaugeValue: number
        riskGroup: string
    } = {
        portfolioStructure: '',
        gaugeValue: 0,
        riskGroup: '',
    }
    strongestFactorObject: { loading: boolean; factors: string[] } = {
        loading: false,
        factors: [''],
    }
    fdnaScoresObject: {
        value: number
        title: string
        description: string
    }[] = []
    financialStyleMatchObject: { percentage: number } = {
        percentage: 0,
    }
    workStyleMatchObject: { percentage: number } = {
        percentage: 0,
    }

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
    environmentKeysObject: { keys: string[] } = {
        keys: [''],
    }
    performanceGuide: any = {
        environmentKeys: [],
        struggles: [],
        strengths: [],
    }
    careersInsightsObject: { insights: string[] } = {
        insights: [''],
    }
    workPlaceObject: { labels: string[]; data: any[] } = {
        labels: [''],
        data: [''],
    }
    workTalentsObject: {
        value: number
        comparison1: string
        comparison2: string
        description: string
        label: string
    }[] = []
    communicationInsightsData: any
    marketData: any = {
        marketMoodData: [],
        marketMoodLabels: [],
    }
    marketMoodArray: any
    mood: string
    smileyColor: string
    financialStyleMatchLoading: boolean
    workStyleMatchLoading: boolean
    communicationInsightsLoading: boolean
    workPlaceInsightsLoading: boolean
    behaviralBiasesLoading: boolean
    riskBehaviorLoading: boolean
    getMarketDataLoading: boolean
    performanceGuideLoading: boolean
    strongestFactorsLoading: boolean
    careersInsightLoading: boolean
    financialBiasesLoading: boolean
    tScoreLoading: boolean
    fdnaLoading: boolean
    isMarketMoodArrayLoading: boolean
    workTalentLoading: boolean
    isUserDetailLoading = false
    getSortingOrderLoading = false
    updateSortingOrderLoading = false
    @ViewChild(TScoresComponent) tScoreComponent: TScoresComponent
    financialBehaviorSortingOrder: any = []
    talentSortingOrder: any = []
    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    financialBehaviorTabSorter: any[] = []

    workTalentsTabSorter: any[] = []
    idSingle = 'single'
    displaySortingModal = false

    SorterItem: Sorter[]
    legacyReportsLoading: boolean
    bdnaLegacyReportsList: LegacyReportEntry[]
    fdnaLegacyReportsList: LegacyReportEntry[]
    uniqueStyle = [
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
    showLegacyReports: boolean
    selectedSorterItem: Sorter

    index = 0
    id: string = this.idSingle.concat(this.index.toString())
    id1 = 'single2'
    isFinancialBehavior = false
    navLabel = 'Donnie Smith'
    singleName = ''
    styleMatch: string = this.secondaryColor
    singleUserWorkPlaceColor: Color[] = []
    workRelatedMoneyInsights = ''

    finacialStyleMatchColor = this.secondaryColor2

    behavioralBiasesColor: Color[] = []
    singleUserRadarChartData: any = []
    singleUserRadarChartLegend: any
    singleUserRadarChartColors: Color[]
    radarChartLoading = true
    showRadarChart = false
    behaviorType: { name: string; description: string }[]

    singleUserFinancialDoubleBarChartData: any = [
        {
            name: '',
            data: [],
            color: this.secondaryColor2,
        },
    ]
    singleUserWorkDoubleBarChartData: any = [
        {
            name: '',
            data: [],
            color: this.secondaryColor,
        },
    ]

    createTScoreGraph() {
        this.tScoreComponent?.createTScoreGraph() //re-creating t-score graph once ui loaded in DOM
    }
    sortDialog() {
        this.sortingPreferencesService.sortDialog(this)
    }

    workTalentPieChartColors: Color[] = [
        {
            backgroundColor: [this.primaryColor, this.secondaryColor],
            pointBackgroundColor: [this.primaryColor, this.secondaryColor],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: [this.primaryColor, this.secondaryColor],
        },
    ]

    financialPieChartColors: Color[] = [
        {
            backgroundColor: [this.secondaryColor2, this.primaryColor],
            pointBackgroundColor: [this.secondaryColor2, this.primaryColor],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: [this.secondaryColor2, this.primaryColor],
        },
    ]
    permissionObject: any

    constructor(
        private primengConfig: PrimeNGConfig,
        private store: Store<any>,
        private actions: Actions,
        private mainUserService: MainUsersService,
        private mixpanelService: MixpanelService,
        private route: ActivatedRoute,
        private msgService: MsgService,
        private legacyReportsResolverService: LegacyReportsResolverService,
        private sortingPreferencesService: SortingPreferencesService
    ) {
        this.listenDiscoveryStatus()
        this.bdnaLegacyReportsList = this.legacyReportsResolverService.getBdnaLegacyReportsList()
        this.fdnaLegacyReportsList = this.legacyReportsResolverService.getFdnaLegacyReportsList()
        this.userObject = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (this.userObject) {
            this.userObject = JSON.parse(this.userObject)
        }

        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }

        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.loggedInPersonId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')

        this.SorterItem = [
            { name: 'Work Talents', code: 'NY' },
            { name: 'The Strongest Factors', code: 'RM' },
            { name: 'Style Match', code: 'LDN' },
            { name: 'T-Scores', code: 'IST' },
        ]
    }
    ngOnInit(): void {
        // Angular calls ngOnChanges before ngOnInit on initial creation. When
        // MainUsersService.getParticipantsDetail()'s 30s in-memory cache is warm (e.g.
        // navigating to a report and back within that window), ngOnChanges's call to
        // getParticipantsDetail() replays synchronously and already sets `singleName` to the
        // real participant name (see handleParticipantDetailResponse()) before this line ever
        // runs. Unconditionally overwriting it here with the `firstName` @Input - which is
        // populated asynchronously by the parent and is still empty at this exact moment on a
        // freshly (re)created component - clobbered that correct value back to the '-----'
        // placeholder. Only fall back to `firstName`/the placeholder if nothing has set
        // `singleName` yet. `singleName` defaults to '' (not null/undefined, see its field
        // declaration), so `||` is required here, not `??` - `??` would never fall through past
        // an empty string on a genuine cold-cache first load.
        this.singleName = this.singleName || this.firstName || '-----'
        this.logedInPersonName = this.userObject.fisrtName
        this.store.dispatch(getSortingOrderAction(this.accountId))
        if (this.accountId && this.loggedInPersonId) {
            // this.store.dispatch(getDefaultToggleAction(this.loggedInPersonId, parseInt(this.accountId)))
        }
        const isFDNA = Encryption.decryptData(localStorage.getItem(K.APP.DEFAULT_IS_FDNA) || '')

        if (isFDNA === 'true') {
            this.index = 0
            this.id = this.idSingle.concat(this.index.toString())
        } else {
            this.index = 1
            this.id = this.idSingle.concat(this.index.toString())
        }

        this.actions.pipe(ofType(getTScoreActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.createTScoreGraph()
        })
        // getWorkRelatedMoneyInsights's effect dispatches `response: undefined` on failure (no
        // bespoke message before this migration, stays silent) - guarded so a failure doesn't
        // throw on `.body.response` and kill this subscription.
        this.actions.pipe(ofType(getWorkRelatedMoneyInsightActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ response }) => {
            if (!response?.body) return
            this.workRelatedMoneyInsights = response.body.response
        })

        // getMarketData's effect dispatches `marketDataResponse: undefined` on failure (no bespoke
        // message before this migration, stays silent) - guarded so a failure doesn't throw on
        // `.body.data...` and kill this subscription.
        this.actions.pipe(ofType(getMarketDataActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ marketDataResponse }) => {
            if (!marketDataResponse?.body?.data) return
            const tempMarketData: any = {
                marketMoodData: marketDataResponse.body.data.marketMoodData.slice().reverse(),
                marketMoodLabels: marketDataResponse.body.data.marketMoodLabels.slice().reverse(),
            }
            this.marketData = tempMarketData
        })

        this.actions.pipe(ofType(getFDNAScoreActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(({ FDNAScorePayload }) => {
            const fdnaData = FDNAScorePayload?.body?.data
            if (fdnaData != undefined) {
                this.fdnaScoresObject = []
                this.fdnaScoresObject.push(
                    {
                        value: fdnaData.riskBehavior.value,
                        title: 'Risk Behavior',
                        description: fdnaData.riskBehavior.description,
                    },
                    {
                        value: fdnaData.financialRelationshipManagement.value,
                        title: 'Financial Relationship Management',
                        description: fdnaData.financialRelationshipManagement.description,
                    },
                    {
                        value: fdnaData.financialPlanningManagement.value,
                        title: 'Financial Planning Management',
                        description: fdnaData.financialPlanningManagement.description,
                    },
                    {
                        value: fdnaData.wealthBuildingMotivation.value,
                        title: 'Wealth Building Motivation',
                        description: fdnaData.wealthBuildingMotivation.description,
                    },
                    {
                        value: fdnaData.financialEmotionalIntelligence.value,
                        title: 'Financial Emotional Intelligence',
                        description: fdnaData.financialEmotionalIntelligence.description,
                    }
                )
                const moneyInsightBody = {
                    chatbotId: 'clmjrpesh017tow215ljamfrf',
                    question: `convert this json array to be statements that are business and workplace focused include their name at the beginning and write in third person dont use the word advisor say stakeholders- Risk taker and tolerant of losses. ${JSON.stringify(this.fdnaScoresObject)}`,
                    chatlogId: '',
                    context: `Name is ${this.firstName}`,
                }
                // this.store.dispatch(getWorkRelatedMoneyInsightAction(moneyInsightBody))
            } else {
                this.fdnaScoresObject = []
            }
        })
        this.actions.pipe(ofType(getSelftRegistrationIdActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            if (response?.response?.body?.data) {
                this.selfRegistrationId = response?.response?.body?.data?.selfRegistrationId
                // const participantAccountId = response?.response?.body?.data?.accountId
                // this.store.dispatch(
                //     getSelfRegistrationDetailAction({
                //         linkId: this.selfRegistrationId,
                //         accountId: participantAccountId,
                //     })
                // )
            }
        })
        this.actions.pipe(ofType(getMarketMoodArraySuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            this.marketMoodArray = this.mainUserService.removeBoldTag(response?.response?.body?.data?.marketMoodDescriptions)
            this.mood = response?.response?.body?.data?.mood
            this.smileyColor = response?.response?.body?.data?.color
        })

        // this.actions.pipe(ofType(getDefaultToggleActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
        //     const data = response?.getDefaultToggleResponse?.body?.data

        //     if (!data) return

        //     if (data?.isFDNA) {
        //         this.index = 0
        //         this.id = this.idSingle.concat(this.index.toString())
        //     } else {
        //         this.index = 1
        //         this.id = this.idSingle.concat(this.index.toString())
        //     }
        // })

        this.actions.pipe(ofType(SUCCESS_BEHAVIRAL_BIASES_ACTION), takeUntilDestroyed(this.destroyRef)).subscribe((response: any) => {
            if (response?.behaviralBiasesPayload) {
                this.behaviralBiasesObject.datasets[0].data = []
                const biases_list: any = [response?.behaviralBiasesPayload?.body?.data?.behavioralBiasList]

                biases_list[0]?.forEach((element: any) => {
                    this.behaviralBiasesObject?.datasets[0]?.data?.push(element?.population)
                })
            }
        })

        // Classified by `data?.url` presence, not `body.statusCode` (D1/D2 - see
        // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md). "Has legacy reports" vs "legitimately
        // none" was never really a status-code distinction: the effect already guarantees a
        // resolved response is a real success, so the only question left is whether this
        // participant has a report url at all. resolveBlobLinks() throws on an undefined url
        // (`url.split(...)`), so it's only called once `url` is confirmed present (D6).
        this.actions.pipe(ofType(getOldReportsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            const url = response?.response?.body?.data?.url
            this.showLegacyReports = !!url
            if (url) {
                this.legacyReportsResolverService.resolveBlobLinks(this.bdnaLegacyReportsList, url)
                this.legacyReportsResolverService.resolveBlobLinks(this.fdnaLegacyReportsList, url)
            }
            this.financialBehaviorTabSorter = [
                ...this.mainUserService.getFinancialBehaviorTabSorter(this.permissionObject, this.showLegacyReports, this.financialBehaviorTabSorter),
            ]
            this.workTalentsTabSorter = [
                ...this.mainUserService.getWorkTalentsTabSorter(this.permissionObject, this.showLegacyReports, this.workTalentsTabSorter),
            ]
        })

        // getOldReportsAction dispatches unconditionally on every emission of this action type -
        // cache hit, background refresh, or foreground miss/error alike - this is load-bearing
        // (see the comment on getSortingCards in main-users-reports.effects.ts, and
        // SINGLE_USER_SELECTION_INSIGHTS_ARCHITECTURE.md §8). Classified by `body.data` presence,
        // not `body.statusCode` (D1) - that field doesn't exist on any response anymore, which is
        // why this dispatch never fired at all before this fix (the console showed zero
        // GetOldReports calls: this `if` was always false).
        this.actions.pipe(ofType(getSortingOrderActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            const res = response?.sortingOrderResponse?.body?.data
            if (res) {
                this.financialBehaviorTabSorter = [...res.financialBehaviorCardOrder]
                this.workTalentsTabSorter = [...res.workTalentsCardOrder]
            }
            this.store.dispatch(getOldReportsAction(this.personId))
        })

        this.actions.pipe(ofType(updateSortingOrderActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.store.dispatch(getSortingOrderAction(this.accountId))
        })

        // getUniqueStyleDetails's effect dispatches `uniqueStyleAndDescription: undefined` on
        // failure (no bespoke message before this migration, stays silent) - `?.` guards against
        // that throwing here, which used to kill this subscription and leave radarChartLoading
        // stuck true forever (the two lines below it never ran).
        this.actions.pipe(ofType(getUniqueStyleAndDescriptionActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((res: any) => {
            if (res.uniqueStyleAndDescription?.status == 200) {
                this.behaviorType = [
                    {
                        name: res.uniqueStyleAndDescription.body.data.behaviorTypeName,
                        description: res.uniqueStyleAndDescription.body.data.behaviorTypeDescription,
                    },
                ]
            }
            this.radarChartLoading = false
            this.showRadarChart = true
        })

        this.store
            .select((store) => store.dashboardReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((store) => {
                if (
                    store?.accountColorPayload?.data?.secondaryColor &&
                    store?.accountColorPayload?.data?.primaryColor &&
                    store?.accountColorPayload?.data?.secondaryColor2
                ) {
                    this.secondaryColor2 = store?.accountColorPayload?.data?.secondaryColor2
                    this.secondaryColor = store?.accountColorPayload?.data?.secondaryColor

                    this.primaryColor = store?.accountColorPayload?.data?.primaryColor
                } else {
                    this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
                    this.secondaryColor2 = K.APP.DEFAULT_SECONDARY_COLOR2
                    this.secondaryColor = K.APP.DEFAULT_SECONDARY_COLOR
                }
                this.singleUserWorkPlaceColor = [{ backgroundColor: this.secondaryColor }]
                this.behavioralBiasesColor = [{ backgroundColor: this.secondaryColor2 }]
                this.singleUserFinancialDoubleBarChartData[0].color = this.secondaryColor2

                this.singleUserWorkDoubleBarChartData[0].color = this.secondaryColor
                this.createTScoreGraph()
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if ((!this.userData && response?.isUserDetailLoading) || !response?.isUserDetailLoading) {
                    this.isUserDetailLoading = response?.isUserDetailLoading
                }
                this.riskBehaviorLoading = response?.getRiskBehaviorLoading
                if (response?.riskBehaviorPayload != undefined) {
                    const riskBehaviorResponse = response?.riskBehaviorPayload?.data

                    this.riskBehaviorObject.portfolioStructure = riskBehaviorResponse?.portfolioStructure
                    this.riskBehaviorObject.gaugeValue = riskBehaviorResponse?.riskScore
                    this.riskBehaviorObject.riskGroup = riskBehaviorResponse?.riskGroup ? riskBehaviorResponse?.riskGroup : 0
                }
                this.isMarketMoodArrayLoading = response?.isMarketMoodArrayLoading
                this.getMarketDataLoading = response?.getMarketDataLoading
                // if (response?.marketDataResponse) {
                // this.marketData = this.mainUserService.parseMarketData(response.marketDataResponse?.data)
                // this.marketData = response.marketDataResponse?.data
                // const tempMarketData: any = {
                //     marketMoodData: this.marketData.marketMoodData.slice().reverse(),
                //     marketMoodLabels: this.marketData.marketMoodLabels.slice().reverse(),
                // }
                // console.log('state market data', tempMarketData)
                // this.marketData = tempMarketData
                // }

                if (response?.userProfileUpdateStatus === 4) {
                    // The edit genuinely changed this participant's data, so the cached
                    // response (still valid for up to PARTICIPANTS_DETAIL_CACHE_TTL_MS) must
                    // not be replayed here - force a real network refetch.
                    this.mainUserService.clearParticipantsDetailCache()
                    this.getParticipantsDetail()
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.strongestFactorsLoading = response?.getStrongesFactorsLoading
                this.tScoreLoading = response?.getTScoreLoading
                if (response?.tScorePaylaod?.data != undefined) {
                    const tscoreData = response?.tScorePaylaod?.data?.tscore
                    // Legend shows the participant's unique style, not their name - falls back
                    // to name/API-provided firstName if discovery hasn't produced a style yet.
                    const legendName = this.userData?.uniqueStyle || response?.tScorePaylaod?.data?.firstName
                    this.singleUserFinancialDoubleBarChartData[0].name = legendName
                    this.singleUserFinancialDoubleBarChartData[0].data = this.changeTScoreData(tscoreData)
                    this.singleUserWorkDoubleBarChartData[0].name = legendName
                    this.singleUserWorkDoubleBarChartData[0].data = this.changeTScoreData(tscoreData)
                    this.strongestFactorObject.factors = []
                    const strongestFactorResponse = response?.tScorePaylaod?.data?.strogestFactors
                    strongestFactorResponse.forEach((element: any) => {
                        this.strongestFactorObject.factors.push(element)
                    })
                } else {
                    this.strongestFactorObject.factors = []
                    this.singleUserFinancialDoubleBarChartData[0].name = ''
                    this.singleUserWorkDoubleBarChartData[0].name = ''
                    this.singleUserFinancialDoubleBarChartData[0].data = []
                    this.singleUserWorkDoubleBarChartData[0].data = []
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.workPlaceObject.data = []
                this.workPlaceObject.labels = []
                this.workPlaceInsightsLoading = response?.workPlaceInsightLoading
                if (response?.workPlaceInsightPayload) {
                    response?.workPlaceInsightPayload?.data?.insight?.forEach((element: any) => {
                        this.workPlaceObject.data.push(element?.population)
                        this.workPlaceObject.labels.push(element?.insightName)
                    })
                } else {
                    this.workPlaceObject.data = []
                    this.workPlaceObject.labels = []
                }
            })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.fdnaLoading = response?.getFDNAScoreLoading
                this.fdnaScoresObject = buildFdnaScoresObject(response?.FDNAScorePayload?.data)
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.workTalentLoading = response?.getWorkTalentsLoading
                this.workTalentsObject = buildWorkTalentsObject(response?.workTalentsPayload?.data)
            })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                // getWorkStyleMatch and getFinancialStyleMatch hit the exact same backend
                // endpoint with the exact same params, so both cards share the one response
                // instead of dispatching (and fetching) it twice.
                this.financialStyleMatchLoading = response?.getFinancialStyleMatchLoading
                this.workStyleMatchLoading = response?.getFinancialStyleMatchLoading
                if (response?.financialStyleMatchPayload) {
                    this.financialStyleMatchObject.percentage = response?.financialStyleMatchPayload?.data
                    this.workStyleMatchObject.percentage = response?.financialStyleMatchPayload?.data
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.careersInsightLoading = response?.getCareersInsightsLoading
                this.careersInsightsObject.insights = []
                response?.careersInsightsPayload?.data?.roles.forEach((element: any) => {
                    this.careersInsightsObject.insights.push(element.name)
                })
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.behaviralBiasesLoading = response?.getBehaviralBiasesLoading
                // Legend shows the participant's unique style, not their name - falls back to
                // name if discovery hasn't produced a style yet.
                this.behaviralBiasesObject.datasets[0].label = this.userData?.uniqueStyle || this.singleName
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                this.environmentKeysObject.keys = []

                this.performanceGuide['environmentKeys'] = []
                this.performanceGuide['struggles'] = []
                this.performanceGuide['strengths'] = []
                this.performanceGuideLoading = res?.getEnvironmentKeysLoading
                if (res?.environmentKeysPayload?.data) {
                    res?.environmentKeysPayload?.data?.environmentKeys?.forEach((element: any) => {
                        this.environmentKeysObject.keys.push(element?.description)
                        this.performanceGuide?.environmentKeys?.push(element)
                    })
                    res?.environmentKeysPayload?.data?.struggles?.forEach((element: any) => {
                        this.performanceGuide?.struggles?.push(element)
                    })
                    res?.environmentKeysPayload?.data?.strengths?.forEach((element: any) => {
                        this.performanceGuide?.strengths?.push(element)
                    })
                } else {
                    this.performanceGuide['environmentKeys'] = []
                    this.performanceGuide['struggles'] = []
                    this.performanceGuide['strengths'] = []
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.communicationInsightsLoading = response?.communicationInsightsLoading
                if (response?.communicationInsightPayload) {
                    this.communicationInsightsData = response?.communicationInsightPayload
                } else {
                    this.communicationInsightsData = undefined
                }
            })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.legacyReportsLoading = response?.oldReportsLoading
                this.getSortingOrderLoading = response?.getSortingOrderLoading
                this.updateSortingOrderLoading = response?.updateSortingOrderLoading
            })

        // Participant data is requested only after Discovery/GetUniqueStyle confirms the participant
        // has completed Discovery - see requestParticipantDataLoad().
        this.initialized = true
        if (this.participantDataLoadPending) this.requestParticipantDataLoad()
    }

    private lastFetchedParticipantPersonId: string | null = null

    ngOnChanges(changes: SimpleChanges): void {
        // Only re-fetch when personId actually changed - a bare change-detection pass (e.g.
        // another @Input like isFullView toggling) must not re-trigger the network call.
        if (changes['personId'] && this.personId && this.personId !== this.lastFetchedParticipantPersonId) {
            this.checkDiscoveryStatus(this.personId)
        }
    }

    getParticipantsDetail() {
        if (!this.personId) return
        this.lastFetchedParticipantPersonId = this.personId
        const requestedPersonId = this.personId
        this.route.queryParams.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((currentParams) => {
            const accountId = currentParams?.accountId
            const participantsList = [{ personId: requestedPersonId }]
            this.mixpanelService.track('Get Participant Details Request', {
                accountID: accountId,
                participantsList: participantsList,
            })
            this.mainUserService
                .getParticipantsDetail({ accountId, participants: participantsList })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    // The user may have already selected a different person by the time this
                    // resolves - a stale response landing after a newer selection must not
                    // overwrite the now-current person's data.
                    next: (response) => {
                        if (requestedPersonId !== this.personId) return
                        this.handleParticipantDetailResponse(response)
                    },
                    error: (response) => {
                        if (requestedPersonId !== this.personId) return
                        console.log('[Mixpanel test] Get Participant Details Failed payload:', {
                            accountID: this.accountId,
                            loggedInPersonId: this.loggedInPersonId,
                            errorMessage: response,
                        })
                        this.mixpanelService.track('Get Participant Details Failed', {
                            accountID: this.accountId,
                            loggedInPersonId: this.loggedInPersonId,
                            errorMessage: response,
                        })
                    },
                })
        })
    }

    private handleParticipantDetailResponse(response: any) {
        // This is only ever called from getParticipantsDetail's `next:` callback (main-users.service.ts
        // routes through NetworkService.httpCall -> ApiErrorInterceptor, so a real transport failure
        // goes to the sibling `error:` callback instead, never here) - a resolved response is always a
        // real success. Classify on `data` presence, not the dead `statusCode` field: that field
        // doesn't exist on any response anymore, so this condition was permanently false and the
        // participant name / radar chart / userData below were never being applied on a real load.
        if (response?.body?.data?.[0]) {
            const participantDetail = response?.body?.data[0]
            this.singleName = participantDetail?.firstName ?? this.singleName

            if (this.loggedInPersonId == participantDetail.personId) {
                let user_object: any = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
                user_object = JSON.parse(user_object)
                user_object['fullName'] = participantDetail?.firstName + ' ' + participantDetail?.lastName
                localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify(user_object)))
            }
            this.mixpanelService.track('Get Participant Details Success', {
                accountID: this.accountId,
                participantDetail: participantDetail,
            })
            this.userData = {
                personID: this.personId,
                firstName: participantDetail?.firstName,
                lastName: participantDetail?.lastName,
                email: participantDetail?.email,
                tags: participantDetail?.tags,
                completionDate: participantDetail?.completionDate,
                uniqueStyle: participantDetail?.uniqueStyle,
                userLabel: participantDetail?.userLabel,
                profileImage: participantDetail?.profileImage,
                isChangeAllow: participantDetail?.isChangeAllow,
                cdnaMigrated: participantDetail?.cdnaMigrated,
                isDigitalScanV1_5Imported: participantDetail?.isDigitalScanV1_5Imported,
            }
            if (participantDetail?.cdnaMigrated) {
                this.msgService.showMigratedToaster(participantDetail?.firstName + ' ' + participantDetail?.lastName)
            }

            if (participantDetail?.facilitatorId && participantDetail?.facilitatorName) {
                this.userData['facilitator'] = {
                    facilitatorId: participantDetail?.facilitatorId,
                    facilitatorName: participantDetail?.facilitatorName,
                }
            }

            if (participantDetail?.uniqueStyle) {
                const styleIndex = this.uniqueStyle.indexOf(participantDetail?.uniqueStyle)
                const dataset = this.uniqueStyle.map((_, i) => (i === styleIndex ? 100 : 10))
                this.singleUserRadarChartData[0] = dataset
                this.singleUserRadarChartLegend = [{ text: participantDetail?.firstName, fillStyle: this.primaryColor }]
                this.singleUserRadarChartColors = [{ backgroundColor: this.primaryColor, borderColor: this.primaryColor }]
                this.store.dispatch(getUniqueStyleAndDescriptionAction(this.personId, K.APP.LANGUAGE_ID))
            } else {
                this.radarChartLoading = false
                this.showRadarChart = false
            }
        } else {
            // Reachable now only for a genuine empty-data edge case (resolved response, no
            // participant in body.data) - a real transport failure never reaches here at all (see
            // the comment above).
            console.log('[Mixpanel test] Get Participant Details Failed payload:', {
                accountID: this.accountId,
                loggedInPersonId: this.loggedInPersonId,
                errorMessage: response,
            })
            this.mixpanelService.track('Get Participant Details Failed', {
                accountID: this.accountId,
                loggedInPersonId: this.loggedInPersonId,
                errorMessage: response,
            })
        }
    }

    changeTScoreData(array: number[]) {
        return array.map((x) => x - 50)
    }

    handleChange(e: any) {
        this.index = e.index
        this.id = this.idSingle.concat(this.index.toString())
    }

    resetSorting(id: string) {
        this.sortingPreferencesService.resetSorting(this, id)
    }

    updateSorting() {
        this.sortingPreferencesService.updateSorting(this)
    }

    // Discovery/GetUniqueStyle gates everything else on this panel: a participant who hasn't
    // completed Discovery has no data, so none of the other APIs are called and the modal is shown.
    private checkDiscoveryStatus(personId: string) {
        if (!personId) return
        this.store.dispatch(getUniqueStyleAction({ personId }))
    }

    // Subscribed from the constructor rather than ngOnInit so it's in place before the first
    // dispatch - ngOnChanges runs before ngOnInit, and a warm-cache (30s) response is delivered
    // synchronously.
    private listenDiscoveryStatus() {
        this.actions.pipe(ofType(discoveryStatusResolvedAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ personId, completed }) => {
            // The selected participant can change before an earlier response lands.
            if (personId !== this.personId) return
            if (completed) {
                this.onDiscoveryConfirmed()
            } else {
                this.discoveryIncomplete = true
            }
        })
    }

    private onDiscoveryConfirmed() {
        this.discoveryIncomplete = false
        this.getParticipantsDetail()
        this.requestParticipantDataLoad()
    }

    // The card dispatches below used to run inline in ngOnInit, after its success listeners were
    // subscribed. Discovery can be confirmed before ngOnInit runs (ngOnChanges fires first), so
    // defer until it has - otherwise a cached response could land before anything is listening.
    // Loaded once per component instance, same as when this lived in ngOnInit.
    private requestParticipantDataLoad() {
        if (this.participantDataLoaded) return
        if (!this.initialized) {
            this.participantDataLoadPending = true
            return
        }
        this.participantDataLoaded = true
        this.participantDataLoadPending = false
        this.store.dispatch(getSelftRegistrationIdAction(this.personId))
        this.store.dispatch(getCareersInsights(this.personId))
        this.store.dispatch(getWorkTalentsAction(this.personId, K.APP.LANGUAGE_ID))
        this.store.dispatch(getWorkPlaceInsight(this.personId, K.APP.LANGUAGE_ID))

        this.store.dispatch(getEnvironmentKeys(this.personId, K.APP.LANGUAGE_ID))

        this.store.dispatch(getTScoreAction(this.personId))
        this.store.dispatch(getMarketDataAction(1)) // 1 => market index

        this.store.dispatch(getEnvironmentKeys(this.personId, K.APP.LANGUAGE_ID))
        this.store.dispatch(getFinancialStyleMatch(this.personId, this.loggedInPersonId))
        this.store.dispatch(getRiskBehaviorAction(this.personId))
        this.store.dispatch(getFDNAScoreAction(this.personId, this.accountId))
        this.store.dispatch(getBehaviralBiases(this.personId, this.accountId))
        this.store.dispatch(getCommunicationInsightAction(this.personId))
        this.store.dispatch(getMarketMoodArrayAction(this.personId, null, moment(new Date()).format('YYYY-MM-DD')))
    }
}
