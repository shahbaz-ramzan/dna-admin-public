import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

if (environment.production) {
    enableProdMode()
}

// Apply the last-known account brand colors before Angular bootstraps. Dozens of chart/report
// components read `--primary-color`/`--secondary-color`/`--secondary-color2` once, at
// construction time - without this they'd always see the SCSS default (orange) on first paint
// and only pick up the real color once nav-bar's account-color API call resolves and patches
// these CSS vars, causing a visible default-to-brand color flash on every refresh even though
// the correct color was already sitting in localStorage from the last successful fetch.
const cachedPrimaryColor = localStorage.getItem('primaryColor')
const cachedSecondaryColor = localStorage.getItem('secondaryColor')
const cachedSecondaryColor2 = localStorage.getItem('secondaryColor2')
if (cachedPrimaryColor) document.documentElement.style.setProperty('--primary-color', cachedPrimaryColor)
if (cachedSecondaryColor) document.documentElement.style.setProperty('--secondary-color', cachedSecondaryColor)
if (cachedSecondaryColor2) document.documentElement.style.setProperty('--secondary-color2', cachedSecondaryColor2)

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err))
