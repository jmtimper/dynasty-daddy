import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective, Label} from 'ng2-charts';
import {ChartDataSets, ChartOptions} from 'chart.js';
import 'chartjs-plugin-colorschemes/src/plugins/plugin.colorschemes';
import {Classic10} from 'chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau';
import {SleeperService} from '../../../services/sleeper.service';

@Component({
  selector: 'app-weekly-median-chart',
  templateUrl: './weekly-median-chart.component.html',
  styleUrls: ['./weekly-median-chart.component.css']
})
export class WeeklyMedianChartComponent implements OnInit {

  /** input of array of medians per week */
  @Input()
  medians: number[];

  @ViewChild(BaseChartDirective, {static: true}) chart: BaseChartDirective;

  /** line chart data */
  public lineChartData: ChartDataSets[] = [];

  /** line chart labels */
  public lineChartLabels: Label[] = [];

  /** line chart options */
  public lineChartOptions: (ChartOptions & { annotation?: any }) = {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      intersect: false,
      mode: 'index',
      position: 'nearest',
    },
    scales: {
      xAxes: [{
        display: true,
        gridLines: {
          display: true
        }
      }],
      yAxes: [{
        display: true,
        gridLines: {
          display: true
        }
      }],
    },

    plugins: {
      colorschemes: {
        scheme: Classic10,
        override: true
      }
    }
  };
  public lineChartLegend = false;
  public lineChartType = 'line';
  public lineChartPlugins = [];

  constructor(private sleeperService: SleeperService) {
  }

  ngOnInit(): void {
    this.generateDataSets();
  }

  /**
   * generate dataset for chart
   */
  generateDataSets(): void {
    this.lineChartData = [];
    this.lineChartLabels = [];
    const completedMedians = [];
    for (let i = 0; i <= this.medians.length; i++) {
      if (!isNaN(this.medians[i])) {
        completedMedians.push(Math.round(this.medians[i] * 100) / 100);
        this.lineChartLabels.push('Week ' + (this.sleeperService.selectedLeague.startWeek + i));
      }
    }
    this.lineChartData.push({data: completedMedians});
    if (this.chart && this.chart.chart) {
      this.chart.chart.data.datasets = this.lineChartData;
      this.chart.chart.data.labels = this.lineChartLabels;
      this.chart.chart.update();
    }
  }

}
