import {Component, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective, Color, Label} from 'ng2-charts';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {PlayerComparisonService} from '../../services/player-comparison.service';
import {BaseComponent} from '../../base-component.abstract';
import 'chartjs-plugin-colorschemes/src/plugins/plugin.colorschemes';
import {Classic10} from 'chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau';
import {ConfigService} from '../../../services/init/config.service';


@Component({
  selector: 'app-trade-value-line-chart',
  templateUrl: './trade-value-line-chart.component.html',
  styleUrls: ['./trade-value-line-chart.component.css']
})
export class TradeValueLineChartComponent extends BaseComponent implements OnInit {

  /** chart set up */
  @ViewChild(BaseChartDirective, {static: true}) chart: BaseChartDirective;

  /** selected filter range */
  selectedDateFilter = '3month';

  /** ng2-chart options */
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
        },
        scaleLabel: {
          display: true,
          labelString: 'Date',
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
          labelString: 'Trade Value',
          fontColor: '#d3d3d3'
        }
      }]
    },
    legend: {
      labels: {
        fontColor: '#d3d3d3'
      }
    },
    plugins: {
      colorschemes: {
        scheme: Classic10,
        override: true
      },
      legend: {
        position: 'top'
      },
    }
  };
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [];

  constructor(public playerComparisonService: PlayerComparisonService,
              public configService: ConfigService) {
    super();
  }

  ngOnInit(): void {
    this.updateTable();
    this.addSubscriptions(this.playerComparisonService.$updatePlayer.subscribe((player) => {
      setTimeout(() => {
        if (this.chart && this.chart.chart) {
          for (const dataset of this.playerComparisonService.lineChartData) {
            dataset.fill = this.playerComparisonService.lineChartData.length < 4;
          }
          this.chart.chart.config.data.datasets = this.playerComparisonService.lineChartData;
          this.chart.chart.options.legend.position = 'top';
          this.chart.updateColors();
          this.chart.chart.update();
        }
      });
    }));
  }

  /**
   * rerender chart with data
   */
  updateTable(): void {
    this.playerComparisonService.lineChartLabels = [];
    let displayDays;
    switch (this.selectedDateFilter) {
      case 'alltime':
        displayDays = this.calculateAllTime();
        break;
      case '6month':
        displayDays = 180;
        break;
      case '3month':
        displayDays = 90;
        break;
      default:
        displayDays = 30;
        break;
    }
    for (let i = 0; i < displayDays + 1; i++) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - (displayDays - i));
      this.playerComparisonService.lineChartLabels.push(yesterday.toISOString().slice(0, 10));
    }
    this.playerComparisonService.refreshTable();
  }

  /**
   * calculate all time range from today's date
   * @private
   * return difference in days
   */
  private calculateAllTime(): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date();
    const secondDate = new Date('2021-04-16T12:00:00');

    const diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
    return diffDays;
  }
}
