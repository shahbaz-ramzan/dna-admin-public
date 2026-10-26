import { LogLevel, Configuration, BrowserCacheLocation } from '@azure/msal-browser'
import { environment } from 'src/environments/environment'

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1

export const b2cPolicies = {
    names: {
        signUpSignIn: 'B2C_1_SignIn',
        editProfile: 'B2C_1_ProfileEdit',
    },
    authorities: {
        signUpSignIn: {
            authority: environment.B2C_1_SignIn,
        },
    },
    authorityDomain: environment.authorityDomain,
}

export const msalConfig: Configuration = {
    auth: {
        clientId: environment.client_id,
        authority: b2cPolicies.authorities.signUpSignIn.authority,
        knownAuthorities: [b2cPolicies.authorityDomain],
        postLogoutRedirectUri: '/login',
        redirectUri: '/',
    },
    cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage,
        storeAuthStateInCookie: isIE,
    },
    system: {
        loggerOptions: {
            logLevel: LogLevel.Verbose,
            piiLoggingEnabled: false,
        },
    },
}

export const protectedResources = {
    todoListApi: {
        endpoint: 'https://devapimanagementenvironment.azure-api.net/NaturalBehavior/GetUniqueStyleAndDescription/8fd0b993-9f0d-45cc-a2f7-a2a51905ddf1/22',
        scopes: [environment.scope],
    },
}
export const loginRequest = {
    scopes: [],
}
