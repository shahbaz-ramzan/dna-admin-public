// === List of Allowed Formats ===
// add new formats in these lists
const imageFormatsList = ['.png', '.jpg']

export const imageFormats = () => imageFormatsList.map((format) => `image/${format.slice(1, format.length)}`).reduce((str, current) => `${str}, ${current}`)

export function isImage(fileType: string) {
    const formatList = imageFormatsList.map((item) => 'image/' + item.slice(1, item.length))
    if (formatList.includes(fileType)) return true
    else return false
}
