import { Injectable } from '@angular/core'

// Fields read/written by TeamReportComponent's PDF pagination methods. TeamReportComponent passes
// itself (`this`) as the state argument to every method below, so all mutations here happen
// directly on the component instance's own fields.
export interface TeamReportPaginationState {
    selectedParticipantIds: any[]
    pageNumber: number
    appendixA: any[]
    appendixAPageNumber: any[]
    appendixB: any[]
    appendixBPageNumber: any[]
    behavioralStyles: any[]
    behavioralStylePageNumber: any[]
    uniqueStyles: any[]
    uniqueStylesPageNumber: any[]
    coreWorkLifeDrivers: any[]
    coreWorkLifeDriversPageNumber: any[]
    workLifePlanningDrivers: any[]
    workLifePlanningDriversPageNumber: any[]
    resultsVsRelationship: any[]
    resultVsRelationPageNumber: any[]
    relationshipFocusedParticipants: any[]
    resultsFocusedParticipants: any[]
    factor1: any
    factor2: any
    factor3: any
    factor4: any
    factor5: any
    factor6: any
    factor7: any
    factor8: any
}

@Injectable({ providedIn: 'root' })
export class TeamReportPaginationService {
    createAppendixAPages(state: TeamReportPaginationState) {
        const pages = Math.ceil(state.selectedParticipantIds.length / 5)
        let start = 0
        let end = 5
        for (let i = 0; i < pages; i++) {
            state.appendixA.push(state.selectedParticipantIds.slice(start, end))

            state.appendixAPageNumber.push(state.pageNumber)
            state.pageNumber++
            start = end
            end = end + 5
        }
    }

    createAppendixBPages(state: TeamReportPaginationState) {
        const pages = Math.ceil(state.selectedParticipantIds.length / 7)
        let start = 0
        let end = 7
        for (let i = 0; i < pages; i++) {
            state.appendixB.push(state.selectedParticipantIds.slice(start, end))

            state.appendixBPageNumber.push(state.pageNumber)
            state.pageNumber++
            start = end
            end = end + 7
        }
    }

    createBehavioralStylesPages(state: TeamReportPaginationState) {
        if (state.selectedParticipantIds.length > 10) {
            state.behavioralStyles.push(state.selectedParticipantIds.slice(0, 10))
            state.behavioralStylePageNumber.push(state.pageNumber)
            state.pageNumber++

            const pages = Math.ceil((state.selectedParticipantIds.length - 10) / 14)
            let start = 10
            let end = 23
            for (let i = 0; i < pages; i++) {
                state.behavioralStyles.push(state.selectedParticipantIds.slice(start, end))
                state.behavioralStylePageNumber.push(state.pageNumber)
                state.pageNumber++
                start = end
                end = end + 14
            }
        } else {
            state.behavioralStyles.push(state.selectedParticipantIds)
            state.behavioralStylePageNumber.push(state.pageNumber)
            state.pageNumber++
        }
    }

    createUniqueStylesPages(state: TeamReportPaginationState) {
        state.uniqueStylesPageNumber.push(state.pageNumber)
        state.pageNumber++

        const pages = Math.ceil(state.selectedParticipantIds.length / 16)
        let start = 0
        let end = 16
        for (let i = 0; i < pages; i++) {
            state.uniqueStyles.push(state.selectedParticipantIds.slice(start, end))
            state.uniqueStylesPageNumber.push(state.pageNumber)
            state.pageNumber++
            start = end
            end = end + 16
        }
        state.uniqueStylesPageNumber.pop() // removing page 7
        state.pageNumber--
    }

    createCoreDriversPages(state: TeamReportPaginationState) {
        if (state.selectedParticipantIds.length > 2 && state.selectedParticipantIds.length <= 5) {
            state.coreWorkLifeDrivers = []
            state.coreWorkLifeDrivers.push([state.factor1, state.factor2])
            state.coreWorkLifeDrivers.push([state.factor3, state.factor4, state.factor5])
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
        }
        if (state.selectedParticipantIds.length > 5 && state.selectedParticipantIds.length <= 10) {
            state.coreWorkLifeDrivers = []
            state.coreWorkLifeDrivers.push([state.factor1])
            state.coreWorkLifeDrivers.push([state.factor2, state.factor3])
            state.coreWorkLifeDrivers.push([state.factor4, state.factor5])

            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
        } else if (state.selectedParticipantIds.length > 10 && state.selectedParticipantIds.length <= 15) {
            state.coreWorkLifeDrivers = []
            state.coreWorkLifeDrivers.push([state.factor1])
            state.coreWorkLifeDrivers.push([state.factor2])
            state.coreWorkLifeDrivers.push([state.factor3])
            state.coreWorkLifeDrivers.push([state.factor4])
            state.coreWorkLifeDrivers.push([state.factor5])

            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
        } else if (state.selectedParticipantIds.length > 15) {
            const max_entries = Math.max(state.factor1.leftValues.length, state.factor1.rightValues.length, state.factor1.midValues.length)
            if (max_entries > 15) {
                state.coreWorkLifeDrivers = []
                const first_half_factor1 = {
                    factorName: 'Factor 1: Commanding',
                    leftLabel: 'Cooperative (Practical)',
                    rightLabel: 'Take Charge (Visionary)',
                    leftValues: state.factor1.leftValues.slice(0, 15),
                    rightValues: state.factor1.rightValues.slice(0, 15),
                    midValues: state.factor1.midValues.slice(0, 15),
                }
                const second_half_factor1 = {
                    factorName: 'Factor 1: Commanding',
                    leftLabel: 'Cooperative (Practical)',
                    rightLabel: 'Take Charge (Visionary)',
                    leftValues: state.factor1.leftValues.slice(15),
                    rightValues: state.factor1.rightValues.slice(15),
                    midValues: state.factor1.midValues.slice(15),
                }
                state.coreWorkLifeDrivers.push([first_half_factor1])
                state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
                state.pageNumber++
                this.fillCoreDriversForFactor(state, second_half_factor1)
            } else {
                state.coreWorkLifeDrivers = []
                state.coreWorkLifeDrivers.push([state.factor1])
                state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
                state.pageNumber++
            }

            this.fillCoreDriversForFactor(state, state.factor2)
            this.fillCoreDriversForFactor(state, state.factor3)
            this.fillCoreDriversForFactor(state, state.factor4)
            this.fillCoreDriversForFactor(state, state.factor5)
        }
    }

    createWorkLifeDriversPages(state: TeamReportPaginationState) {
        if (state.selectedParticipantIds.length >= 3 && state.selectedParticipantIds.length <= 4) {
            state.workLifePlanningDrivers = []
            state.workLifePlanningDrivers.push([state.factor6, state.factor7, state.factor8])
            state.workLifePlanningDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
        } else if (state.selectedParticipantIds.length > 4 && state.selectedParticipantIds.length <= 8) {
            state.workLifePlanningDrivers = []
            state.workLifePlanningDrivers.push([state.factor6, state.factor7])
            state.workLifePlanningDrivers.push([state.factor8])

            state.workLifePlanningDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.workLifePlanningDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
        } else if (state.selectedParticipantIds.length > 8 && state.selectedParticipantIds.length <= 20) {
            state.workLifePlanningDrivers = []
            state.workLifePlanningDrivers.push([state.factor6])
            state.workLifePlanningDrivers.push([state.factor7])
            state.workLifePlanningDrivers.push([state.factor8])

            state.workLifePlanningDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.workLifePlanningDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            state.workLifePlanningDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
        } else if (state.selectedParticipantIds.length > 20) {
            const max_entries = Math.max(state.factor6.leftValues.length, state.factor6.rightValues.length, state.factor6.midValues.length)
            if (max_entries > 20) {
                state.workLifePlanningDrivers = []
                const first_half_factor6 = {
                    factorName: 'Factor 6: Pioneering',
                    leftLabel: 'Content (Balanced)',
                    rightLabel: 'Pioneer (Goal Oriented)',
                    leftValues: state.factor1.leftValues.slice(0, 20),
                    rightValues: state.factor1.rightValues.slice(0, 20),
                    midValues: state.factor1.midValues.slice(0, 20),
                }
                const second_half_factor6 = {
                    factorName: 'Factor 6: Pioneering',
                    leftLabel: 'Content (Balanced)',
                    rightLabel: 'Pioneer (Goal Oriented)',
                    leftValues: state.factor1.leftValues.slice(20),
                    rightValues: state.factor1.rightValues.slice(20),
                    midValues: state.factor1.midValues.slice(20),
                }
                state.workLifePlanningDrivers.push([first_half_factor6])
                state.workLifePlanningDriversPageNumber.push(state.pageNumber)
                state.pageNumber++
                this.fillWorkDriversForFactor(state, second_half_factor6)
            } else {
                state.workLifePlanningDrivers = []
                state.workLifePlanningDrivers.push([state.factor6])
                state.workLifePlanningDriversPageNumber.push(state.pageNumber)
                state.pageNumber++
            }
            this.fillWorkDriversForFactor(state, state.factor7)
            this.fillWorkDriversForFactor(state, state.factor8)
        }
    }

    createResultVsRealtionPages(state: TeamReportPaginationState) {
        state.resultVsRelationPageNumber.push(state.pageNumber)
        state.pageNumber++
        const max_entries = Math.max(state.relationshipFocusedParticipants.length, state.resultsFocusedParticipants.length)
        const pages = Math.ceil(max_entries / 28)
        let start = 0
        let end = 28
        for (let i = 0; i < pages; i++) {
            state.resultsVsRelationship.push([
                {
                    resultsFocused: state.resultsFocusedParticipants.slice(start, end),
                    relationshipFocused: state.relationshipFocusedParticipants.slice(start, end),
                },
            ])
            state.resultVsRelationPageNumber.push(state.pageNumber)
            state.pageNumber++
            start = end
            end = end + 28
        }
    }

    fillCoreDriversForFactor(state: TeamReportPaginationState, factor: any) {
        const max_entries = Math.max(factor.leftValues.length, factor.rightValues.length, factor.midValues.length)
        const pages = Math.ceil(max_entries / 25)
        let start = 0
        let end = 25
        for (let i = 0; i < pages; i++) {
            state.coreWorkLifeDrivers.push([
                {
                    factorName: factor.factorName,
                    leftLabel: factor.leftLabel,
                    rightLabel: factor.rightLabel,
                    leftValues: factor.leftValues.slice(start, end),
                    rightValues: factor.rightValues.slice(start, end),
                    midValues: factor.midValues.slice(start, end),
                },
            ])
            state.coreWorkLifeDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            start = end
            end = end + 25
        }
    }

    fillWorkDriversForFactor(state: TeamReportPaginationState, factor: any) {
        const max_entries = Math.max(factor.leftValues.length, factor.rightValues.length, factor.midValues.length)
        const pages = Math.ceil(max_entries / 25)
        let start = 0
        let end = 25
        for (let i = 0; i < pages; i++) {
            state.workLifePlanningDrivers.push([
                {
                    factorName: factor.factorName,
                    leftLabel: factor.leftLabel,
                    rightLabel: factor.rightLabel,
                    leftValues: factor.leftValues.slice(start, end),
                    rightValues: factor.rightValues.slice(start, end),
                    midValues: factor.midValues.slice(start, end),
                },
            ])
            state.workLifePlanningDriversPageNumber.push(state.pageNumber)
            state.pageNumber++
            start = end
            end = end + 25
        }
    }
}
