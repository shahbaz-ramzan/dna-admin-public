import { Injectable } from '@angular/core'
import { Store } from '@ngrx/store'
import colorVariants from 'color-variants'
import { Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'

export interface AccountColorPayload {
    primaryColor: string
    secondaryColor: string
    secondaryColor2: string
}

/**
 * Shared across report components (comparison-report, team-report, ...) which each
 * independently duplicated this store-select + presence-check + color-variant logic.
 * Only the verbatim-identical parts are centralized here — each component keeps its own
 * primaryColor/secondaryColor/isColorDefault assignment branching, since that logic
 * differs subtly between components and unifying it would be a behavior change.
 */
@Injectable({ providedIn: 'root' })
export class ReportColorService {
    constructor(private store: Store<{ dashboardReducer: any }>) {}

    // Emits only once all 3 account colors are present in the store.
    accountColor$(): Observable<AccountColorPayload> {
        return this.store
            .select((state) => state.dashboardReducer)
            .pipe(
                filter(
                    (store) =>
                        !!store?.accountColorPayload?.data?.secondaryColor &&
                        !!store?.accountColorPayload?.data?.primaryColor &&
                        !!store?.accountColorPayload?.data?.secondaryColor2
                ),
                map((store) => store.accountColorPayload.data)
            )
    }

    getColorVariants(color: string): string[] {
        const colorsArr = colorVariants({
            base: color.trim(),
            dark: { steps: 2, darken: 0.9, hueShift: 20, saturate: -0.1 },
            light: { steps: 2, lighten: 0.5, hueShift: -10, saturate: 0.5 },
        })
        colorsArr.unshift(colorsArr.splice(2, 1)[0])
        return colorsArr
    }
}
