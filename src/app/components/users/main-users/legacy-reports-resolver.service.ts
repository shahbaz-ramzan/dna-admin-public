import { Injectable } from '@angular/core'

// Shared, static legacy-report metadata for BDNA/FDNA report links, plus the blob-link
// resolution logic. Was previously duplicated verbatim across single-user-selection (1 copy each)
// and double-user-selection (2 copies each, one per participant) — 3 copies total per list.
// Each getter returns a fresh array of fresh objects (not shared references), since blobLink is
// mutated in place per component-instance/per-participant afterward via resolveBlobLinks.
export interface LegacyReportEntry {
    label: string
    reportId: number
    blobLink: string
}

@Injectable({ providedIn: 'root' })
export class LegacyReportsResolverService {
    getBdnaLegacyReportsList(): LegacyReportEntry[] {
        return [
            {
                label: 'Your Work Talents Report',
                reportId: 58,
                blobLink: '',
            },
            {
                label: 'BDNA Summary Report',
                reportId: 7,
                blobLink: '',
            },
            {
                label: 'Workplace Operation Report',
                reportId: 8,
                blobLink: '',
            },
            {
                label: 'BDNA 1-Page Factor Report',
                reportId: 6,
                blobLink: '',
            },
            {
                label: 'BDNA Coaching Report',
                reportId: 10,
                blobLink: '',
            },
            {
                label: 'BDNA Hiring Report',
                reportId: 19,
                blobLink: '',
            },
            {
                label: 'BDNA Career Report',
                reportId: 28,
                blobLink: '',
            },
            {
                label: 'Business Talent DNA Report',
                reportId: 34,
                blobLink: '',
            },
            {
                label: 'Outside Sales Talent DNA Report',
                reportId: 36,
                blobLink: '',
            },
            {
                label: 'Inside Sales Talent DNA Report',
                reportId: 37,
                blobLink: '',
            },
            {
                label: 'My Entrepreneurial Style Report',
                reportId: 54,
                blobLink: '',
            },
            {
                label: 'Leadership Behavior DNA Report',
                reportId: 16,
                blobLink: '',
            },
            {
                label: 'Sports DNA Summary Report',
                reportId: 18,
                blobLink: '',
            },
        ]
    }

    getFdnaLegacyReportsList(): LegacyReportEntry[] {
        return [
            {
                label: 'Financial Behavior Report',
                reportId: 56,
                blobLink: '',
            },
            {
                label: 'FDNA Summary Report',
                reportId: 15,
                blobLink: '',
            },
            {
                label: 'FDNA Financial Planning Report',
                reportId: 12,
                blobLink: '',
            },
            {
                label: 'FDNA 1-Page Factor Report',
                reportId: 11,
                blobLink: '',
            },
            {
                label: 'FDNA Wealth Mentoring Report',
                reportId: 13,
                blobLink: '',
            },
            {
                label: 'Financial Talent DNA Report',
                reportId: 33,
                blobLink: '',
            },
            {
                label: 'Financial Advisor Talent Report',
                reportId: 35,
                blobLink: '',
            },
            {
                label: 'FDNA Investment Risk Report',
                reportId: 48,
                blobLink: '',
            },
            // {
            //     label: 'Financial Planning Roadmap',
            //     reportId: 53,
            //     blobLink: '',
            // },
        ]
    }

    resolveBlobLinks(reports: LegacyReportEntry[], url: string): void {
        const blobUrl = url.split('reportId')
        for (const report of reports) {
            report.blobLink = blobUrl[0] + report.reportId + blobUrl[1]
        }
    }
}
