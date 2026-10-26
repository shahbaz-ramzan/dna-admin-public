import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'
import { CreateItemData, ItemType, AppcuesItemPopoverComponent } from '../../common/appcues-item-popover/appcues-item-popover.component'
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component'
import { AppcuesService } from '../../../service/appcues.service'
import { MsgService } from '../../../service/msg.service'
import { SettingsCacheStorageService } from '../../../service/settings-cache-storage.service'

interface AppcuesTour {
    tourId: number
    tourKey: string
    version: number
    isActive: boolean
}

interface AppcuesBanner {
    bannerId: number
    bannerKey: string
    version: number
    isActive: boolean
}

interface ApiResponse {
    message: string
    data: AppcuesBanner[]
}

@Component({
    selector: 'app-appcues-management',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, LoadingSpinnerComponent, AppcuesItemPopoverComponent],
    templateUrl: './appcues-management.component.html',
    styleUrls: ['./appcues-management.component.scss'],
})
export class AppcuesManagementComponent implements OnInit {
    isLoading = false
    // Tours and banners load independently but share the one isLoading flag the template reads -
    // tracked separately so a cache hit on one (which can resolve synchronously) can't clear the
    // loader while the other is still a cold-cache, loader-visible fetch.
    private isToursLoading = false
    private isBannersLoading = false
    appcuesTours: AppcuesTour[] = []
    appcuesBanners: AppcuesBanner[] = []
    primaryColor: string = ''

    // Pagination state for tours
    toursTotalRecords = 0

    // Pagination state for banners
    bannersTotalRecords = 0

    // Popover state
    tourPopoverVisible = false
    bannerPopoverVisible = false
    isCreatingTour = false
    isCreatingBanner = false

    constructor(
        private appcuesService: AppcuesService,
        private msgService: MsgService,
        private settingsCache: SettingsCacheStorageService
    ) {
        // Get primary color from localStorage and set CSS custom property
        this.primaryColor = localStorage.getItem('primaryColor') || '#eead32'
        document.documentElement.style.setProperty('--primary-color', this.primaryColor)
    }

    ngOnInit(): void {
        this.loadAppcuesData()
    }

    private loadAppcuesData(): void {
        this.loadAppcuesBannersData()
        this.loadAppcuesToursData()
    }

    private applyToursResponse(response: any): void {
        if (response?.body?.data) {
            this.appcuesTours = response.body.data.map((tour: any) => ({
                tourId: tour.tourId,
                tourKey: tour.tourKey,
                version: tour.version,
                isActive: tour.isActive,
            }))
            this.toursTotalRecords = this.appcuesTours.length
        }
    }

    private applyBannersResponse(response: any): void {
        if (response?.body?.data) {
            this.appcuesBanners = response.body.data.map((banner: any) => ({
                bannerId: banner.bannerId,
                bannerKey: banner.bannerKey,
                version: banner.version,
                isActive: banner.isActive,
            }))
            this.bannersTotalRecords = this.appcuesBanners.length
        }
    }

    /**
     * Cache-first load, same TTL/fresh-window standard as the rest of Settings
     * (SettingsCacheStorageService) - global scope, no accountId, since Appcues tours/banners
     * aren't account-specific. `forceRefresh` (used after a create) skips the cache read so the
     * mutation's own success response is never shadowed by a stale entry.
     */
    private loadAppcuesToursData(forceRefresh = false): void {
        const cacheKey = this.settingsCache.buildKey('appcuesTours')
        const cached = forceRefresh ? undefined : this.settingsCache.get<any>(cacheKey)

        if (cached?.data) {
            this.applyToursResponse(cached.data)
            this.isToursLoading = false
        } else {
            this.isToursLoading = true
        }
        this.isLoading = this.isToursLoading || this.isBannersLoading

        // Cache hit: revalidate silently in the background (no loader). Miss: normal loader-visible fetch.
        this.appcuesService.getAllToursCall(!!cached?.data).subscribe({
            next: (response: any) => {
                this.settingsCache.setIfChanged(cacheKey, response)
                this.applyToursResponse(response)
                this.isToursLoading = false
                this.isLoading = this.isToursLoading || this.isBannersLoading
            },
            error: (error) => {
                console.error('Error loading tours:', error)
                this.isToursLoading = false
                this.isLoading = this.isToursLoading || this.isBannersLoading
                if (!cached?.data) {
                    // Fallback to empty array on a cold-cache error only - a background refresh
                    // failure must not wipe out data already on screen.
                    this.appcuesTours = []
                    this.toursTotalRecords = 0
                }
            },
        })
    }

    private loadAppcuesBannersData(forceRefresh = false): void {
        const cacheKey = this.settingsCache.buildKey('appcuesBanners')
        const cached = forceRefresh ? undefined : this.settingsCache.get<any>(cacheKey)

        if (cached?.data) {
            this.applyBannersResponse(cached.data)
            this.isBannersLoading = false
        } else {
            this.isBannersLoading = true
        }
        this.isLoading = this.isToursLoading || this.isBannersLoading

        this.appcuesService.getAllBannersCall(!!cached?.data).subscribe({
            next: (response: any) => {
                this.settingsCache.setIfChanged(cacheKey, response)
                this.applyBannersResponse(response)
                this.isBannersLoading = false
                this.isLoading = this.isToursLoading || this.isBannersLoading
            },
            error: (error) => {
                console.error('Error loading banners:', error)
                this.isBannersLoading = false
                this.isLoading = this.isToursLoading || this.isBannersLoading
                if (!cached?.data) {
                    this.appcuesBanners = []
                    this.bannersTotalRecords = 0
                }
            },
        })
    }

    addTour(): void {
        this.tourPopoverVisible = true
    }

    addBanner(): void {
        this.bannerPopoverVisible = true
    }

    onTourCreated(data: CreateItemData): void {
        this.isCreatingTour = true

        const payload = {
            tourKey: data.bannerkey?.trim(),
            version: parseInt(data.version),
        }

        this.appcuesService.createTourCall(payload).subscribe({
            next: () => {
                this.loadAppcuesToursData(true)
                this.tourPopoverVisible = false
                this.isCreatingTour = false
            },
            error: (error) => {
                this.isCreatingTour = false
                const errorMessage = this.extractErrorMessage(error)
                this.msgService.errorMessage(errorMessage)
                this.tourPopoverVisible = false
            },
        })
    }

    onBannerCreated(data: CreateItemData): void {
        this.isCreatingBanner = true

        const payload = {
            bannerKey: data.bannerkey?.trim(),
            version: parseInt(data.version),
        }

        this.appcuesService.createBannerCall(payload).subscribe({
            next: () => {
                this.loadAppcuesBannersData(true)
                this.bannerPopoverVisible = false
                this.isCreatingBanner = false
            },
            error: (error) => {
                this.isCreatingBanner = false
                // Extract error message from API response and show in toast
                const errorMessage = this.extractErrorMessage(error)
                this.msgService.errorMessage(errorMessage)
                this.bannerPopoverVisible = false
            },
        })
    }

    onTourCancelled(): void {
        this.tourPopoverVisible = false
    }

    onBannerCancelled(): void {
        this.bannerPopoverVisible = false
    }

    onTourVisibleChange(visible: boolean): void {
        this.tourPopoverVisible = visible
    }

    onBannerVisibleChange(visible: boolean): void {
        this.bannerPopoverVisible = visible
    }

    private extractErrorMessage(error: any): string {
        // Handle both HTTP errors and business logic errors
        const errorData = error?.error || error

        // Check for nested error structures (business logic errors)
        if (errorData?.errors?.collections?.error) {
            return errorData.errors.collections.error
        }

        // Check for direct message properties
        if (errorData?.message) {
            return errorData.message
        }

        // Handle string errors
        if (typeof errorData === 'string') {
            return errorData
        }

        return 'An error occurred while creating the item. Please try again.'
    }
}
