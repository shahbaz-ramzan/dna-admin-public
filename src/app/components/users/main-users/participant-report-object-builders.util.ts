// Pure mapping functions for building the FDNA-score and work-talents card view-models from a
// raw NgRx payload's `data` field. Was previously duplicated 3 times total (1 copy in
// single-user-selection, 2 copies — one per participant — in double-user-selection).

export interface FdnaScoreEntry {
    value: number
    title: string
    description: string
}

export interface WorkTalentEntry {
    value: number
    comparison1: string
    comparison2: string
    description: string
    label: string
}

export function buildFdnaScoresObject(data: any): FdnaScoreEntry[] {
    if (data == undefined) return []
    return [
        {
            value: data?.riskBehavior.value,
            title: 'Risk Behavior',
            description: data?.riskBehavior.description,
        },
        {
            value: data?.financialRelationshipManagement.value,
            title: 'Financial Relationship Management',
            description: data?.financialRelationshipManagement.description,
        },
        {
            value: data?.financialPlanningManagement.value,
            title: 'Financial Planning Management',
            description: data?.financialPlanningManagement.description,
        },
        {
            value: data?.wealthBuildingMotivation.value,
            title: 'Wealth Building Motivation',
            description: data?.wealthBuildingMotivation.description,
        },
        {
            value: data?.financialEmotionalIntelligence.value,
            title: 'Financial Emotional Intelligence',
            description: data?.financialEmotionalIntelligence.description,
        },
    ]
}

export function buildWorkTalentsObject(data: any): WorkTalentEntry[] {
    if (data == undefined) return []
    return [
        {
            value: data?.resultsVsRelationships.value,
            comparison1: 'Results',
            comparison2: 'Relationships',
            description: data?.resultsVsRelationships.description,
            label: data?.resultsVsRelationships.label,
        },
        {
            value: data?.daringVsCareful.value,
            comparison1: 'Daring',
            comparison2: 'Careful',
            description: data?.daringVsCareful.description,
            label: data?.daringVsCareful.label,
        },
        {
            value: data?.abstractVsConcrete.value,
            comparison1: 'Abstract',
            comparison2: 'Concrete',
            description: data?.abstractVsConcrete.description,
            label: data?.abstractVsConcrete.label,
        },
        {
            value: data?.systematicVsFlexible.value,
            comparison1: 'Systematic',
            comparison2: 'Flexible',
            description: data?.systematicVsFlexible.description,
            label: data?.systematicVsFlexible.label,
        },
        {
            value: data?.promotingVsOperating.value,
            comparison1: 'Promoting',
            comparison2: 'Operating',
            description: data?.promotingVsOperating.description,
            label: data?.promotingVsOperating.label,
        },
    ]
}
