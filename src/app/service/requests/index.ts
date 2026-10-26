import { HttpHeaders } from '@angular/common/http'
import Encryption from 'src/app/util/Encryption'
import K from '../../constants'
export default class Request {
    url = ''
    method = ''
    body: any
    headers: any

    constructor(relativeURL: string, method = K.NETWORK.METHOD.GET, body = {}, headers = {}, token = '', isNoAuth = false) {
        const bearerToken = token ? token : Request.getToken() ?? ''
        headers = Request.getBasicHeaders(headers, bearerToken)

        if (isNoAuth) {
            this.url = K.NETWORK.URL.NO_AUTH_API + relativeURL
        } else {
            this.url = (localStorage.getItem('isFidelityUser') == 'true' ? K.NETWORK.URL.BASE_SSO_API : K.NETWORK.URL.BASE_API) + relativeURL
        }
        this.method = method
        this.body = body
        this.headers = headers
    }

    static getToken() {
        return Encryption.decryptData(localStorage.getItem(K.APP.ACCESS_TOKEN) || '')
    }

    static getBasicHeaders(extraHeaders: any, token: string): HttpHeaders {
        return new HttpHeaders({
            ...K.NETWORK.HEADER.DEFAULT(token),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
            'Content-Security-Policy': "frame-ancestors 'none'",
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'no-referrer',
            ...extraHeaders,
        })
    }
}
