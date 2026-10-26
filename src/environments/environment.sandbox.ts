// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,

    B2C_1_SignIn: 'https://sandboxdnabehavior.b2clogin.com/sandboxdnabehavior.onmicrosoft.com/B2C_1_SignIn',
    client_id: '2f4f928c-9f8b-45f9-a1f6-0467b51900b2',
    scope: 'https://sandboxdnabehavior.onmicrosoft.com/2f4f928c-9f8b-45f9-a1f6-0467b51900b2/user.read',
    base_url: 'https://apimsandboxenvironment.azure-api.net/sandbox-private-api/',
    digitalScanApiUrl: 'https://apimsandboxenvironment.azure-api.net/digital-scan-api/Function',
    no_auth_url: 'https://apimsandboxenvironment.azure-api.net/private-no-auth/',
    IDPinitiatedAPI_URL: 'https://api-sandbox.dnabehavior.com/sandbox-private-api-clone/',
    Auth0ClientId: '8OKIxbavQzvfwEmUwoKkPwGJtc56OS4v',
    auth0Domain: 'sandboxdnabehavior.us.auth0.com',
    audience: 'https://uat.dnabehavior.com',
    hosting_url: 'https://sandboxadmin.dnabehavior.com/',
    discovery_app_url: 'https://sandboxdiscovery.dnabehavior.com/',
    subscription_url: 'https://www.billingportal.com/s/v2-1sandbox',
    azureTableUrl: 'https://saproddnabehavior.table.core.windows.net',
    azureSharedAccessKey:
        '?sv=2024-11-04&ss=b&srt=sco&sp=rwdlaciytfx&se=2026-10-30T14:49:14Z&st=2026-03-25T06:34:14Z&spr=https&sig=<SAS_SIGNATURE>',
    authorityDomain: 'sandboxdnabehavior.b2clogin.com',
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
