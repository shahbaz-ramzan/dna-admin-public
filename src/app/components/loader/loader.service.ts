import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
    providedIn: 'root',
})
export class LoaderService {
    public isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
    private activeRequests = 0
    setLoading(loading: boolean) {
        if (loading) {
            this.activeRequests++
            // console.log(`📊 Active requests: ${this.activeRequests}`)
        } else {
            this.activeRequests = Math.max(0, this.activeRequests - 1)
            // console.log(`📊 Active requests: ${this.activeRequests}`)
        }

        const shouldShowLoader = this.activeRequests > 0
        if (this.isLoading.value !== shouldShowLoader) {
            this.isLoading.next(shouldShowLoader)
        }
    }
}
