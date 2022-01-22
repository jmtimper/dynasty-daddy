import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective, Label} from 'ng2-charts';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {Color} from 'chartjs-plugin-datalabels/types/options';
import {SleeperService} from '../../../services/sleeper.service';
import 'chartjs-plugin-colorschemes/src/plugins/plugin.colorschemes';
import {Classic10} from 'chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau';

@Component({
  selector: 'app-team-transactions-chart',
  templateUrl: './team-transactions-chart.component.html',
  styleUrls: ['./team-transactions-chart.component.css']
})
export class TeamTransactionsChartComponent implements OnInit {

  /** transaction aggregate */
  @Input()
  transactionsAggregate: {};

  /** chart object */
  @ViewChild(BaseChartDirective, {static: true}) chart: BaseChartDirective;

  /**
   * ng2-chart options
   */
  public chartOptions: (ChartOptions & { annotation?: any }) = {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      intersect: false,
      mode: 'index'
    },
    title: {
      text: 'Overall Team Value'
    },
    scales: {
      ticks: {
        min: 0,
      },
      xAxes: [{
        display: true,
        gridLines: {
          display: true
        },
        scaleLabel: {
          display: true,
          labelString: 'Team',
          fontColor: '#d3d3d3'
        }
      }],
      yAxes: [{
        display: true,
        gridLines: {
          display: true
        },
        scaleLabel: {
          display: true,
          labelString: 'Transactions',
          fontColor: '#d3d3d3'
        }
      }]
    },
    plugins: {
      colorschemes: {
        scheme: Classic10,
        override: true
      }
    }
  };
  public chartLegend = true;
  public chartType = 'bar';
  public chartPlugins = [];
  public data: ChartDataSets[] = [];
  public dataLabels: Label[] = [];
  public chartColors: Color;

  constructor(private sleeperService: SleeperService) {
  }

  ngOnInit(): void {
    this.generateDataSet();
  }

  /** generate chart dataset and format it */
  private generateDataSet(): void {
    this.data = [];
    this.dataLabels = [];
    const trades: number[] = [];
    const waiver: number[] = [];
    for (let i = 1; i <= this.sleeperService.selectedLeague.totalRosters; i++) {
      if (this.transactionsAggregate[i]) {
        trades.push(this.transactionsAggregate[i].trades);
        waiver.push(this.transactionsAggregate[i].actions);
        this.dataLabels.push(this.sleeperService.getTeamByRosterId(i).owner.teamName);
      }
    }
    this.data.push({label: 'Trades', data: trades, hoverBackgroundColor: []});
    this.data.push({label: 'Waivers', data: waiver, hoverBackgroundColor: []});
    if (this.chart && this.chart.chart) {
      this.chart.chart.data.datasets = this.data;
      this.chart.chart.data.labels = this.dataLabels;
      this.chart.chart.update();
    }
  }

}
