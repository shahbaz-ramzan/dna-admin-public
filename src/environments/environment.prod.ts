// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: true,
    B2C_1_SignIn: 'https://proddnabehavior.b2clogin.com/proddnabehavior.onmicrosoft.com/B2C_1_SignIn',
    client_id: 'a90700f2-c540-41c1-90b7-278170352b41',
    scope: 'https://proddnabehavior.onmicrosoft.com/a90700f2-c540-41c1-90b7-278170352b41/user.read',
    base_url: 'https://apimprodenvironment.azure-api.net/prod-private-api/',
    digitalScanApiUrl: 'https://apimprodenvironment.azure-api.net/digital-scan-api/Function',
    IDPinitiatedAPI_URL: 'https://api.dnabehavior.com/prod-private-api-auth0/',
    no_auth_url: 'https://apimprodenvironment.azure-api.net/private-no-auth/',
    hosting_url: 'https://app.dnabehavior.com/',
    Auth0ClientId: 'lAdoHInfRMbD4Erte6liFnZ0PwoAaPDb',
    auth0Domain: 'proddnabehavior.us.auth0.com',
    audience: 'https://api.dnabehavior.com',
    discovery_app_url: 'https://discovery.dnabehavior.com/',
    subscription_url: 'https://www.billingportal.com/s/dna-behavior-solutions-llc',
    azureTableUrl: 'https://saproddnabehavior.table.core.windows.net',
    azureSharedAccessKey:
        '?sv=2024-11-04&ss=b&srt=sco&sp=rwdlaciytfx&se=2026-10-30T14:49:14Z&st=2026-03-25T06:34:14Z&spr=https&sig=<SAS_SIGNATURE>',
    authorityDomain: 'proddnabehavior.b2clogin.com',
    mixpanelToken: 'b753c1db4eef823d93fef5a6cc105892',
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
