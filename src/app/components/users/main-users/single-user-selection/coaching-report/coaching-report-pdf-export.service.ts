import { Injectable } from '@angular/core'
import K from 'src/app/constants'
import { MainUsersService } from '../../../main-users.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { isBDNAPage, isFDNAPage } from './coaching-report-pagination.util'

// Fields read/written by CoachingReportComponent's PDF export methods. CoachingReportComponent
// passes itself (`this`) as the state argument to every method below, so all mutations here
// happen directly on the component instance's own fields. This uses html-to-image + DOM cloning,
// a different approach from TeamReportPdfExportService's html2canvas-based pipeline — the two are
// deliberately not unified (see PR 2.4 investigation: different libraries, different cloning
// strategy, not yet reconciled).
export interface CoachingReportPdfExportState {
    isDownloadReady: boolean
    pdf: any
    isBDNA: any
    isFDNA: any
    progressPercentage: number
    reportName: string
    reportFileName: string
    canvasData: any[]
    logo: any
    user_object: any
}

@Injectable({ providedIn: 'root' })
export class CoachingReportPdfExportService {
    constructor(
        private msgService: MsgService,
        private mixpanelService: MixpanelService,
        private userService: MainUsersService
    ) {}

    async prepareCanvas(state: CoachingReportPdfExportState) {
        state.isDownloadReady = false
        const SCALE = 1.5
        const [htmlToImage, { default: JsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
        if (!state.pdf) {
            state.pdf = new JsPDF('p', 'mm', 'letter', true)
        }
        for (let i = 1; i <= 47; i++) {
            if ((!state.isBDNA && isBDNAPage(i)) || (!state.isFDNA && isFDNAPage(i))) {
                continue
            }
            const node: HTMLElement | null = document.getElementById(i.toString())
            if (!node) continue
            try {
                // Create a clone of the node
                const clonedNode = node.cloneNode(true) as HTMLElement

                // Create a temporary container
                const tempContainer = document.createElement('div')
                tempContainer.style.position = 'absolute'
                tempContainer.style.left = '-9999px'
                tempContainer.style.top = '-9999px'
                tempContainer.appendChild(clonedNode)
                document.body.appendChild(tempContainer)

                // Apply styles to the clone
                clonedNode.style.margin = '0'
                clonedNode.style.width = node.offsetWidth + 'px'
                clonedNode.style.height = node.offsetHeight + 'px'

                // Copy canvas content before generating image
                const originalCharts = node.querySelectorAll('canvas')
                const clonedCharts = clonedNode.querySelectorAll('canvas')

                originalCharts.forEach((chart, index) => {
                    const clonedChart = clonedCharts[index]
                    if (clonedChart && chart instanceof HTMLCanvasElement && clonedChart instanceof HTMLCanvasElement) {
                        const context = clonedChart.getContext('2d')
                        if (context) {
                            context.drawImage(chart, 0, 0)
                        }
                    }
                })

                const dataUrl = await htmlToImage.toPng(clonedNode, {
                    quality: 0.95,
                    pixelRatio: SCALE,
                    skipAutoScale: true,
                    canvasWidth: node.offsetWidth * SCALE,
                    canvasHeight: node.offsetHeight * SCALE,
                    filter: (node: HTMLElement) => {
                        if (!(node instanceof Element)) return true
                        const style = window.getComputedStyle(node)
                        return style.display !== 'none' && style.visibility !== 'hidden'
                    },
                })

                const imgProps = state.pdf.getImageProperties(dataUrl)
                const pdfWidth = state.pdf.internal.pageSize.getWidth()
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

                if (i > 1) state.pdf.addPage()
                state.pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
                // Clean up
                document.body.removeChild(tempContainer)
            } catch (err) {
                console.error(`Error rendering page ${i}:`, err)
            }
            state.progressPercentage = Math.round((i / 47) * 100)
        }
        state.isDownloadReady = true
    }

    downloadPdf(state: CoachingReportPdfExportState) {
        this.msgService.reportsSuccessMessage("Report Downloading... Accestop2Traitss the report in your 'Downloads' folder")
        this.mixpanelService.track('Sales talent report Downloaded', {
            ...state.user_object,
            reportType: 'Sales Talent DNA Report',
        })
        state.pdf.save(state.reportFileName)
    }

    loadText(state: CoachingReportPdfExportState) {
        const dotCount = 1 + (state.canvasData.length % 3)
        const text = 'Preparing Download' + '.'.repeat(dotCount)
        return text
    }

    setBrandLogo(state: CoachingReportPdfExportState) {
        const coBrandLogo = JSON.parse(Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || ''))?.cobrandingLogoPath
        if (coBrandLogo) {
            this.userService.toDataURL(coBrandLogo, (dataUrl: any) => {
                state.logo = dataUrl
            })
        } else {
            state.logo = 'assets/images/logo.png'
        }
    }
}
