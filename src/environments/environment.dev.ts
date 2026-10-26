// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,

    B2C_1_SignIn: 'https://dnabehaviorB2C.b2clogin.com/dnabehaviorB2C.onmicrosoft.com/B2C_1_SignIn',
    client_id: '8a1c1481-bd6b-4179-9183-1b98d886c58d',
    scope: 'https://dnabehaviorB2C.onmicrosoft.com/8a1c1481-bd6b-4179-9183-1b98d886c58d/user.read',
    discovery_app_url: 'https://devdiscovery.dnabehavior.com/',
    base_url: 'https://devapimanagementenvironment.azure-api.net/dev-private-api/',
    digitalScanApiUrl: 'https://devapimanagementenvironment.azure-api.net/digital-scan-api/Function',
    no_auth_url: 'https://devapimanagementenvironment.azure-api.net/token-less-api/',
    IDPinitiatedAPI_URL: 'https://devapimanagementenvironment.azure-api.net/dev-private-api-auth0/',
    Auth0ClientId: 'qlASK8FKkJY0m7s0htDc6uVitF9RtZ25',
    auth0Domain: 'sandboxdnabehavior.us.auth0.com',
    audience: 'https://uat.dnabehavior.com',
    subscription_url: 'https://www.billingportal.com/s/v2-1dev-clone',
    azureSharedAccessKey:
        '?sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2027-01-08T16:14:23Z&st=2026-03-09T07:59:23Z&spr=https&sig=<SAS_SIGNATURE>',
    azureTableUrl: 'https://sauatenvironment.table.core.windows.net',
    hosting_url: 'https://devadmin.dnabehavior.com/',
    authorityDomain: 'dnabehaviorB2C.b2clogin.com',
    mixpanelToken: 'cf8a21bc9b8250329d5e3f05c8d02c00',

    timeout: 30000,
}
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
