import { Injectable } from '@angular/core'
import { ShepherdService } from 'angular-shepherd'
import { Router, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators'

@Injectable({
    providedIn: 'root',
})
export class TourManagerService {
    private activeTourComponent: string | null = null

    constructor(
        private shepherdService: ShepherdService,
        private router: Router
    ) {
        // Listen for route changes and cleanup tours
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.cleanupAllTours()
        })
    }

    /**
     * Register a component as having an active tour
     */
    setActiveTourComponent(componentName: string): void {
        this.activeTourComponent = componentName
    }

    /**
     * Clear the active tour component
     */
    clearActiveTourComponent(): void {
        this.activeTourComponent = null
    }

    /**
     * Get the currently active tour component
     */
    getActiveTourComponent(): string | null {
        return this.activeTourComponent
    }

    /**
     * Check if a tour is currently active
     */
    isTourActive(): boolean {
        return this.shepherdService.isActive
    }

    /**
     * Cancel any active tour
     */
    cancelActiveTour(): void {
        if (this.shepherdService.isActive) {
            this.shepherdService.cancel()
            this.clearActiveTourComponent()
        }
    }

    /**
     * Complete any active tour
     */
    completeActiveTour(): void {
        if (this.shepherdService.isActive) {
            this.shepherdService.complete()
            this.clearActiveTourComponent()
        }
    }

    /**
     * Cleanup all tours (used during navigation)
     */
    cleanupAllTours(): void {
        if (this.shepherdService.isActive) {
            this.shepherdService.cancel()
            this.clearActiveTourComponent()
        }
    }

    /**
     * Start a tour and register the component
     */
    startTour(componentName: string): void {
        // Cancel any existing tour first
        this.cleanupAllTours()

        // Set the active component
        this.setActiveTourComponent(componentName)

        // Start the tour
        this.shepherdService.start()
    }

    /**
     * Reset tour state completely (useful when switching between different tour flows)
     */
    resetTourState(): void {
        this.cleanupAllTours()
        // Additional reset if needed
        this.shepherdService.modal = false
        this.shepherdService.confirmCancel = false
    }

    /**
     * Force cleanup when switching between different tour flows
     */
    forceCleanupForTourSwitch(): void {
        if (this.shepherdService.isActive) {
            this.shepherdService.cancel()
        }
        // Clear steps only when switching between different tour flows
        this.shepherdService.addSteps([])
        this.clearActiveTourComponent()
    }

    /**
     * Check if a specific component has an active tour
     */
    hasActiveTour(componentName: string): boolean {
        return this.activeTourComponent === componentName && this.shepherdService.isActive
    }
}
