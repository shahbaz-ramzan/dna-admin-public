import { Injectable } from '@angular/core'
import { HttpContextToken, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Observable } from 'rxjs'
import { LoaderService } from './loader.service'
import { finalize } from 'rxjs/operators'

/**
 * Opt-in flag for background/silent requests (e.g. SWR cache revalidation) that must not
 * trigger the global full-page loader. Defaults to false so existing requests are unaffected.
 */
export const SILENT_REQUEST = new HttpContextToken<boolean>(() => false)

@Injectable({
    providedIn: 'root',
})
export class InterceptorService implements HttpInterceptor {
    constructor(public loaderService: LoaderService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.context.get(SILENT_REQUEST)) {
            return next.handle(req)
        }

        this.loaderService.setLoading(true)
        return next.handle(req).pipe(
            finalize(() => {
                this.loaderService.setLoading(false)
            })
        )
    }
}
