import { buildReportFileName, formatPersonName, joinPersonNames, sanitizeFileNamePart } from './report-file-name.util'

describe('report-file-name.util', () => {
    describe('buildReportFileName', () => {
        it('appends the person to the report name (AC-001/002/003)', () => {
            expect(buildReportFileName('Work Talent Report', 'John Smith')).toBe('Work Talent Report - John Smith.pdf')
        })

        it('falls back to the report name alone when there is no subject (AC-009)', () => {
            expect(buildReportFileName('Work Talent Report', '')).toBe('Work Talent Report.pdf')
            expect(buildReportFileName('Work Talent Report')).toBe('Work Talent Report.pdf')
        })

        it('never produces an empty base name', () => {
            expect(buildReportFileName(undefined, 'John Smith')).toBe('Report - John Smith.pdf')
        })

        it('sanitizes characters that are invalid in file names (AC-010)', () => {
            expect(buildReportFileName('Work: Talent/Report', 'John <Smith>?')).toBe('Work Talent Report - John Smith.pdf')
        })

        it('caps a very long subject', () => {
            const name = buildReportFileName('Team Report', 'x'.repeat(500))
            expect(name.length).toBeLessThan(150)
            expect(name.endsWith('.pdf')).toBeTrue()
        })
    })

    describe('formatPersonName', () => {
        it('joins first and last name', () => {
            expect(formatPersonName('John', 'Smith')).toBe('John Smith')
        })

        it('uses whichever part exists (AC-007/008)', () => {
            expect(formatPersonName(undefined, 'Smith')).toBe('Smith')
            expect(formatPersonName('John', null)).toBe('John')
        })

        it('drops "undefined"/"null" left behind by string concatenation', () => {
            expect(formatPersonName('undefined undefined')).toBe('')
            expect(formatPersonName('John undefined')).toBe('John')
        })

        it('keeps apostrophes, hyphens and accented letters', () => {
            expect(formatPersonName("Mary-Jane O'Brien", 'Zoë')).toBe("Mary-Jane O'Brien Zoë")
        })
    })

    describe('joinPersonNames', () => {
        it('handles one, two and many names, skipping empty ones', () => {
            expect(joinPersonNames(['John Smith'])).toBe('John Smith')
            expect(joinPersonNames(['John Smith', '', 'Sarah Jones'])).toBe('John Smith & Sarah Jones')
            expect(joinPersonNames(['A', 'B', 'C'])).toBe('A, B & C')
            expect(joinPersonNames([])).toBe('')
        })
    })

    describe('sanitizeFileNamePart', () => {
        it('collapses whitespace and trims dots', () => {
            expect(sanitizeFileNamePart('  ..John   Smith..  ')).toBe('John Smith')
        })

        it('returns an empty string for non-strings', () => {
            expect(sanitizeFileNamePart(undefined)).toBe('')
            expect(sanitizeFileNamePart(42)).toBe('')
        })
    })
})
