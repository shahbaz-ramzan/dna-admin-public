import { Pipe, PipeTransform } from '@angular/core'

// Pure pipe replacing SalesReportComponent.getArticle(), previously called directly from template
// interpolation - same re-render-cost problem as the coaching-report pipes, at smaller scale here.
@Pipe({ name: 'article', standalone: true })
export class ArticlePipe implements PipeTransform {
    transform(uniqueStyle: string): string {
        if (!uniqueStyle) return 'a'
        const vowels = ['a', 'e', 'i', 'o', 'u']
        return vowels.includes(uniqueStyle.toLowerCase().charAt(0)) ? 'an' : 'a'
    }
}
