import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import copy from 'fast-copy'
import * as moment from 'moment'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { SidebarModule } from 'primeng/sidebar'
import { ButtonModule } from 'primeng/button'
import { RippleModule } from 'primeng/ripple'
import { CheckboxModule } from 'primeng/checkbox'
import { RadioButtonModule } from 'primeng/radiobutton'
import { CalendarModule } from 'primeng/calendar'
import { SliderModule } from 'primeng/slider'
import { InputTextModule } from 'primeng/inputtext'
import K from 'src/app/constants'
import { MsgService } from 'src/app/service/msg.service'
import { FilterItem } from '../../../../models/FilterItem'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

export interface UserFiltersPayload {
    tagIds: number[]
    isTagIdsFilterApplied: boolean
    uniqueStyle: string[]
    isUniqueStyleFilterApplied: boolean
    scheduled: boolean
    inProgress: boolean
    completed: boolean
    isStatusFilterApplied: boolean
    isDateFilterApplied: boolean
    fromDate: string
    toDate: string
    isFactorAndSubFactorFilterApplied: boolean
    factorAndSubFactor: any
}

@Component({
    selector: 'app-user-filters-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SidebarModule,
        ButtonModule,
        RippleModule,
        CheckboxModule,
        RadioButtonModule,
        CalendarModule,
        SliderModule,
        InputTextModule,
    ],
    templateUrl: './user-filters-sidebar.component.html',
    styleUrls: ['./user-filters-sidebar.component.scss'],
})
export class UserFiltersSidebarComponent implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef)
    @Input() visible = false
    @Input() permissionObject: any = {}
    @Input() rawTags: any[] | null = null
    @Input() selectedPersons: string[] = []

    @Output() visibleChange = new EventEmitter<boolean>()
    @Output() filtersApplied = new EventEmitter<UserFiltersPayload>()
    @Output() filtersReset = new EventEmitter<UserFiltersPayload>()
    // Emitted once this component finishes hydrating its filter state from the URL's query
    // params (tags/uniqueStyle/status/date/factors) - e.g. after a page refresh with filters
    // already in the URL. Unlike filtersApplied, this does NOT open/close the panel; it just
    // tells the parent "here's what the URL says is actually active" so its first fetch uses
    // the real filters instead of the default (no-filters) payload.
    @Output() filtersHydrated = new EventEmitter<UserFiltersPayload>()

    showCustomRangeFilter: boolean
    uniqueStyles: any[]
    statuses: any[]
    completetionDate: any[]
    toDate: any
    startDate: any
    selectedFilters: any = {}
    byFactors: any
    bySubFactors: any
    insights: string[]
    tags: any[] = []
    selectedCompletionDate: any
    isFactorAndSubFactorFilterApplied = false
    currentDate: Date = new Date()

    private readonly _factorInputChange$ = new Subject<{ i: number; from: number; to: number; factors: any }>()
    // The parent rebuilds its `rawTags` array reference on every store emission (not just when
    // tags actually change), so ngOnChanges/buildTagsFromResponse re-runs far more often than
    // "tags actually changed". filtersHydrated must only ever fire once, on true initial
    // hydration - otherwise it re-triggers a fetch, which changes the store, which rebuilds
    // rawTags again, which re-emits again: an infinite loop.
    private hasEmittedHydratedFilters = false

    constructor(private route: ActivatedRoute, private router: Router, private msgService: MsgService) {
        this.showCustomRangeFilter = false
        this.initValues()
    }

    ngOnInit(): void {
        this._factorInputChange$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(({ i, from, to, factors }) => {
            this.onFactorsAndSubFactorsInputChange(i, from, to, factors)
        })

        this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap: any) => {
            const params = paramMap.params

            this.setFiltersFromRoute(params.uniqueStyle, this.uniqueStyles)
            this.setFiltersFromRoute(params.status, this.statuses)

            if (params.completionDate) {
                this.selectedCompletionDate = params.completionDate
                if (this.selectedCompletionDate == 'Custom Range') {
                    if (params.From) {
                        this.startDate = params.From
                        this.startDate = new Date(this.startDate)
                    }
                    this.toDate = params.To
                    if (this.toDate) {
                        this.toDate = new Date(this.toDate)
                    }
                    this.showCustomRangeFilter = true
                }
            }
            for (const param in params) {
                for (let i = 0; i < this.byFactors.length; i++) {
                    if (param == this.byFactors[i].name1) {
                        this.isFactorAndSubFactorFilterApplied = true
                        const newRangeValues = params[param].split(',')
                        this.byFactors[i].rangeValues = newRangeValues
                        break
                    }
                }

                for (let i = 0; i < this.bySubFactors.length; i++) {
                    if (param == this.bySubFactors[i].name1) {
                        this.isFactorAndSubFactorFilterApplied = true
                        const newRangeValues = params[param].split(',')
                        this.bySubFactors[i].rangeValues = newRangeValues
                        break
                    }
                }
            }
        })
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rawTags) {
            this.buildTagsFromResponse(this.rawTags)
        }
    }

    private buildTagsFromResponse(tempTags: any[] | null) {
        if (!tempTags) return
        this.tags = [
            {
                name: 'All Tags',
                value: false,
            },
        ]
        tempTags.map((item: any) => {
            const tag = {
                name: item.tag || item.name,
                value: item.value ? true : false,
                id: item.tagId ? item.tagId : item.id,
            }
            this.tags.push(tag)
        })
        const params = (this.route.snapshot.queryParamMap as any).params
        this.setFiltersFromRoute(params.tags, this.tags)

        // Tags arrive last (async, once the parent's own tags fetch resolves) - by this point
        // route-based hydration (uniqueStyle/status/date/factors, done in ngOnInit) has already
        // run, so this is the point where the full filter state first reflects the URL. Only
        // emit once (see hasEmittedHydratedFilters) - the parent rebuilds rawTags's reference on
        // every store emission, not just when tags actually change, so this method re-runs far
        // more often than "tags actually changed".
        if (!this.hasEmittedHydratedFilters) {
            this.hasEmittedHydratedFilters = true
            const payload = this.buildPayload()
            if (payload) {
                this.filtersHydrated.emit(payload)
            }
        }
    }

    initValues() {
        this.byFactors = JSON.parse(JSON.stringify(K.APP.BY_FACTORS))
        this.bySubFactors = JSON.parse(JSON.stringify(K.APP.BY_SUB_FACTORS))
        this.uniqueStyles = JSON.parse(JSON.stringify(K.APP.UNIQUE_STYLES))
        this.statuses = JSON.parse(JSON.stringify(K.APP.STATUSES))
        this.completetionDate = JSON.parse(JSON.stringify(K.APP.COMPLETION_DATES))
    }

    trackTag(tag: any): string {
        return tag?.id ?? tag?.name
    }

    setFiltersFromRoute(param: any, currentList: FilterItem[]) {
        if (param) {
            const totalItems = param.split(',')
            for (let i = 0; i < currentList.length; i++) {
                if (totalItems.includes(currentList[i].name)) {
                    currentList[i].value = true
                } else if (i == 0 && totalItems.length == currentList.length - 1) {
                    currentList[0].value = true
                }
            }
        }
    }

    close() {
        this.visible = false
        this.visibleChange.emit(false)
    }

    onVisibleChange(value: boolean) {
        this.visible = value
        this.visibleChange.emit(value)
    }

    resetFilters() {
        this.initValues()

        this.tags.forEach((item) => (item.value = false))
        this.uniqueStyles.forEach((item) => (item.value = false))
        this.statuses.forEach((item) => (item.value = false))
        this.isFactorAndSubFactorFilterApplied = false
        this.selectedCompletionDate = ''
        this.selectedFilters = {}
        const params: any = {}
        if (this.selectedPersons.length > 0) params['selectedParticipants'] = this.selectedPersons.toString()
        if (this.selectedPersons.length == 0) delete params['selectedParticipants']
        delete params['accountId']
        // Wait for this navigate to resolve before emitting filtersReset: the parent's handler
        // (main-users.component.ts's onFiltersReset -> updatePageQueryParam) reads
        // route.snapshot.queryParams, which isn't updated until THIS navigation completes -
        // emitting synchronously right after issuing it let the parent read the stale,
        // pre-reset params and re-navigate with them, undoing this reset in the URL.
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: params,
            })
            .then(() => {
                const payload = this.buildPayload()
                if (payload) {
                    this.filtersReset.emit(payload)
                }
            })
        this.close()
    }

    applyFilters() {
        const payload = this.buildPayload()
        if (!payload) return
        this.filtersApplied.emit(payload)
        this.close()
    }

    private buildPayload(): UserFiltersPayload | null {
        const tagIds: number[] = []
        const uniqueStyle: string[] = []
        let scheduled = false
        let inProgress = false
        let completed = false
        let isDateFilterApplied = false
        let fromDate = ''
        let toDate = ''
        const factorAndSubFactor: any = {}

        this.tags.map((item: any) => {
            if (item.id && item.value) tagIds.push(item.id)
        })

        this.uniqueStyles.map((item: any) => {
            if (item.id && item.value) uniqueStyle.push(item.id)
        })

        this.statuses.map((item: any) => {
            if (item.value) {
                if (item.name === 'Scheduled') {
                    scheduled = true
                } else if (item.name == 'In Progress') {
                    inProgress = true
                } else if (item.name == 'Completed') {
                    completed = true
                }
            }
        })

        if (this.selectedCompletionDate) {
            if (this.selectedCompletionDate == 'Anytime') {
                isDateFilterApplied = false
                fromDate = ''
                toDate = ''
            } else isDateFilterApplied = true

            this.currentDate = new Date()
            switch (this.selectedCompletionDate) {
                case 'Past Day':
                    this.currentDate.setDate(new Date().getDate() - 1)
                    fromDate = this.formatDateToISO(this.currentDate)
                    toDate = fromDate
                    break
                case 'Past Week':
                    this.currentDate.setDate(new Date().getDate() - 7)
                    fromDate = this.formatDateToISO(this.currentDate)
                    toDate = this.formatDateToISO(new Date())
                    break
                case 'Past Month':
                    this.currentDate.setMonth(new Date().getMonth() - 1)
                    fromDate = this.formatDateToISO(this.currentDate)
                    toDate = this.formatDateToISO(new Date())
                    break
                case 'Past Year':
                    this.currentDate.setFullYear(new Date().getFullYear() - 1)
                    fromDate = this.formatDateToISO(this.currentDate)
                    toDate = this.formatDateToISO(new Date())
                    break
                case 'Custom Range':
                    if (this.startDate && this.toDate) {
                        fromDate = this.formatDateToISO(this.startDate)
                        toDate = this.formatDateToISO(this.toDate)
                    } else {
                        this.msgService.errorMessage('Please select From and To dates')
                        return null
                    }
                    break
            }
        }

        if (this.isFactorAndSubFactorFilterApplied) {
            K.APP.FACTOR_KEYS.map((item, i) => {
                factorAndSubFactor[item] = `${this.byFactors[i].rangeValues[0]},${this.byFactors[i].rangeValues[1]}`
            })
            K.APP.SUB_FACTOR_KEYS.map((item, i) => {
                factorAndSubFactor[item] = `${this.bySubFactors[i].rangeValues[0]},${this.bySubFactors[i].rangeValues[1]}`
            })
        }

        return {
            tagIds,
            isTagIdsFilterApplied: tagIds.length > 0,
            uniqueStyle,
            isUniqueStyleFilterApplied: uniqueStyle.length > 0,
            scheduled,
            inProgress,
            completed,
            isStatusFilterApplied: scheduled || inProgress || completed,
            isDateFilterApplied,
            fromDate,
            toDate,
            isFactorAndSubFactorFilterApplied: this.isFactorAndSubFactorFilterApplied,
            factorAndSubFactor,
        }
    }

    formatDateToISO(date: Date) {
        return moment(date).format('YYYY-MM-DDTHH:mm:ss.sssZ')
    }

    onFactorsAndSubFactorsInputDebounced(i: number, from: number, to: number, factors: any) {
        this._factorInputChange$.next({ i, from, to, factors })
    }

    onFactorsAndSubFactorsInputChange(i: number, from: number, to: number, factors: any) {
        this.isFactorAndSubFactorFilterApplied = true
        factors.rangeValues = [from, to]
        const params = { ...this.route.snapshot.queryParams, [factors.name1]: factors.rangeValues.toString() }
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: params,
        })
    }

    changeRadio() {
        if (this.selectedCompletionDate == 'Custom Range') {
            this.showCustomRangeFilter = true
            const params = { ...this.route.snapshot.queryParams, completionDate: this.selectedCompletionDate }
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: params,
            })
        } else {
            this.showCustomRangeFilter = false
            const params: any = copy(this.route.snapshot.queryParams)

            if (this.selectedCompletionDate != 'Custom Range') {
                params.From = null
                params.To = null
                this.startDate = ''
                this.toDate = ''
                delete params.From
                delete params.To
                params.completionDate = this.selectedCompletionDate
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: params,
                    skipLocationChange: true,
                })
            }
        }
    }

    numbersOnlyValidation(event: any, digits: any, index: number): boolean {
        const charCode = event.which ? event.which : event.keyCode
        if (charCode < 48 || charCode > 57 || String(digits.rangeValues[index]).length >= 2) {
            return false
        }
        return true
    }

    validateFactorsAndSubFactorsInput(obj: any, loopINdex: number, i: number) {
        if (i == 0) {
            if (obj.rangeValues[i] < 20) {
                obj.rangeValues[i] = 20
            }
            if (obj.rangeValues[i] > 80 || obj.rangeValues[i] > obj.rangeValues[i + 1]) {
                if (obj.rangeValues[i] > 80) {
                    obj.rangeValues[i] = 80
                }
                if (obj.rangeValues[i] > obj.rangeValues[i + 1]) {
                    obj.rangeValues[i] = obj.rangeValues[i + 1]
                }
            }
        }
        if (i == 1) {
            if (obj.rangeValues[i] > 80) {
                obj.rangeValues[i] = 80
            }
            if (obj.rangeValues[i] > 80 || obj.rangeValues[i] < obj.rangeValues[i - 1]) {
                if (obj.rangeValues[i] > 80) {
                    obj.rangeValues[i] = 80
                }
                if (obj.rangeValues[i] < obj.rangeValues[i - 1]) {
                    obj.rangeValues[i] = obj.rangeValues[i - 1]
                }
            }
        }
    }

    onFilterChange(objKey: string, index: number, objects: FilterItem[]) {
        if (objKey === 'tags' || objKey === 'status' || objKey === 'uniqueStyle') {
            //functionality for select/unselect all items
            if (index == 0) {
                for (let i = 1; i < objects.length; i++) {
                    objects[i].value = objects[0].value ? true : false
                }
            } else {
                objects[0].value = false
            }
        }

        if (objKey == 'tags') {
            this.tags = objects
        }

        this.selectedFilters[objKey] = objects
        this.selectedFilters[objKey] = this.selectedFilters[objKey].filter((item: FilterItem, index: number) => item.value != false && index != 0) //checking which filters are active

        let params: any = this.route.snapshot.queryParams
        for (const key in this.selectedFilters) {
            const tempFilter: string[] = []
            for (let i = 0; i < this.selectedFilters[key]?.length; i++) {
                tempFilter.push(this.selectedFilters[key][i].name)
            }
            params = {
                ...params,
                [key]: tempFilter?.toString(),
            }
        }
        if (this.selectedFilters[objKey]?.length == 0) {
            delete this.selectedFilters[objKey]
            delete params[objKey]
        }
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: params,
            skipLocationChange: true,
        })
    }

    onDateSelected(dateRange: string, date: any) {
        if (dateRange == 'From') {
            this.startDate = date
        } else this.toDate = date

        const params: any = {
            ...this.route.snapshot.queryParams,
            [dateRange]: moment(date).format('MM/DD/YYYY'),
        }
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: params,
            skipLocationChange: true,
        })
    }
}
