// Discovery/GetUniqueStyle returns the participant's unique style once they've completed DNA
// Discovery, null otherwise. The one place that reads that response, so every caller agrees on what
// "completed" means. Accepts both the standard `{ data: { uniqueStyle } }` envelope and a bare
// `{ uniqueStyle }` body until the backend contract is confirmed.
export function getUniqueStyleFromResponse(response: any): string | null {
    const body = response?.body
    const data = body?.data
    const uniqueStyle = typeof data === 'string' ? data : data?.uniqueStyle ?? body?.uniqueStyle
    return typeof uniqueStyle === 'string' && uniqueStyle.trim() ? uniqueStyle : null
}
