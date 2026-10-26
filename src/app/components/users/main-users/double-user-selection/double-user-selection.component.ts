import { CommonModule } from '@angular/common'
import { Component, DestroyRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core'
import { Color } from 'src/app/util/interfaces'
// import { DoubleAxesHorizontalBarComponent } from 'src/app/components/graphs/double-axes-horizontal-bar/double-axes-horizontal-bar.component'
import { TScoresComponent } from '../single-user-selection/t-scores/t-scores.component'

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import * as moment from 'moment'
import { PrimeNGConfig } from 'primeng/api'
import { TabViewModule } from 'primeng/tabview'
import { RadarChartComponent } from 'src/app/components/graphs/radar-chart/radar-chart.component'
import { getDefaultToggleAction, getDefaultToggleActionSuccess } from 'src/app/components/settings/settingsStore/settings.actions'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { MainUsersService } from '../../main-users.service'
import { DiscoveryIncompleteModalComponent } from '../discovery-incomplete-modal/discovery-incomplete-modal.component'
import { LegacyReportEntry, LegacyReportsResolverService } from '../legacy-reports-resolver.service'
import {
    discoveryStatusResolvedAction,
    getBehaviralBiases,
    getBehaviralBiases2,
    getCareersInsights,
    getCareersInsights2,
    getCommunicationInsightAction,
    getCommunicationInsightAction2,
    getEnvironmentKeys,
    getEnvironmentKeys2,
    getFDNAScoreAction,
    getFDNAScoreAction2,
    getFinancialStyleMatch,
    getMarketDataAction,
    getMarketMoodArrayAction,
    getMarketMoodArrayAction2,
    getMarketMoodArraySuccessAction,
    getMarketMoodArraySuccessAction2,
    getOldReportsAction,
    getOldReportsAction2,
    getOldReportsActionSuccess,
    getOldReportsActionSuccess2,
    getRiskBehaviorAction,
    getRiskBehaviorAction2,
    getTScoreAction,
    getTScoreAction2,
    getTScoreActionSuccess,
    getTScoreActionSuccess2,
    getUniqueStyleAction,
    getUniqueStyleAndDescriptionAction,
    getUniqueStyleAndDescriptionActionSuccess,
    getWorkPlaceInsight,
    getWorkPlaceInsight2,
    getWorkTalentsAction,
    getWorkTalentsAction2,
} from '../mainUserStore/main-users.actions'
import { selectMainUserState } from '../mainUserStore/main-users.selectors'
import { buildFdnaScoresObject, buildWorkTalentsObject } from '../participant-report-object-builders.util'
import { BehaviralBiasesComponent } from '../single-user-selection/behaviral-biases/behaviral-biases.component'
import { CareerInsightsComponent } from '../single-user-selection/career-insights/career-insights.component'
import { CommunicationComponent } from '../single-user-selection/communication/communication.component'
import { EnvironmentKeysComponent } from '../single-user-selection/environment-keys/environment-keys.component'
import { FinancialBehaviorComponent } from '../single-user-selection/financial-behavior/financial-behavior.component'
import { FinancialDnaScoreComponent } from '../single-user-selection/financial-dna-score/financial-dna-score.component'
import { FinancialReportsComponent } from '../single-user-selection/financial-reports/financial-reports.component'
import { GrowthChartComponent } from '../single-user-selection/growth-chart/growth-chart.component'
import { LegacyReportsComponent } from '../single-user-selection/legacy-reports/legacy-reports.component'
import { RiskBehaviorComponent } from '../single-user-selection/risk-behavior/risk-behavior.component'
import { StrongestFactorsComponent } from '../single-user-selection/strongest-factors/strongest-factors.component'
import { StyleMatchComponent } from '../single-user-selection/style-match/style-match.component'
import { UserInfoBarComponent } from '../single-user-selection/user-info-bar/user-info-bar.component'
import { WorkTalentComponent } from '../single-user-selection/work-talent/work-talent.component'

@Component({
    selector: 'app-double-user-selection',
    standalone: true,
    imports: [
        CommonModule,
        DiscoveryIncompleteModalComponent,
        TabViewModule,
        UserInfoBarComponent,
        RiskBehaviorComponent,
        FinancialDnaScoreComponent,
        FinancialBehaviorComponent,
        StyleMatchComponent,
        BehaviralBiasesComponent,
        TScoresComponent,
        EnvironmentKeysComponent,
        CommunicationComponent,
        LegacyReportsComponent,
        FinancialReportsComponent,
        WorkTalentComponent,
        StrongestFactorsComponent,
        CareerInsightsComponent,
        RadarChartComponent,
        GrowthChartComponent,
    ],
    templateUrl: './double-user-selection.component.html',
    styleUrls: ['./double-user-selection.component.scss'],
})
export class DoubleUserSelectionComponent implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef)
    discoveryIncomplete = false
    multipleIncomplete = false
    // personId -> has completed Discovery, for the pair currently selected.
    private discoveryResults: Record<string, boolean> = {}
    private lastCheckedPersonsKey: string | null = null
    private initialized = false
    private participantDataLoaded = false
    private participantDataLoadPending = false
    @Input() isFullView: boolean
    workPlaceInsightsLoading_1: boolean
    behaviralBiasesLoading_1: boolean
    financialStyleMatchLoading: boolean
    workStyleMatchLoading: boolean
    isUserDetailLoading = false
    isMarketMoodArrayLoading: boolean
    isMarketMoodArrayLoading2: boolean
    completionDate1: any = ''
    completionDate2: any = ''
    environmentKeysLoading_1: boolean
    strongestFactorsLoading_1: boolean
    careersInsightLoading_1: boolean
    financialBiasesLoading_1: boolean
    fdnaLoading_1: boolean
    workTalentLoading_1: boolean
    //-----------------------------------------------------------------------------------

    workPlaceInsightsLoading_2: boolean
    behaviralBiasesLoading_2: boolean
    environmentKeysLoading_2: boolean
    strongestFactorsLoading_2: boolean
    careersInsightLoading_2: boolean
    financialBiasesLoading_2: boolean
    fdnaLoading_2: boolean
    workTalentLoading_2: boolean
    subscriptionName: string | ''

    //-----------------------------------------------------------------------------------
    riskBehaviorObject_1: {
        portfolioStructure: string
        gaugeValue: number
        riskGroup: string
    } = {
        portfolioStructure: '',
        gaugeValue: 0,
        riskGroup: '',
    }

    riskBehaviorObject_2: {
        portfolioStructure: string
        gaugeValue: number
        riskGroup: string
    } = {
        portfolioStructure: '',
        gaugeValue: 0,
        riskGroup: '',
    }
    riskBehaviorLoading: boolean
    riskBehaviorLoading2: boolean

    getMarketDataLoading: boolean
    tScoreLoading: boolean
    tScoreLoading2: boolean

    strongestFactorObject_1: { loading: boolean; factors: string[] } = {
        loading: false,
        factors: [''],
    }
    fdnaScoresObject_1: {
        value: number
        title: string
        description: string
    }[] = []
    financialStyleMatchObject_1: { percentage: number } = {
        percentage: 0,
    }
    workStyleMatchObject_1: { percentage: number } = {
        percentage: 0,
    }
    behaviralBiasesObject_1: { data: any[] } = {
        data: [''],
    }
    performanceGuide_1: any = {
        environmentKeys: [],
        struggles: [],
        strengths: [],
    }
    careersInsightsObject_1: { insights: string[] } = {
        insights: [''],
    }
    workPlaceObject_1: { labels: string[]; data: any[] } = {
        labels: [''],
        data: [''],
    }
    workTalentsObject_1: {
        value: number
        comparison1: string
        comparison2: string
        description: string
        label: string
    }[] = []

    usersData: any[] = []
    accountId: string | null
    personId_1: string | null

    //--------------------------------------------------------------------------------------

    strongestFactorObject_2: { loading: boolean; factors: string[] } = {
        loading: false,
        factors: [],
    }
    fdnaScoresObject_2: {
        value: number
        title: string
        description: string
    }[] = []
    financialStyleMatchObject_2: { loading: boolean; percentage: number } = {
        loading: false,
        percentage: 0,
    }
    workStyleMatchObject_2: { loading: boolean; percentage: number } = {
        loading: false,
        percentage: 0,
    }
    behaviralBiasesObject_2: { data: any[] } = {
        data: [],
    }
    performanceGuide_2: any = {
        environmentKeys: [],
        struggles: [],
        strengths: [],
    }
    careersInsightsObject_2: { insights: string[] } = {
        insights: [''],
    }
    workPlaceObject_2: { labels: string[]; data: any[] } = {
        labels: [''],
        data: [''],
    }
    workTalentsObject_2: {
        value: number
        comparison1: string
        comparison2: string
        description: string
        label: string
    }[] = []
    marketData: any = {
        marketMoodData: [],
        marketMoodLabels: [],
    }
    marketMoodArray: any
    marketMoodArray2: any
    marketData2: any = {
        marketMoodData: [],
        marketMoodLabels: [],
    }
    mood_1: string
    smileyColor_1: string
    mood_2: string
    smileyColor_2: string

    accountId_2: string | null
    personId_2: string | null

    legacyReportsLoading1: boolean
    legacyReportsLoading2: boolean
    bdnaLegacyReportsList1: LegacyReportEntry[]
    bdnaLegacyReportsList2: LegacyReportEntry[]
    fdnaLegacyReportsList1: LegacyReportEntry[]
    fdnaLegacyReportsList2: LegacyReportEntry[]
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
    showLegacyReports1: boolean
    showLegacyReports2: boolean
    //--------------------------------------------------------------------------------------

    @Input() selectedPersons: string[]
    // Selected participants' list rows (main-users' tagUsersList) - only used for their names in the
    // Discovery-incomplete modal, since participant details aren't fetched for an incomplete pair.
    @Input() selectedUsers: any[] = []
    secondaryColor2: any = getComputedStyle(document.body).getPropertyValue('--secondary-color2')
    @ViewChild(TScoresComponent) tScoreComponent: TScoresComponent
    secondaryColor: any = getComputedStyle(document.body).getPropertyValue('--secondary-color')
    primaryColor: any = getComputedStyle(document.body).getPropertyValue('--primary-color')
    idDouble = 'double'
    navLabel1 = 'Donnie Smith'
    navLabel2 = 'Monica Simon'
    index = 0
    id: string = this.idDouble.concat(this.index.toString())
    doubleName1 = '-----'
    doubleName2 = '-----'
    doubleUserWorkPlaceColor: Color[] = [{ backgroundColor: this.secondaryColor }, { backgroundColor: this.primaryColor }]
    doubleUserWorkPlaceLabels: any[] = [
        'Patiently Build Long',
        'Desire  to make decions',
        'Goal Driven',
        'Focus on bottom line',
        'Empathetic',
        'Curious ',
        'Focused',
        'Need for information',
    ]
    doubleUserWorkPlaceData: any = [
        {
            data: [50, 60, 80, 55, 65, 77, 50, 90],
            label: '',
            fillColor: this.secondaryColor2,
        },
        {
            data: [65, 50, 70, 35, 88, 45, 66, 60],
            label: '',
            fillColor: this.secondaryColor2,
        },
    ]
    financialMatchpercentage = 67
    workMatchpercentage = 73
    doubleUserbehavioralBiasesColor: Color[] = []
    doubleUserSingleBarChartData: any = {
        datasets: [
            {
                barPercentage: 0.7,
                categoryPercentage: 40,
                label: '',
                data: [],
            },
            {
                barPercentage: 0.7,
                categoryPercentage: 100,
                label: '',
                data: [],
            },
        ],
    }
    doubleUserFinancialDoubleBarChartData: any = [
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
    doubleUserWorkDoubleBarChartData: any = [
        {
            name: '',
            data: [],
            color: this.secondaryColor,
        },
        {
            name: '',
            data: [],
            color: this.primaryColor,
        },
    ]
    doubleUserRadarChartUser: any[] = []
    doubleUserRadarChartLegends: any[] = []
    doubleUserRadarChartColors: Color[] = []
    radarChartLoading = true
    showRadarChart = false
    behaviorType: { name: string; description: string }[] = []
    communicationInsightsLoading1: boolean
    communicationInsightsLoading2: boolean
    communicationInsightsData1: any
    communicationInsightsData2: any
    workTalentPieChartColors: Color[] = [
        {
            // first color
            backgroundColor: [this.primaryColor, this.secondaryColor],
            pointBackgroundColor: [this.primaryColor, this.secondaryColor],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: [this.primaryColor, this.secondaryColor],
        },
    ]
    financialPieChartColors: Color[] = [
        {
            // first color
            backgroundColor: [this.secondaryColor2, this.primaryColor],
            pointBackgroundColor: [this.secondaryColor2, this.primaryColor],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: [this.secondaryColor2, this.primaryColor],
        },
    ]
    permissionObject: any
    loggedInPersonId: string

    constructor(
        private primengConfig: PrimeNGConfig,
        private store: Store<any>,
        private actions: Actions,
        private mainUserService: MainUsersService,
        private mixpanelService: MixpanelService,
        private msgService: MsgService,
        private legacyReportsResolverService: LegacyReportsResolverService
    ) {
        this.listenDiscoveryStatus()
        this.bdnaLegacyReportsList1 = this.legacyReportsResolverService.getBdnaLegacyReportsList()
        this.bdnaLegacyReportsList2 = this.legacyReportsResolverService.getBdnaLegacyReportsList()
        this.fdnaLegacyReportsList1 = this.legacyReportsResolverService.getFdnaLegacyReportsList()
        this.fdnaLegacyReportsList2 = this.legacyReportsResolverService.getFdnaLegacyReportsList()
        this.accountId = Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '')
        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        this.loggedInPersonId = Encryption.decryptData(localStorage.getItem(K.APP.LOGGED_IN_PERSON_ID) || '')
        let isFDNA = Encryption.decryptData(localStorage.getItem(K.APP.DEFAULT_IS_FDNA) || '')
        if (isFDNA) {
            isFDNA = JSON.parse(isFDNA)
            this.index = 0
            this.id = this.idDouble.concat(this.index.toString())
        } else {
            this.index = 1
            this.id = this.idDouble.concat(this.index.toString())
        }

        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
        this.riskBehaviorLoading = false
        this.riskBehaviorLoading2 = false
    }

    handleChange(e: any) {
        this.index = e.index
        this.id = this.idDouble.concat(this.index.toString())
    }

    ngOnInit(): void {
        this.personId_1 = this.selectedPersons?.at(0) || null
        this.personId_2 = this.selectedPersons?.at(1) || null
        this.checkDiscoveryStatus()

        if (this.accountId && this.loggedInPersonId) {
            this.store.dispatch(getDefaultToggleAction(this.loggedInPersonId, parseInt(this.accountId)))
        }

        this.actions.pipe(ofType(getTScoreActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.createTScoreGraph()
        })

        this.actions.pipe(ofType(getTScoreActionSuccess2), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.createTScoreGraph()
        })

        this.actions.pipe(ofType(getDefaultToggleActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            const data = response?.getDefaultToggleResponse?.body?.data

            if (!data) return

            if (data?.isFDNA) {
                this.index = 0
                this.id = this.idDouble.concat(this.index.toString())
            } else {
                this.index = 1
                this.id = this.idDouble.concat(this.index.toString())
            }
        })

        // Classified by `data?.url` presence, not `body.statusCode` (D1/D2 - see
        // REPORT_WIDGETS_STATUSCODE_MIGRATION_PLAN.md). resolveBlobLinks() throws on an undefined
        // url (`url.split(...)`), so it's only called once `url` is confirmed present (D6).
        this.actions.pipe(ofType(getOldReportsActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            const url = response?.response?.body?.data?.url
            this.showLegacyReports1 = !!url
            if (url) {
                this.legacyReportsResolverService.resolveBlobLinks(this.bdnaLegacyReportsList1, url)
                this.legacyReportsResolverService.resolveBlobLinks(this.fdnaLegacyReportsList1, url)
            }
        })

        this.actions.pipe(ofType(getOldReportsActionSuccess2), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            const url = response?.response?.body?.data?.url
            this.showLegacyReports2 = !!url
            if (url) {
                this.legacyReportsResolverService.resolveBlobLinks(this.bdnaLegacyReportsList2, url)
                this.legacyReportsResolverService.resolveBlobLinks(this.fdnaLegacyReportsList2, url)
            }
        })

        this.actions.pipe(ofType(getMarketMoodArraySuccessAction), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            this.marketMoodArray = this.mainUserService.removeBoldTag(response?.response?.body?.data?.marketMoodDescriptions)
            this.mood_1 = response?.response?.body?.data?.mood
            this.smileyColor_1 = response?.response?.body?.data?.color
        })
        this.actions.pipe(ofType(getMarketMoodArraySuccessAction2), takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
            this.marketMoodArray2 = this.mainUserService.removeBoldTag(response?.response?.body?.data?.marketMoodDescriptions)
            this.mood_2 = response?.response?.body?.data?.mood
            this.smileyColor_2 = response?.response?.body?.data?.color
        })

        // getUniqueStyleDetails's effect dispatches `uniqueStyleAndDescription: undefined` on
        // failure (no bespoke message before this migration, stays silent) - `?.` guards against
        // that throwing here, which used to kill this subscription BEFORE the participant-2
        // dispatch below ran, so participant 1 failing meant participant 2's data never loaded
        // either, and the radar-chart loading flag never cleared.
        this.actions.pipe(ofType(getUniqueStyleAndDescriptionActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe((res: any) => {
            if (res.uniqueStyleAndDescription?.status == 200) {
                this.behaviorType.push({
                    name: res?.uniqueStyleAndDescription?.body?.data?.behaviorTypeName,
                    description: res?.uniqueStyleAndDescription?.body?.data?.behaviorTypeDescription,
                })
            }

            //  dispatching action for 2nd participant after 1st participant action success.
            if (this.behaviorType.length == 1) {
                this.store.dispatch(getUniqueStyleAndDescriptionAction(this.personId_2, K.APP.LANGUAGE_ID))
            }

            // Stop spinner after getting data of both participants
            if (this.behaviorType.length == 2) {
                const isDatasetComplete = this.doubleUserRadarChartUser.every((el: []) => el?.length)
                if (isDatasetComplete) {
                    this.showRadarChart = true
                }
                this.radarChartLoading = false
            }
        })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.riskBehaviorLoading = response?.getRiskBehaviorLoading

                if (response?.riskBehaviorPayload != undefined) {
                    const riskBehaviorResponse = response?.riskBehaviorPayload?.data
                    this.riskBehaviorObject_1.portfolioStructure = riskBehaviorResponse?.portfolioStructure
                    this.riskBehaviorObject_1.gaugeValue = riskBehaviorResponse?.riskScore
                    this.riskBehaviorObject_1.riskGroup = riskBehaviorResponse?.riskGroup ? riskBehaviorResponse?.riskGroup : 0
                } else {
                    this.riskBehaviorObject_1 = {
                        portfolioStructure: '',
                        gaugeValue: 0,
                        riskGroup: '',
                    }
                }
                this.riskBehaviorLoading2 = response?.getRiskBehaviorLoading2
                if (response?.riskBehaviorPayload2 != undefined) {
                    const riskBehaviorResponse = response?.riskBehaviorPayload2?.data
                    this.riskBehaviorObject_2.portfolioStructure = riskBehaviorResponse?.portfolioStructure
                    this.riskBehaviorObject_2.gaugeValue = riskBehaviorResponse?.riskScore
                    this.riskBehaviorObject_2.riskGroup = riskBehaviorResponse?.riskGroup ? riskBehaviorResponse?.riskGroup : 0
                } else {
                    this.riskBehaviorObject_2 = {
                        portfolioStructure: '',
                        gaugeValue: 0,
                        riskGroup: '',
                    }
                }
                this.isMarketMoodArrayLoading = response?.isMarketMoodArrayLoading
                this.isMarketMoodArrayLoading2 = response?.isMarketMoodArrayLoading2
                this.getMarketDataLoading = response?.getMarketDataLoading
                if (response?.marketDataResponse) {
                    this.marketData = this.mainUserService.parseMarketData(response.marketDataResponse?.data)
                    const tempMarketData: any = {
                        marketMoodData: this.marketData.marketMoodData.slice().reverse(),
                        marketMoodLabels: this.marketData.marketMoodLabels.slice().reverse(),
                    }
                    this.marketData = tempMarketData
                }
                if (response?.userProfileUpdateStatus === 4) {
                    // The edit genuinely changed one of these participants' data, so the cached
                    // response (still valid for up to PARTICIPANTS_DETAIL_CACHE_TTL_MS) must
                    // not be replayed here - force a real network refetch.
                    this.mainUserService.clearParticipantsDetailCache()
                    this.lastFetchedPersonsKey = null
                    this.getParticipantsDetail()
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.strongestFactorsLoading_1 = response?.getStrongesFactorsLoading
                this.tScoreLoading = response?.getTScoreLoading
                this.tScoreLoading2 = response?.getTScoreLoading2

                if (response?.tScorePaylaod?.data != undefined) {
                    this.strongestFactorObject_1.factors = []
                    const strongestFactorResponse = response?.tScorePaylaod?.data?.strogestFactors
                    strongestFactorResponse.forEach((element: any) => {
                        this.strongestFactorObject_1.factors.push(element)
                    })

                    const tscoreData = response?.tScorePaylaod?.data?.tscore
                    this.doubleUserFinancialDoubleBarChartData[0].name = response?.tScorePaylaod?.data?.firstName
                    this.doubleUserFinancialDoubleBarChartData[0].data = this.changeTScoreData(tscoreData)
                    this.doubleUserWorkDoubleBarChartData[0].name = response?.tScorePaylaod?.data?.firstName
                    this.doubleUserWorkDoubleBarChartData[0].data = this.changeTScoreData(tscoreData)
                } else {
                    this.strongestFactorObject_1.factors = []
                    this.doubleUserFinancialDoubleBarChartData[0].name = ''
                    this.doubleUserWorkDoubleBarChartData[0].name = ''
                    this.doubleUserFinancialDoubleBarChartData[0].data = []
                    this.doubleUserWorkDoubleBarChartData[0].data = []
                }
                this.strongestFactorsLoading_2 = response?.getStrongesFactorsLoading2

                if (response?.tScorePaylaod2?.data != undefined) {
                    this.strongestFactorObject_2.factors = []
                    const strongestFactorResponse = response?.tScorePaylaod2?.data?.strogestFactors
                    strongestFactorResponse.forEach((element: any) => {
                        this.strongestFactorObject_2.factors.push(element)
                    })

                    const tscoreData = response?.tScorePaylaod2?.data?.tscore
                    this.doubleUserFinancialDoubleBarChartData[1].name = response?.tScorePaylaod2?.data?.firstName
                    this.doubleUserFinancialDoubleBarChartData[1].data = this.changeTScoreData(tscoreData)
                    this.doubleUserWorkDoubleBarChartData[1].name = response?.tScorePaylaod2?.data?.firstName
                    this.doubleUserWorkDoubleBarChartData[1].data = this.changeTScoreData(tscoreData)
                } else {
                    this.strongestFactorObject_2.factors = []
                    this.doubleUserFinancialDoubleBarChartData[1].name = ''
                    this.doubleUserWorkDoubleBarChartData[1].name = ''
                    this.doubleUserFinancialDoubleBarChartData[1].data = []
                    this.doubleUserWorkDoubleBarChartData[1].data = []
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.workPlaceObject_1.data = []
                this.workPlaceObject_1.labels = []
                this.workPlaceInsightsLoading_1 = response?.workPlaceInsightLoading
                if (response?.workPlaceInsightPayload) {
                    response?.workPlaceInsightPayload?.data?.insight?.forEach((element: any) => {
                        this.workPlaceObject_1.data.push(element?.population)
                        this.workPlaceObject_1.labels.push(element?.insightName)
                    })
                } else {
                    this.workPlaceObject_1.data = []
                    this.workPlaceObject_1.labels = []
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.fdnaLoading_1 = response?.getFDNAScoreLoading
                this.fdnaLoading_2 = response?.getFDNAScoreLoading2
                this.fdnaScoresObject_1 = buildFdnaScoresObject(response?.FDNAScorePayload?.data)
                this.fdnaScoresObject_2 = buildFdnaScoresObject(response?.FDNAScorePayload2?.data)
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.workTalentLoading_1 = response?.getWorkTalentsLoading
                this.workTalentLoading_2 = response?.getWorkTalentsLoading2
                this.workTalentsObject_1 = buildWorkTalentsObject(response?.workTalentsPayload?.data)
                this.workTalentsObject_2 = buildWorkTalentsObject(response?.workTalentsPayload2?.data)
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
                    this.financialStyleMatchObject_1.percentage = response.financialStyleMatchPayload?.data
                    this.workStyleMatchObject_1.percentage = response.financialStyleMatchPayload?.data
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.careersInsightLoading_1 = response?.getCareersInsightsLoading
                this.careersInsightLoading_2 = response?.getCareersInsightsLoading2

                this.careersInsightsObject_1.insights = []
                if (response?.careersInsightsPayload) {
                    response?.careersInsightsPayload?.data?.roles.forEach((element: any) => {
                        this.careersInsightsObject_1.insights.push(element.name)
                    })
                }

                this.careersInsightsObject_2.insights = []
                if (response?.careersInsightsPayload2) {
                    response?.careersInsightsPayload2?.data?.roles.forEach((element: any) => {
                        this.careersInsightsObject_2.insights.push(element.name)
                    })
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.behaviralBiasesObject_1.data = []
                this.behaviralBiasesObject_2.data = []
                this.behaviralBiasesLoading_1 = response?.getBehaviralBiasesLoading
                this.behaviralBiasesLoading_2 = response?.getBehaviralBiasesLoading
                this.doubleUserSingleBarChartData.datasets[0].label = this.doubleName1
                this.doubleUserSingleBarChartData.datasets[1].label = this.doubleName2

                if (response?.behaviralBiasesPayload?.data) {
                    const biases_list: any = [...response?.behaviralBiasesPayload?.data?.behavioralBiasList]
                    biases_list.sort((a: any, b: any) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

                    biases_list.forEach((element: any) => {
                        this.behaviralBiasesObject_1?.data?.push(element?.population)
                    })

                    this.doubleUserSingleBarChartData.datasets[0].data = this.behaviralBiasesObject_1.data
                } else {
                    this.behaviralBiasesObject_1.data = []
                    this.doubleUserSingleBarChartData.datasets[0].data = []
                }

                if (response?.behaviralBiasesPayload2?.data) {
                    const biases_list2: any = [...response?.behaviralBiasesPayload2?.data?.behavioralBiasList]
                    biases_list2.sort((a: any, b: any) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

                    biases_list2.forEach((element: any) => {
                        this.behaviralBiasesObject_2?.data?.push(element?.population)
                    })
                    this.doubleUserSingleBarChartData.datasets[1].data = this.behaviralBiasesObject_2.data
                } else {
                    this.behaviralBiasesObject_2.data = []
                    this.doubleUserSingleBarChartData.datasets[1].data = []
                }
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                this.performanceGuide_1['environmentKeys'] = []
                this.performanceGuide_1['struggles'] = []
                this.performanceGuide_1['strengths'] = []

                this.performanceGuide_2['environmentKeys'] = []
                this.performanceGuide_2['struggles'] = []
                this.performanceGuide_2['strengths'] = []

                this.environmentKeysLoading_1 = res?.getEnvironmentKeysLoading
                if (res?.environmentKeysPayload?.data) {
                    res?.environmentKeysPayload?.data?.environmentKeys?.forEach((element: any) => {
                        this.performanceGuide_1?.environmentKeys.push(element)
                    })
                    res?.environmentKeysPayload?.data?.struggles?.forEach((element: any) => {
                        this.performanceGuide_1?.struggles.push(element)
                    })
                    res?.environmentKeysPayload?.data?.strengths?.forEach((element: any) => {
                        this.performanceGuide_1?.strengths.push(element)
                    })
                } else {
                    this.performanceGuide_1['environmentKeys'] = []
                    this.performanceGuide_1['struggles'] = []
                    this.performanceGuide_1['strengths'] = []
                }

                this.environmentKeysLoading_2 = res?.getEnvironmentKeysLoading2
                if (res?.environmentKeysPayload2?.data) {
                    res?.environmentKeysPayload2?.data?.environmentKeys?.forEach((element: any) => {
                        this.performanceGuide_2.environmentKeys.push(element)
                    })
                    res?.environmentKeysPayload2?.data?.struggles?.forEach((element: any) => {
                        this.performanceGuide_2.struggles.push(element)
                    })
                    res?.environmentKeysPayload2?.data?.strengths?.forEach((element: any) => {
                        this.performanceGuide_2.strengths.push(element)
                    })
                } else {
                    this.performanceGuide_2['environmentKeys'] = []
                    this.performanceGuide_2['struggles'] = []
                    this.performanceGuide_2['strengths'] = []
                }
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
                    this.primaryColor = store?.accountColorPayload?.data?.primaryColor
                    this.secondaryColor2 = store?.accountColorPayload?.data?.secondaryColor2
                    this.secondaryColor = store?.accountColorPayload?.data?.secondaryColor
                } else {
                    this.primaryColor = K.APP.DEFAULT_PRIMARY_COLOR
                    this.secondaryColor2 = K.APP.DEFAULT_SECONDARY_COLOR2
                    this.secondaryColor = K.APP.DEFAULT_SECONDARY_COLOR
                }
                this.doubleUserbehavioralBiasesColor = [{ backgroundColor: this.secondaryColor2 }, { backgroundColor: this.primaryColor }]
                this.doubleUserFinancialDoubleBarChartData[0].color = this.secondaryColor2
                this.doubleUserFinancialDoubleBarChartData[1].color = this.primaryColor

                this.doubleUserWorkDoubleBarChartData[0].color = this.secondaryColor
                this.doubleUserWorkDoubleBarChartData[1].color = this.primaryColor

                this.workTalentPieChartColors = [
                    {
                        // first color
                        backgroundColor: [this.primaryColor, this.secondaryColor],
                        pointBackgroundColor: [this.primaryColor, this.secondaryColor],
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: [this.primaryColor, this.secondaryColor],
                    },
                ]

                this.createTScoreGraph()
            })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.communicationInsightsLoading1 = response?.communicationInsightsLoading
                if (response?.communicationInsightPayload) {
                    this.communicationInsightsData1 = response?.communicationInsightPayload
                } else {
                    this.communicationInsightsData1 = undefined
                }

                this.communicationInsightsLoading2 = response?.communicationInsightsLoading2
                if (response?.communicationInsightPayload) {
                    this.communicationInsightsData2 = response?.communicationInsightPayload2
                } else {
                    this.communicationInsightsData2 = undefined
                }
            })

        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.legacyReportsLoading1 = response?.oldReportsLoading
                this.legacyReportsLoading2 = response?.oldReportsLoading2
            })

        // Card data is requested only after Discovery/GetUniqueStyle confirms both participants have
        // completed Discovery - see requestParticipantDataLoad().
        this.initialized = true
        if (this.participantDataLoadPending) this.requestParticipantDataLoad()
    }

    private lastFetchedPersonsKey: string | null = null

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedPersons']) {
            this.personId_1 = this.selectedPersons?.at(0) || null
            this.personId_2 = this.selectedPersons?.at(1) || null
            this.checkDiscoveryStatus()
        }
    }

    getParticipantsDetail() {
        const key = JSON.stringify([...(this.selectedPersons ?? [])].sort())
        if (key === this.lastFetchedPersonsKey) return
        this.lastFetchedPersonsKey = key

        const participantsList = this.selectedPersons?.map((item: any) => {
            return {
                personId: item,
            }
        })
        if (!participantsList?.length) return

        this.mixpanelService.track('Get Participant Details', {
            accountID: this.accountId,
            participantsList: participantsList,
        })
        this.doubleName1 = '-----'
        this.doubleName2 = '-----'
        this.usersData = []
        this.isUserDetailLoading = true
        this.mainUserService
            .getParticipantsDetail({ accountId: this.accountId, participants: participantsList })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                // The selected pair may have changed again before this resolves - a stale
                // response for the previous pair must not overwrite the current pair's UI state.
                next: (response) => {
                    if (key !== this.lastFetchedPersonsKey) return
                    this.handleParticipantDetailResponse(response)
                },
                error: (response) => {
                    if (key !== this.lastFetchedPersonsKey) return
                    this.isUserDetailLoading = false
                    console.log('[Mixpanel test] Get Participant Details Failed payload:', {
                        accountID: this.accountId,
                        statusCode: response?.status,
                        errorMessage: response?.body?.errors?.message,
                    })
                    this.mixpanelService.track('Get Participant Details Failed', {
                        accountID: this.accountId,
                        statusCode: response?.status,
                        errorMessage: response?.body?.errors?.message,
                    })
                },
            })
    }

    private handleParticipantDetailResponse(response: any) {
        // Only ever called from getParticipantsDetail's `next:` callback (routes through
        // NetworkService.httpCall -> ApiErrorInterceptor, same as single-user-selection.component.ts -
        // a real transport failure goes to the sibling `error:` callback instead). Classify on `data`
        // presence, not the dead `statusCode` field: that field doesn't exist on any response
        // anymore, so this condition was permanently false and the participant names / radar charts /
        // userData below were never being applied on a real load.
        if (response?.body?.data) {
            // getParticipantsDetail's cache key sorts personIds before hashing (see
            // main-users.service.ts), so two requests for the same pair of participants share
            // one cached response regardless of which order each caller asked for them in - the
            // response array's order is therefore NOT guaranteed to match [personId_1, personId_2].
            // Re-order by personId here so the rest of this method's positional [0]/[1] (and
            // pIndex-based) indexing is safe, instead of trusting the response's raw order.
            const rawParticipantDetail = response?.body?.data ?? []
            const participantDetail = [this.personId_1, this.personId_2].map(
                (personId) => rawParticipantDetail.find((detail: any) => detail?.personId === personId) ?? undefined
            )
            this.mixpanelService.track('Get Participant Details Success', {
                accountID: this.accountId,
                participantDetail: participantDetail,
            })
            this.completionDate1 = participantDetail[0]?.completionDate
            this.completionDate2 = participantDetail[1]?.completionDate
            this.doubleName1 = participantDetail[0]?.firstName ?? '-----'
            this.doubleName2 = participantDetail[1]?.firstName ?? '-----'
            for (const pIndex in this.selectedPersons) {
                this.usersData[pIndex] = {
                    firstName: participantDetail[pIndex]?.firstName,
                    lastName: participantDetail[pIndex]?.lastName,
                    email: participantDetail[pIndex]?.email,
                    tags: participantDetail[pIndex]?.tags,
                    completionDate: participantDetail[pIndex]?.completionDate,
                    userLabel: participantDetail[pIndex]?.userLabel,
                    uniqueStyle: participantDetail[pIndex]?.uniqueStyle,
                    profileImage: participantDetail[pIndex]?.profileImage,
                    facilitator: null,
                    cdnaMigrated: participantDetail[pIndex]?.cdnaMigrated,
                    isDigitalScanV1_5Imported: participantDetail[pIndex]?.isDigitalScanV1_5Imported,
                }

                if (participantDetail[pIndex]?.cdnaMigrated) {
                    this.msgService.showMigratedToaster(participantDetail[pIndex]?.firstName + ' ' + participantDetail[pIndex]?.lastName)
                }

                if (participantDetail[pIndex]?.facilitatorId && participantDetail[pIndex]?.facilitatorName) {
                    this.usersData[pIndex]['facilitator'] = {
                        facilitatorId: participantDetail[pIndex]?.facilitatorId,
                        facilitatorName: participantDetail[pIndex]?.facilitatorName,
                    }
                }

                if (participantDetail[pIndex]?.uniqueStyle) {
                    const styleIndex = this.uniqueStyle.indexOf(participantDetail[pIndex]?.uniqueStyle)
                    this.doubleUserRadarChartUser.push(this.uniqueStyle.map((_, i) => (i == styleIndex ? 100 : 10)))
                    this.doubleUserRadarChartLegends[pIndex] = {
                        text: participantDetail[pIndex]?.firstName,
                        fillStyle: pIndex == '1' ? this.secondaryColor2 : this.primaryColor,
                    }
                    if (pIndex == '1') {
                        this.doubleUserRadarChartColors.push({
                            backgroundColor: this.secondaryColor2,
                            borderColor: this.secondaryColor2,
                        })
                    } else {
                        this.doubleUserRadarChartColors.push({
                            backgroundColor: this.primaryColor,
                            borderColor: this.primaryColor,
                        })
                        this.store.dispatch(getUniqueStyleAndDescriptionAction(this.personId_1, K.APP.LANGUAGE_ID))
                    }
                } else {
                    this.doubleUserRadarChartUser.push([])
                }

                if (this.doubleUserRadarChartUser.length == 2) {
                    const isDatasetComplete = this.doubleUserRadarChartUser.every((el: []) => el?.length)
                    if (!isDatasetComplete) {
                        this.radarChartLoading = false
                    }
                }
                // this.radarChartLoading = false
            }
            this.isUserDetailLoading = false
        } else {
            // Reachable now only for a genuine empty-data edge case (resolved response, no
            // participant data in body.data) - a real transport failure never reaches here at all
            // (see the comment above).
            this.isUserDetailLoading = false
            console.log('[Mixpanel test] Get Participant Details Failed payload:', {
                accountID: this.accountId,
                errorMessage: response?.body?.errors?.message,
            })
            this.mixpanelService.track('Get Participant Details Failed', {
                accountID: this.accountId,
                errorMessage: response?.body?.errors?.message,
            })
        }
    }

    createTScoreGraph() {
        this.tScoreComponent?.createTScoreGraph()
    }

    changeTScoreData(array: number[]) {
        return array.map((x) => x - 50)
    }

    // Discovery/GetUniqueStyle gates everything else on this view: if either participant hasn't
    // completed Discovery there's no data to compare, so none of the other APIs are called and the
    // modal names whoever is incomplete. Both are checked in parallel.
    private checkDiscoveryStatus() {
        const personIds = this.selectedPersonIds()
        const key = JSON.stringify([...personIds].sort())
        if (!personIds.length || key === this.lastCheckedPersonsKey) return
        this.lastCheckedPersonsKey = key
        this.discoveryResults = {}
        this.discoveryIncomplete = false
        this.multipleIncomplete = false
        personIds.forEach((personId) => this.store.dispatch(getUniqueStyleAction({ personId })))
    }

    // Subscribed from the constructor rather than ngOnInit so it's in place before the first
    // dispatch - ngOnChanges runs before ngOnInit, and a warm-cache (30s) response is delivered
    // synchronously.
    private listenDiscoveryStatus() {
        this.actions.pipe(ofType(discoveryStatusResolvedAction), takeUntilDestroyed(this.destroyRef)).subscribe(({ personId, completed }) => {
            // The selection can change before an earlier response lands.
            if (!this.selectedPersonIds().includes(personId)) return
            this.discoveryResults[personId] = completed
            this.evaluateDiscoveryStatus()
        })
    }

    // Waits until every selected participant has an answer, then either loads the view or shows the
    // modal - never a half-loaded comparison.
    private evaluateDiscoveryStatus() {
        const personIds = this.selectedPersonIds()
        if (personIds.some((personId) => !(personId in this.discoveryResults))) return
        const incomplete = personIds.filter((personId) => !this.discoveryResults[personId])
        if (incomplete.length) {
            this.multipleIncomplete = incomplete.length > 1
            this.discoveryIncomplete = true
            return
        }
        this.discoveryIncomplete = false
        this.getParticipantsDetail()
        this.requestParticipantDataLoad()
    }

    private selectedPersonIds(): string[] {
        return [this.personId_1, this.personId_2].filter((personId): personId is string => !!personId)
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
        this.store.dispatch(getCareersInsights2(this.personId_2))

        this.store.dispatch(getCareersInsights(this.personId_1))
        this.store.dispatch(getWorkTalentsAction(this.personId_1, K.APP.LANGUAGE_ID))
        this.store.dispatch(getWorkTalentsAction2(this.personId_2, K.APP.LANGUAGE_ID))
        this.store.dispatch(getWorkPlaceInsight(this.personId_1, K.APP.LANGUAGE_ID))
        this.store.dispatch(getWorkPlaceInsight2(this.personId_2, K.APP.LANGUAGE_ID))

        this.store.dispatch(getMarketDataAction(1)) // 1 => market index

        this.store.dispatch(getEnvironmentKeys(this.personId_1, K.APP.LANGUAGE_ID))
        this.store.dispatch(getEnvironmentKeys2(this.personId_2, K.APP.LANGUAGE_ID))

        this.store.dispatch(getTScoreAction(this.personId_1))
        this.store.dispatch(getTScoreAction2(this.personId_2))

        this.store.dispatch(getCommunicationInsightAction(this.personId_1))
        this.store.dispatch(getCommunicationInsightAction2(this.personId_2))

        this.store.dispatch(getFinancialStyleMatch(this.personId_1, this.personId_2))
        this.store.dispatch(getRiskBehaviorAction(this.personId_1))
        this.store.dispatch(getRiskBehaviorAction2(this.personId_2))

        this.store.dispatch(getOldReportsAction(this.personId_1))
        this.store.dispatch(getOldReportsAction2(this.personId_2))

        this.store.dispatch(getFDNAScoreAction2(this.personId_2, this.accountId))

        this.store.dispatch(getFDNAScoreAction(this.personId_1, this.accountId))
        this.store.dispatch(getBehaviralBiases(this.personId_1, this.accountId))
        this.store.dispatch(getBehaviralBiases2(this.personId_2, this.accountId))
        this.store.dispatch(getMarketMoodArrayAction(this.personId_1, null, moment(new Date()).format('YYYY-MM-DD')))
        this.store.dispatch(getMarketMoodArrayAction2(this.personId_2, null, moment(new Date()).format('YYYY-MM-DD')))
    }
}
