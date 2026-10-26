// Pure PDF page-numbering math for the coaching report, parameterized by whether the optional
// BDNA (pages 19-28) / FDNA (pages 29-42) sections are included in this participant's report.

export function calculateTotalPages(isBDNA: boolean, isFDNA: boolean): number {
    // Start with base pages (1-18 and 36-39)
    let totalPages = 23 // 18 (first section) + 4 (last section)

    // Add BDNA pages if selected (19-28)
    if (isBDNA) {
        totalPages += 10
    }

    // Add FDNA pages if selected (29-43)
    if (isFDNA) {
        totalPages += 14
    }

    return totalPages
}

export function isBDNAPage(pageNumber: number): boolean {
    return pageNumber >= 19 && pageNumber <= 28
}

export function isFDNAPage(pageNumber: number): boolean {
    return pageNumber >= 29 && pageNumber <= 42
}

export function getDisplayPageNumber(pageId: number, isBDNA: boolean, isFDNA: boolean): number {
    let displayNumber = pageId

    // Adjust page number if sections are skipped
    if (!isBDNA && pageId > 18) {
        displayNumber -= 10 // Subtract BDNA pages
    }
    if (!isFDNA && pageId > 28) {
        displayNumber -= 14 // Subtract FDNA pages
    }
    return displayNumber
}

export function getSectionNumber(baseSection: number, subSection: number, isBDNA: boolean, isFDNA: boolean): string {
    let adjustedSection = baseSection

    // If BDNA is false, reduce section numbers after section 3
    if (!isBDNA && baseSection > 3) {
        adjustedSection--
    }

    // If FDNA is false, reduce section numbers after section 4 (or 3 if BDNA is false)
    if (!isFDNA && baseSection > (isBDNA ? 4 : 3)) {
        adjustedSection--
    }

    return `${adjustedSection}.${subSection}`
}
