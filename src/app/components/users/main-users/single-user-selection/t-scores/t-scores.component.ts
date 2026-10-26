import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ButtonModule } from 'primeng/button'
import { DoubleAxesHorizontalBarComponent } from 'src/app/components/graphs/double-axes-horizontal-bar/double-axes-horizontal-bar.component'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import Encryption from 'src/app/util/Encryption'

@Component({
    selector: 'app-t-scores',
    standalone: true,
    imports: [CommonModule, ButtonModule, DoubleAxesHorizontalBarComponent, LoadingSpinnerComponent],
    templateUrl: './t-scores.component.html',
    styleUrls: ['./t-scores.component.scss'],
})
export class TScoresComponent implements AfterViewInit, OnChanges {
    @ViewChild(DoubleAxesHorizontalBarComponent)
    graphComponent: DoubleAxesHorizontalBarComponent
    @Input() chartData: any
    @Input() index: string
    @Input() isChanged: number
    @Input() bgColor: any = '#ffffff'
    @Input() loading: boolean
    @Input() showLabel: boolean
    @Input() shouldShowSubfactors = true
    @Input() isFullView: boolean
    @Input() showFactorList: boolean = false
    isSubfactorsVisible: boolean
    helpUrl: string
    constructor() {
        this.isSubfactorsVisible = false
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.isFullView?.currentValue != changes?.isFullView?.previousValue) {
            this.createTScoreGraph()
        }
        if (this.index === 'single0') {
            this.helpUrl = 'https://kb.dnabehavior.com/gene/financial-behavior-cards-explained#T-Scores'
        } else {
            this.helpUrl = 'https://kb.dnabehavior.com/gene/work-talent-cards-explained#T-scores'
        }
    }

    createTScoreGraph() {
        this.bgColor = Encryption.decryptData(localStorage.getItem('tScoreColor') || '')
        this.graphComponent?.graph(this.bgColor)
    }

    ngAfterViewInit(): void {
        this.createTScoreGraph()
    }

    showSubFactors() {
        this.isSubfactorsVisible = !this.isSubfactorsVisible

        setTimeout(() => {
            //wait for the isSubfactorsVisible value to pass to child than re-render graph
            this.createTScoreGraph()
        }, 100)
    }
}
