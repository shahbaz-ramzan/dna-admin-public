import { Pipe, PipeTransform } from '@angular/core'

// Pure pipe replacing CoachingReportComponent.getMainSectionNumber(), previously called directly
// from template interpolation ~29 times - same re-render-cost problem as AzureCoachingDataPipe.
@Pipe({ name: 'mainSectionNumber', standalone: true })
export class MainSectionNumberPipe implements PipeTransform {
    transform(baseSection: number, isBDNA: boolean, isFDNA: boolean): number {
        let adjustedSection = baseSection

        if (!isBDNA && baseSection > 3) {
            adjustedSection--
        }

        if (!isFDNA && baseSection > (isBDNA ? 4 : 3)) {
            adjustedSection--
        }

        return adjustedSection
    }
}
