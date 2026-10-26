// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export interface Environment {
    production: boolean
    B2C_1_SignIn: string
    client_id: string
    scope: string
    base_url: string
    no_auth_url: string
    IDPinitiatedAPI_URL: string
    digitalScanApiUrl: string
    Auth0ClientId: string
    auth0Domain: string
    audience: string
    hosting_url: string
    discovery_app_url: string
    subscription_url: string
    azureTableUrl: string
    azureSharedAccessKey: string
    timeout: number
    mixpanelToken: string
    authorityDomain: string
    // apiUrl: string
}

declare const process: {
    env: {
        [key: string]: string
    }
}

export const environment: Environment = {
    production: process.env['PRODUCTION'] === 'true',
    B2C_1_SignIn: process.env['B2C_1_SIGNIN'],
    client_id: process.env['CLIENT_ID'],
    scope: process.env['SCOPE'],
    base_url: process.env['BASE_URL'],
    no_auth_url: process.env['NO_AUTH_URL'],
    IDPinitiatedAPI_URL: process.env['IDP_INITIATED_API_URL'],
    digitalScanApiUrl: process.env['DIGITAL_SCAN_API_URL'],
    Auth0ClientId: process.env['AUTH0_CLIENT_ID'],
    auth0Domain: process.env['AUTH0_DOMAIN'],
    audience: process.env['AUDIENCE'],
    hosting_url: process.env['HOSTING_URL'],
    discovery_app_url: process.env['DISCOVERY_APP_URL'],
    subscription_url: process.env['SUBSCRIPTION_URL'],
    azureTableUrl: process.env['AZURE_TABLE_URL'],
    azureSharedAccessKey: process.env['AZURE_SHARED_ACCESS_KEY'],
    timeout: parseInt(process.env['TIMEOUT'], 10),
    mixpanelToken: process.env['MIXPANEL_TOKEN'],
    authorityDomain: process.env['AUTHORITY_DOMAIN'],
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
