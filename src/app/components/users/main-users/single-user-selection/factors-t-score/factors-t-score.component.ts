import { AfterViewInit, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FactorsHorizontalBarComponent } from 'src/app/components/graphs/factors-horizontal-bar/factors-horizontal-bar.component'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import Encryption from 'src/app/util/Encryption'

@Component({
    selector: 'app-factors-t-score',
    standalone: true,
    imports: [CommonModule, FactorsHorizontalBarComponent, LoadingSpinnerComponent],
    templateUrl: './factors-t-score.component.html',
    styleUrls: ['./factors-t-score.component.scss'],
})
export class FactorsTScoreComponent implements AfterViewInit, OnChanges {
    @ViewChild(FactorsHorizontalBarComponent)
    graphComponent: FactorsHorizontalBarComponent
    @Input() chartData: any
    @Input() index: string
    @Input() isChanged: number
    @Input() bgColor: any = '#ffffff'
    @Input() loading: boolean
    @Input() showLabel: boolean
    @Input() shouldShowSubfactors = true
    @Input() isFullView: boolean
    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.isFullView?.currentValue != changes?.isFullView?.previousValue) {
            this.createTScoreGraph()
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
        setTimeout(() => {
            //wait for the isSubfactorsVisible value to pass to child than re-render graph
            this.createTScoreGraph()
        }, 100)
    }
}
