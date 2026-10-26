import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { TimeoutError } from 'rxjs'
import Request from './requests'
import { NetworkService } from './network.service'

describe('NetworkService - request timeout', () => {
    let service: NetworkService
    let httpMock: HttpTestingController

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        })
        service = TestBed.inject(NetworkService)
        httpMock = TestBed.inject(HttpTestingController)
    })

    afterEach(() => httpMock.verify())

    it('errors with a TimeoutError when the backend never responds within K.NETWORK.URL.TIMEOUT', fakeAsync(() => {
        // Regression test for review item #7: a hung request used to produce no error at all -
        // no HttpErrorResponse, no ApiError, no toast - just a global loader spinning forever.
        let captured: unknown
        service.httpCall(new Request('some/slow/endpoint', 'GET')).subscribe({
            error: (err) => (captured = err),
        })

        httpMock.expectOne((r) => r.url.includes('some/slow/endpoint'))
        tick(30_001) // one tick past K.NETWORK.URL.TIMEOUT (30_000ms in this environment)

        // The timeout() operator unsubscribes from the underlying request once it fires, so
        // HttpTestingController considers it cancelled (not pending) - nothing left to flush.
        expect(captured instanceof TimeoutError).toBeTrue()
    }))

    it('does not time out a request that responds well within the window', fakeAsync(() => {
        let captured: unknown
        service.httpCall(new Request('some/fast/endpoint', 'GET')).subscribe({
            next: (res) => (captured = res),
        })

        const req = httpMock.expectOne((r) => r.url.includes('some/fast/endpoint'))
        tick(50)
        req.flush({ data: 'ok' })
        tick(0)

        expect(captured).toBeTruthy()
    }))
})
