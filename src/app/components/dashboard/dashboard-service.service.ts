import { Injectable } from '@angular/core'
import { NetworkService } from 'src/app/service/network.service'
import { DashboardRequests } from 'src/app/service/requests/dashboard-requests'

// Dashboard widgets are read-only snapshots re-requested on every init; a short cache
// coalesces duplicate calls for the same account within the window instead of re-fetching.
const DASHBOARD_CACHE_TTL_MS = 30_000

@Injectable({
    providedIn: 'root',
})
export class DashboardServiceService {
    constructor(private networkService: NetworkService) {}

    getMarketMoodCall(accountId: string, silent = false) {
        return this.networkService.httpCall(DashboardRequests.getMarketMood(accountId), DASHBOARD_CACHE_TTL_MS, silent)
    }

    getProfilePictureCall(accountId: string) {
        return this.networkService.httpCall(DashboardRequests.getProfilePicture(accountId), DASHBOARD_CACHE_TTL_MS)
    }

    getUniqueStyleGraphCall(accountId: any, silent = false) {
        return this.networkService.httpCall(DashboardRequests.getUniqueStyleGraph(accountId), DASHBOARD_CACHE_TTL_MS, silent)
    }
    getAllAccountsByPersonIdCall(personId: string) {
        return this.networkService.httpCall(DashboardRequests.getAllAccountsByPersonId(personId), DASHBOARD_CACHE_TTL_MS)
    }
    getAccountColorCall(accountId: string) {
        return this.networkService.httpCall(DashboardRequests.getAccountColor(accountId), DASHBOARD_CACHE_TTL_MS)
    }

    getLastCompletionsCall(accountId: string, silent = false) {
        return this.networkService.httpCall(DashboardRequests.getLastCompletions(accountId), DASHBOARD_CACHE_TTL_MS, silent)
    }

    getRecentActivitiesCall(accountId: string, silent = false) {
        return this.networkService.httpCall(DashboardRequests.getRecentActivities(accountId), DASHBOARD_CACHE_TTL_MS, silent)
    }

    toDataURL(url: any, callback: any) {
        const xhr = new XMLHttpRequest()
        xhr.onload = function () {
            const reader = new FileReader()
            reader.onloadend = function () {
                const base64Image = reader.result?.toString().replace('application/octet-stream', 'image/jpeg')
                callback(base64Image)
            }
            reader.readAsDataURL(xhr.response)
        }
        xhr.open('GET', url)
        xhr.responseType = 'blob'
        xhr.send()
    }
    parseBehaviorBiasesList(behavioralBiases: any) {
        const biasesList: any[] = []

        Object.keys(behavioralBiases ?? []).forEach((bIndex: any) => {
            if (typeof behavioralBiases[bIndex] === 'object') biasesList.push(behavioralBiases[bIndex])
        })
        biasesList.sort((a: any, b: any) => b.population - a.population)
        return biasesList
    }
    removeBoldTagFromMoodData(mood: any) {
        return mood?.map((moodData: any) => {
            return {
                heading: moodData.heading.replace(/<b>|<\/b>/g, ''),
                description: moodData.description,
            }
        })
    }

    parseFDNAandBDNAObjects(insightsRawData: any) {
        const insights: any[] = []
        Object.keys(insightsRawData ?? []).forEach((ins: any) => {
            if (typeof insightsRawData[ins] === 'object') {
                const splittedTitle = ins.split(/(?=[A-Z])/).join(' ')
                const normalizedTitle = splittedTitle.charAt(0).toUpperCase() + splittedTitle.slice(1)
                const insObject = {
                    key: ins,
                    title: normalizedTitle,
                    ...insightsRawData[ins],
                }
                insights.push(insObject)
            }
        })

        return insights
    }
}
