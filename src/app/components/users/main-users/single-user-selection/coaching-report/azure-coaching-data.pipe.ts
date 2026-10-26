import { Pipe, PipeTransform } from '@angular/core'

// Pure pipe replacing CoachingReportComponent.getDatafromAzureCoachingTable(), which was called
// directly from template interpolation 149 times - a method call in a binding re-runs on every
// change-detection cycle regardless of whether its inputs changed. A pure pipe only re-evaluates
// when one of its own arguments changes by reference/value, so unrelated CD cycles (any input
// event, timer, XHR anywhere in the app) skip the array scan + string rebuild entirely.
@Pipe({ name: 'azureCoachingData', standalone: true })
export class AzureCoachingDataPipe implements PipeTransform {
    transform(key: any, coachingReportAzureData: any[] | undefined, uniqueStyle: string): string {
        const data = coachingReportAzureData?.find((el: any) => el?.uniqueStyleKey == key) || {}
        const formattedStyle = this.formatStyleName(uniqueStyle)
        return data ? data[formattedStyle] : ''
    }

    private formatStyleName(styleName: string): string {
        return styleName
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('')
    }
}
