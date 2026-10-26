import { Injectable } from '@angular/core'
import K from 'src/app/constants'
import { MainUsersService } from '../../main-users.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'

// Fields read/written by TeamReportComponent's PDF export methods. TeamReportComponent passes
// itself (`this`) as the state argument to every method below, so all mutations here happen
// directly on the component instance's own fields.
export interface TeamReportPdfExportState {
    isDownloadReady: boolean
    pdf: any
    pageNumber: number
    canvasData: any[]
    progressPercentage: number
    reportName: string
    reportFileName: string
    accountId: string | null
    personId: string
    logo: string
}

@Injectable({ providedIn: 'root' })
export class TeamReportPdfExportService {
    constructor(
        private msgService: MsgService,
        private mixpanelService: MixpanelService,
        private mainUsersService: MainUsersService
    ) {}

    async prepareCanvas(state: TeamReportPdfExportState) {
        state.isDownloadReady = false
        const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
        if (!state.pdf) {
            state.pdf = new JsPDF('p', 'mm', 'letter', true)
        }

        for (let i = 1; i < state.pageNumber; i++) {
            const data: any = document.getElementById(i.toString())
            if (data) {
                data.style.fontFeatureSettings = '"liga" 0'
                const canvas = await html2canvas(data, { scale: 2 })
                state.canvasData.push(canvas)
                const imgWidth = 215
                const imgHeight = (canvas.height * imgWidth) / canvas.width
                const contentDataURL = canvas.toDataURL('image/png')
                state.pdf.addPage()
                state.pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')
            }
            state.progressPercentage = Math.round((i / state.pageNumber) * 100)
        }
        state.pdf.deletePage(1)
        state.isDownloadReady = true
    }

    downloadPdf(state: TeamReportPdfExportState) {
        this.msgService.reportsSuccessMessage("Report Downloading... Access the report in your 'Downloads' folder")
        state.pdf.save(state.reportFileName)
        this.mixpanelService.track('Team report PDF downloaded', {
            accountId: state.accountId,
            personID: state.personId,
            reportType: 'Team Report',
        })
    }

    loadText(state: TeamReportPdfExportState) {
        const dotCount = 1 + (state.canvasData.length % 3)
        const text = 'Preparing Download' + '.'.repeat(dotCount)
        return text
    }

    setBrandLogo(state: TeamReportPdfExportState) {
        const coBrandLogo = JSON.parse(Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_OBJECT) || ''))?.cobrandingLogoPath
        if (coBrandLogo) {
            // converting coBrandLogo to base64, so that it can be available in
            // generated pdf
            this.mainUsersService.toDataURL(coBrandLogo, (dataUrl: any) => {
                state.logo = dataUrl
            })
        } else {
            state.logo = 'assets/images/logo.png'
        }
    }
}
