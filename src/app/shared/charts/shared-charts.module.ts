import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgChartsModule } from 'ng2-charts'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { PieChartComponent } from '../../components/graphs/pie-chart/pie-chart.component'
import { SingleLineHorizontalComponent } from '../../components/graphs/single-line-horizontal/single-line-horizontal.component'
import { RadarChartComponent } from '../../components/graphs/radar-chart/radar-chart.component'
import { SharedModule } from '../shared.module'

@NgModule({
    declarations: [],
    imports: [CommonModule, NgChartsModule, PrimengModule, SharedModule, PieChartComponent, SingleLineHorizontalComponent, RadarChartComponent],
    exports: [PieChartComponent, SingleLineHorizontalComponent, RadarChartComponent],
})
export class SharedChartsModule {}
