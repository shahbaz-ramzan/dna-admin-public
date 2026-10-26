import * as CryptoJS from 'crypto-js'
import K from '../constants'

/**
 * NOT a security boundary. K.APP.ENCRYPTION_KEY is a static literal shipped in the compiled
 * client bundle, so anyone who can read it (view-source, devtools, a browser extension, or an
 * XSS payload) can decrypt anything encrypted here - including the access token stored via this
 * class in localStorage (see auth.guard.ts, network.service.ts, service/requests/index.ts). This
 * only obfuscates localStorage values from casual inspection; it provides no confidentiality
 * against a motivated attacker or a compromised page. Do not "fix" this by rotating or hardening
 * the key - a client-side key is fundamentally unable to keep a secret. Protecting the access
 * token requires moving it out of client-readable storage entirely (e.g. an httpOnly cookie set
 * by the backend), which is backend-coordinated work, not something this class can provide.
 */
export default class Encryption {
    static encryptData(data: string) {
        return CryptoJS.AES.encrypt(data, K.APP.ENCRYPTION_KEY).toString()
    }

    static decryptData(encryptedMessage: string | null) {
        if (encryptedMessage) {
            return CryptoJS.AES.decrypt(encryptedMessage, K.APP.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)
        } else {
            return ''
        }
    }
}
