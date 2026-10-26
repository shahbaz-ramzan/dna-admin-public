import { environment } from 'src/environments/environment'
// The Wonderchat widget is injected by a deferred third-party script (index.html), so on a page
// refresh it can appear after these run. Toggling a class on <body> (see styles.scss) hides it
// whenever it shows up, instead of only if it already exists.
export const disableWonderchat = () => {
    document.body.classList.add('hide-wonderchat')
}

export const enableWonderchat = () => {
    document.body.classList.remove('hide-wonderchat')
}

export const formatTScoreData = (tscore: number[] = []) => ({
    'Take Charge': tscore[0] || 0,
    'Fast-Paced': tscore[2] || 0,
    'Risk Taker': tscore[6] || 0,
    Creative: tscore[7] || 0,
    Planned: tscore[3] || 0,
    Skeptical: tscore[4] || 0,
    Anchored: tscore[7] || 0,
    Reserved: tscore[1] || 0,
    Outgoing: tscore[1] || 0,
    Cooperative: tscore[0] || 0,
    Patient: tscore[2] || 0,
    Trusting: tscore[4] || 0,
    Cautious: tscore[6] || 0,
    Spontaneous: tscore[3] || 0,
    Content: tscore[5] || 0,
})

export const buildWorkTalentsInsights = (workTalentsData: any): { [key: string]: string } => {
    if (!workTalentsData) {
        return {}
    }

    return {
        'Results vs Relationships': workTalentsData.resultsVsRelationships?.description || '',
        'Daring vs Careful': workTalentsData.daringVsCareful?.description || '',
        'Abstract vs Concrete': workTalentsData.abstractVsConcrete?.description || '',
        'Systematic vs Flexible': workTalentsData.systematicVsFlexible?.description || '',
        'Promoting vs Operating': workTalentsData.promotingVsOperating?.description || '',
    }
}

export const buildChatPayloadData = (payloadData: any): any => {
    const tscore = Array.isArray(payloadData.tScoreData) ? payloadData.tScoreData : []

    return {
        personName: payloadData.personName,
        reportType: payloadData.reportType,
        personID: payloadData.description_data?.personID,
        behaviorTypeID: payloadData.description_data?.behaviorTypeID,
        behaviorTypeName: payloadData.description_data?.behaviorTypeName,
        behaviorTypeDescription: payloadData.description_data?.behaviorTypeDescription,
        tScores: formatTScoreData(tscore),
        twoStrongestTraits: payloadData.twoStrongestTraits || [],
        insights: payloadData.workTalentsInsights || {},
    }
}

export const generateTScorePayload = (participant: any) => {
    const tscore = participant?.tscore || []

    return {
        personName: participant?.firstName,
        reportType: 'Team Report',
        personID: participant?.personID,
        behaviorTypeID: participant?.behaviorTypeID,
        behaviorTypeName: participant?.uniqueStyle || participant?.behaviorTypeName || '',
        behaviorTypeDescription: participant?.behaviorTypeDescription || '',
        tScores: formatTScoreData(tscore),
        twoStrongestTraits: participant?.strogestFactors || [],
        insights: participant?.workTalentsInsights || {},
    }
}

export const buildMultiUserChatPayload = (userPayloads: any[], reportType: string) => {
    if (!userPayloads || userPayloads.length === 0) {
        return []
    }

    return userPayloads.map((user) => ({
        ...user,
        reportType,
    }))
}

export const shortenYoutubeUrl = (url: string): string => {
    const match = url.match(/[?&]v=([^&]+)/)
    return match ? `https://youtu.be/${match[1]}` : url
}

export const getWrongPlaceErrorMessage = (): string => {
    return `<p>Oops - looks like you landed in the wrong place. This is the administration view for account holders. Please click below to see your results.
          <ul>
          <li><a href='${environment.discovery_app_url}investor' target='_blank'>Investor App</a></li>
          <li><a href='${environment.discovery_app_url}talent' target='_blank'>Talent App</a></li>
          </ul>
          </p>`
}
