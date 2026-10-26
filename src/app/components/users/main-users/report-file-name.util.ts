// File names for downloaded report PDFs: `<Report name> - <Who it's about>.pdf` - see
// REPORT_FILE_NAME_PLAN.md. Only the file name is affected; nothing here touches stored data.

// Characters Windows/macOS don't allow in file names, plus control characters.
// eslint-disable-next-line no-control-regex
const UNSAFE_FILE_NAME_CHARS = /[\\/:*?"<>|\u0000-\u001F\u007F]/g
const MAX_SUBJECT_LENGTH = 120

export function sanitizeFileNamePart(value: unknown): string {
    if (typeof value !== 'string') return ''
    return value
        .replace(UNSAFE_FILE_NAME_CHARS, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\.+|\.+$/g, '')
        .trim()
}

// "John Smith" from first/last (or any number of name parts). Missing parts are skipped, including
// the literal "undefined"/"null" strings produced by `firstName + ' ' + lastName` on missing data.
export function formatPersonName(...parts: unknown[]): string {
    return parts
        .flatMap((part) => (typeof part === 'string' ? part.split(/\s+/) : []))
        .filter((part) => part && part !== 'undefined' && part !== 'null')
        .join(' ')
}

// "A", "A & B", "A, B & C" - empty names are dropped.
export function joinPersonNames(names: string[]): string {
    const known = names.filter(Boolean)
    if (known.length <= 1) return known[0] ?? ''
    return `${known.slice(0, -1).join(', ')} & ${known[known.length - 1]}`
}

// `<Report name> - <subject>.pdf`, or just `<Report name>.pdf` when the subject is unknown.
export function buildReportFileName(reportName: unknown, subject?: unknown): string {
    const report = sanitizeFileNamePart(reportName) || 'Report'
    const who = sanitizeFileNamePart(subject).slice(0, MAX_SUBJECT_LENGTH).trim()
    return `${who ? `${report} - ${who}` : report}.pdf`
}
