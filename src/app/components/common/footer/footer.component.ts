import { Component } from '@angular/core'
import * as moment from 'moment'

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
    footerYear = moment(new Date()).format('YYYY')
}
