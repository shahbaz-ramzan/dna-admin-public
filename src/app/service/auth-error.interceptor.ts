import { HttpContextToken, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import K from '../constants'
import { AppService } from './app.service'

/**
 * Opt-in flag: only requests explicitly marked with this context (currently just
 * NetworkService.httpCall(), i.e. our own backend) get 401 -> logout handling. HTTP_INTERCEPTORS
 * apply to every HttpClient call app-wide, including third-party APIs called directly (e.g.
 * chatbot.component.ts's WonderChat integration) - those must NOT trigger a session logout just
 * because an unrelated external service returned its own 401.
 */
export const HANDLE_AUTH_ERROR = new HttpContextToken<boolean>(() => false)

@Injectable({
    providedIn: 'root',
})
export class AuthErrorInterceptor implements HttpInterceptor {
    constructor(private appService: AppService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!req.context.get(HANDLE_AUTH_ERROR)) {
            return next.handle(req)
        }
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === K.NETWORK.STATUS_CODE.UNAUTHORIZED) {
                    this.appService.logout()
                }
                return throwError(() => error)
            })
        )
    }
}
