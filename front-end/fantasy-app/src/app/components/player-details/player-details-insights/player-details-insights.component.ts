import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {KTCPlayer, KTCPlayerDataPoint} from '../../../model/KTCPlayer';
import {PlayerService} from '../../../services/player.service';
import {SleeperService} from '../../../services/sleeper.service';
import {PlayerInsights} from '../../model/playerInsights';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {BaseChartDirective, Label} from 'ng2-charts';

@Component({
  selector: 'app-player-details-insights',
  templateUrl: './player-details-insights.component.html',
  styleUrls: ['./player-details-insights.component.css']
})
export class PlayerDetailsInsightsComponent implements OnInit, OnChanges {

  /** selected player info */
  @Input()
  selectedPlayer: KTCPlayer;

  /** selected player insights */
  @Input()
  selectedPlayerInsights: PlayerInsights;

  /** past month selected data points */
  @Input()
  selectedPlayerValues: KTCPlayerDataPoint[];

  /** chart set up */
  @ViewChild(BaseChartDirective, {static: true}) chart: BaseChartDirective;

  /** list of adjacent players overall */
  overallAdjPlayers: KTCPlayer[];

  /** list of adjacent players based on position */
  positionAdjPlayers: KTCPlayer[];

  /** display columns */
  displayedColumns: string[] = ['rank', 'name', 'value'];

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
        },
        scaleLabel: {
          display: false,
          labelString: 'Days',
          fontColor: '#d3d3d3'
        }
      }],
      yAxes: [{
        display: true,
        gridLines: {
          display: true
        },
        scaleLabel: {
          display: false,
          labelString: 'Trade Value',
          fontColor: '#d3d3d3'
        }
      }],
    }
  };
  public lineChartLegend = false;
  public lineChartType = 'line';
  public lineChartPlugins = [];
  public chartColors: any[] = [];

  constructor(public playerService: PlayerService, public sleeperService: SleeperService) {
  }

  ngOnInit(): void {
    this.overallAdjPlayers = this.playerService.getAdjacentPlayersByNameId(
      this.selectedPlayer.name_id,  '', this.sleeperService.selectedLeague?.isSuperflex);
    this.positionAdjPlayers = this.playerService.getAdjacentPlayersByNameId(
      this.selectedPlayer.name_id, this.selectedPlayer.position, this.sleeperService.selectedLeague?.isSuperflex);
  }

  ngOnChanges(): void {
    this.generateChartData();
  }

  /**
   * generate chart data
   */
  generateChartData(): void {
    try {
      this.lineChartData = [];
      this.lineChartLabels = [];
      const dataList = [];
      if (this.selectedPlayerValues) {
        for (let ind = 1; ind <= 40; ind++) {
          const dataPoint = this.selectedPlayerValues[this.selectedPlayerValues?.length - ind];
          dataList.push(this.sleeperService.selectedLeague?.isSuperflex === false ? dataPoint.trade_value : dataPoint.sf_trade_value);
          this.lineChartLabels.push(dataPoint.date?.slice(0, 10));
        }
        this.lineChartData.push({label: this.selectedPlayer.full_name, data: dataList.reverse()});
        if (dataList[39] > dataList[0]) {
          this.chartColors = [
            {
              backgroundColor: 'rgba(55,185,32,0.4)',
              borderColor: '#4ab92d',
              pointBackgroundColor: '#4ab92d',
              pointBorderColor: '#ffffff'
            }
          ];
        }
      }
      this.lineChartLabels.reverse();
      if (this.chart && this.chart.chart) {
        this.chart.chart.data.datasets = this.lineChartData;
        this.chart.chart.data.labels = this.lineChartLabels;
      }
    } catch (e: any) {
      console.warn('No data points found for player: ' + e);
    }
  }

}
