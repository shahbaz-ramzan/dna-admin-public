import { CommonModule, Location } from '@angular/common'
import { AfterViewInit, Component, DestroyRef, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Params } from '@angular/router'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import * as Highcharts from 'highcharts'
import * as moment from 'moment'
import { ButtonModule } from 'primeng/button'
import { ReportLoadingOverlayComponent } from 'src/app/components/common/report-loading-overlay/report-loading-overlay.component'
import { FactorsHorizontalBarComponent } from 'src/app/components/graphs/factors-horizontal-bar/factors-horizontal-bar.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { Label } from 'src/app/util/interfaces'
import { buildChatPayloadData, buildWorkTalentsInsights, disableWonderchat, enableWonderchat } from 'src/app/util/utils'
import { ChatbotComponent } from '../../../chatbot/chatbot.component'
import { MainUsersService } from '../../main-users.service'
import { DiscoveryIncompleteModalComponent } from '../discovery-incomplete-modal/discovery-incomplete-modal.component'
import {
    discoveryStatusResolvedAction,
    getTScoreAction,
    getTScoreActionSuccess,
    getUniqueStyleAction,
    getUniqueStyleAndDescriptionAction,
    getWorkTalentsAction,
} from '../mainUserStore/main-users.actions'
import { selectMainUserState } from '../mainUserStore/main-users.selectors'
import { buildReportFileName, formatPersonName } from '../report-file-name.util'

@Component({
    selector: 'app-factors-report',
    templateUrl: './factors-report.component.html',
    styleUrls: ['./factors-report.component.scss'],
    standalone: true,
    imports: [DiscoveryIncompleteModalComponent, CommonModule, ButtonModule, ChatbotComponent, ReportLoadingOverlayComponent],
})
export class FactorsReportComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    private destroyRef = inject(DestroyRef)
    discoveryIncomplete = false
    private discoveryCheckPersonId = ''
    private reportDataLoaded = false
    // Names for the downloaded PDF's file name - see reportFileName.
    private reportOwnerName = ''
    private navigationParticipantName = ''
    personId = ''
    @ViewChild(FactorsHorizontalBarComponent)
    graphComponent: FactorsHorizontalBarComponent
    tScoreLoading = false
    participantName = ''
    isDigitalScan: boolean

    bgColor: any = '#ffffff'
    secondaryColor2: any = null
    secondaryColor: any = '#1a3462'
    primaryColor: any = '#2e9b64'

    logo: any
    footerYear = (moment as any)(new Date()).format('YYYY')
    footerDate = (moment as any)(new Date()).format('DD-MMM-YY')
    index: string[] = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
    private tScoreCharts: (Highcharts.Chart | undefined)[] = new Array(8).fill(undefined)

    finalChartData1: any = []

    public options: any

    leftLabels: Label[] = []

    rightLabels: Label[] = []

    chartData: any = [
        {
            name: '',
            data: [],
            color: this.secondaryColor,
        },
    ]

    isDownloadReady: boolean = false
    pageNumber = 6
    canvasData: any[] = []
    accountId: any = ''
    reportColor: any
    uniqueStyle = ''
    chat_payload_data: any = {}
    progressPercentage = 0

    // Work Talents Data
    workTalentsLoading = false
    workTalentsData: any = null
    workTalentsInsights: { [key: string]: string } = {}

    constructor(
        private store: Store<any>,
        private activatedRoute: ActivatedRoute,
        private mixpanelService: MixpanelService,
        private actions: Actions,
        private msgService: MsgService,
        private _location: Location,
        private userService: MainUsersService
    ) {
        this.listenDiscoveryStatus()
        this.accountId = Encryption.decryptData(localStorage.getItem('accountId') || '')
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
        if (this.primaryColor === K.APP.DEFAULT_PRIMARY_COLOR) {
            this.reportColor = this.secondaryColor
        } else {
            this.reportColor = this.primaryColor
        }

        disableWonderchat()
    }

    ngOnInit(): void {
        this.leftLabels = K.APP.SUB_FACTORS_LEFT_LABELS
        this.rightLabels = K.APP.SUB_FACTORS_RIGHT_LABELS
        this.setBrandLogo()
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
        // history.state is empty when the URL is entered by hand - calling toString() on undefined
        // threw here and aborted ngOnInit before the Discovery check, so the modal never showed.
        if (this.isDigitalScan !== undefined) localStorage.setItem('isDigitalScan', String(this.isDigitalScan))

        this.queryParamsSubscription()
        this.actions.pipe(ofType(getTScoreActionSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.isDownloadReady = false
            this.createTScoreGraph()
            setTimeout(() => {
                this.prepareCanvas() //wait for the data to be downloaded from the server
            }, 10000)
        })
        this.store
            .select(selectMainUserState)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.tScoreLoading = response?.getTScoreLoading
                this.workTalentsLoading = response?.getWorkTalentsLoading

                // Process work talents data FIRST (like sales report does)
                if (response?.workTalentsPayload?.data != undefined) {
                    this.workTalentsData = response?.workTalentsPayload?.data
                    this.workTalentsInsights = buildWorkTalentsInsights(this.workTalentsData)
                } else if (!Object.keys(this.workTalentsInsights).length) {
                    this.workTalentsData = null
                    this.workTalentsInsights = buildWorkTalentsInsights(null)
                }

                // Build chat payload AFTER work talents insights are processed
                const payloadData = {
                    twoStrongestTraits: [response?.tScorePaylaod?.data?.strogestFactors?.[0], response?.tScorePaylaod?.data?.strogestFactors?.[1]],
                    description_data: response?.uniqueStyleAndDescription?.data,
                    tScoreData: response?.tScorePaylaod?.data?.tscore,
                    personName: response?.tScorePaylaod?.data?.firstName,
                    reportType: 'Factors Report',
                    workTalentsInsights: this.workTalentsInsights,
                }

                this.chat_payload_data = buildChatPayloadData(payloadData)

                if (response?.tScorePaylaod?.data != undefined) {
                    this.isDigitalScan = localStorage.getItem('isDigitalScan') === 'true'
                    const tscoreData = response?.tScorePaylaod?.data?.tscore
                    this.participantName = response?.tScorePaylaod?.data?.firstName + ' ' + response?.tScorePaylaod?.data?.lastName
                    this.chartData[0].name = response?.tScorePaylaod?.data?.firstName
                    this.chartData[0].data = this.changeTScoreData(tscoreData)
                } else {
                    this.chartData[0].name = ''
                    this.chartData[0].data = []
                }

                if (response?.uniqueStyleAndDescription) {
                    this.uniqueStyle = response?.uniqueStyleAndDescription?.data?.behaviorTypeName
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
        this.store.dispatch(getTScoreAction(this.personId))
        this.store.dispatch(getUniqueStyleAndDescriptionAction(this.personId, 22))
        this.store.dispatch(getWorkTalentsAction(this.personId, K.APP.LANGUAGE_ID))
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
            this.personId = params['selectedParticipants']
        })
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.isFullView?.currentValue != changes?.isFullView?.previousValue) {
            this.createTScoreGraph()
        }
    }

    ngAfterViewInit(): void {
        this.createTScoreGraph()
    }

    createTScoreGraph() {
        this.finalChartData1 = JSON.parse(JSON.stringify(this.chartData))
        this.getChartData()

        if (this.chartData[0]?.data?.length > 0) {
            this.renderOrUpdateChart(0, this.getOptions(0, 4))
            this.renderOrUpdateChart(1, this.getOptions(4, 8))
            this.renderOrUpdateChart(2, this.getOptions(8, 12))
            this.renderOrUpdateChart(3, this.getOptions(12, 16))
            this.renderOrUpdateChart(4, this.getOptions(16, 21)) //trust
            this.renderOrUpdateChart(5, this.getOptions(21, 25)) //pioneering
            this.renderOrUpdateChart(6, this.getOptions(25, 28)) //risk
            this.renderOrUpdateChart(7, this.getOptions(28, 32)) //creativity
        }
    }

    // Reuses the existing Highcharts instance (cheap incremental redraw) instead of
    // tearing down and recreating the chart on every call — createTScoreGraph() re-runs
    // whenever isFullView toggles, not just on first render.
    private renderOrUpdateChart(idx: number, options: Highcharts.Options): void {
        const existing = this.tScoreCharts[idx]
        if (existing) {
            existing.update(options, true)
        } else {
            this.tScoreCharts[idx] = Highcharts.chart(this.index[idx], options)
        }
    }

    changeTScoreData(array: number[]) {
        return array.map((x) => x - 50)
    }

    getChartData() {
        const chartDataArray = this.chartData[0].data
        const finalArray = [
            ...chartDataArray.slice(0, 1),
            ...chartDataArray.slice(8, 11),
            ...chartDataArray.slice(1, 2),
            ...chartDataArray.slice(11, 14),
            ...chartDataArray.slice(2, 3),
            ...chartDataArray.slice(14, 17),
            ...chartDataArray.slice(3, 4),
            ...chartDataArray.slice(17, 20),
            ...chartDataArray.slice(4, 5),
            ...chartDataArray.slice(20, 24),
            ...chartDataArray.slice(5, 6),
            ...chartDataArray.slice(24, 27),
            ...chartDataArray.slice(6, 7),
            ...chartDataArray.slice(27, 29),
            ...chartDataArray.slice(7, 8),
            ...chartDataArray.slice(29, 32),
        ]

        this.finalChartData1.map((_: any, i: number) => {
            this.finalChartData1[i].name = this.chartData[i].name
            this.finalChartData1[i].data = finalArray

            this.finalChartData1[i].data?.map((element: any, j: number) => {
                this.finalChartData1[i].data[j] = {
                    y: element,
                    custom: {
                        extraInformation: `${(element + 50 < 50 ? this.leftLabels[j] : this.rightLabels[j]) + ': ' + (element + 50)}`,
                    },
                }
            })
        })
    }
    getOptions(start: number, end: number) {
        const copyChartData = JSON.parse(JSON.stringify(this.finalChartData1))
        if (copyChartData[0]?.data.length) {
            copyChartData[0].data = copyChartData[0]?.data?.slice(start, end)
        }

        const ticks = [-30, -20, -10, 0, 10, 20, 30] //labels to show on y-axis between 20-80
        const options: any = {
            chart: {
                type: 'bar',
                height: 280,
                backgroundColor: this.bgColor,
            },
            title: {
                text: '',
            },
            subtitle: {
                text: '',
            },
            tooltip: {
                enabled: false,
                headerFormat: '',
                pointFormat: `{point.custom.extraInformation}`,
            },
            plotOptions: {
                series: {
                    pointWidth: 15,
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return (this as any).y + 50
                        },
                    },
                },
            },
            legend: {
                enabled: false,
                verticalAlign: 'top',
                align: 'left',
                symbolRadius: 0,
            },
            xAxis: [
                {
                    categories: this.leftLabels.slice(start, end),
                    reversed: true,
                    labels: {
                        step: 1,
                        formatter: (value: any) => {
                            return value.value
                        },
                    },
                },
                {
                    opposite: true,
                    reversed: true,
                    categories: this.rightLabels.slice(start, end),
                    linkedTo: 0,
                    labels: {
                        step: 1,
                    },
                },
            ],
            yAxis: {
                title: {
                    text: null,
                },
                tickPositions: ticks,
                labels: {
                    formatter: (item: any) => {
                        return item.value + 50
                    },
                },
            },

            credits: {
                enabled: false,
            },
            series: copyChartData,
        }

        return options
    }

    async prepareCanvas() {
        this.isDownloadReady = false
        const { default: html2canvas } = await import('html2canvas')

        for (let i = 1; i <= this.pageNumber; i++) {
            const data: any = document.getElementById(i.toString())
            data.style.fontFeatureSettings = '"liga" 0'
            const canvas = await html2canvas(data, { scale: 2 })
            this.canvasData.push(canvas)
            this.progressPercentage = Math.round((i / this.pageNumber) * 100)
        }
        this.isDownloadReady = true
    }

    downloadPdf() {
        this.isDownloadReady = false
        setTimeout(async () => {
            const { default: JsPDF } = await import('jspdf')
            const pdf: any = new JsPDF('p', 'mm', 'letter', true)

            for (let i = 0; i < this.canvasData.length; i++) {
                const canvas = this.canvasData[i]
                const imgWidth = 215
                const imgHeight = (canvas.height * imgWidth) / canvas.width
                const contentDataURL = canvas.toDataURL('image/png')
                pdf.addPage()
                pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
            }

            pdf.deletePage(1)
            this.isDownloadReady = true
            this.msgService.reportsSuccessMessage("Report Downloading... Access the report in your 'Downloads' folder")
            pdf.save(this.reportFileName)
        }, 100)
    }

    loadText() {
        const dotCount = 1 + (this.canvasData.length % 2)
        const text = 'Preparing Download' + '.'.repeat(dotCount)
        return text
    }
    backClick() {
        this._location.back()
    }

    ngOnDestroy() {
        this.tScoreCharts.forEach((chart) => chart?.destroy())
        enableWonderchat()
    }

    // `<Report name> - <First> <Last>.pdf`. Prefers the name from the participant's own data; falls back
    // to the name the users page passed when navigating here, then to the report name alone.
    get reportFileName(): string {
        return buildReportFileName('Factors Report', this.reportOwnerName || formatPersonName(this.navigationParticipantName))
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
