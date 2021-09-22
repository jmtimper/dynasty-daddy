import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions, ChartType} from 'chart.js';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {PlayerService} from '../../../services/player.service';
import {ColorService} from '../../services/color.service';
import {BaseChartDirective} from 'ng2-charts';
import {SleeperService} from '../../../services/sleeper.service';

@Component({
  selector: 'app-player-pos-scatter-chart',
  templateUrl: './player-pos-scatter-chart.component.html',
  styleUrls: ['./player-pos-scatter-chart.component.css']
})
export class PlayerPosScatterChartComponent implements OnInit, OnChanges {

  /** filtered players */
  @Input()
  players: KTCPlayer[];

  /** is league superflex */
  @Input()
  isSuperFlex: boolean;

  /** selected metrics for x and y */
  @Input()
  selectedMetrics: { value: string, displayName: string }[];

  /** change color of your team */
  @Input()
  highlightYourTeam: boolean = true;

  /** change color of free agents */
  @Input()
  highlightFreeAgents: boolean = false;

  /** chart */
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;

  /** scatter plot options */
  public scatterChartOptions: ChartOptions = {
    responsive: true,
    tooltips: {
      callbacks: {
        label: (item, data) => {
          return this.players[item.index].full_name + ' (' + item.xLabel + ', ' + item.yLabel + ')';
        }
      }
    },
    scales: {
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Fantasy Point (Half PPR)'
        }
      }],
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Trade Value'
        }
      }],
    }
  };

  /** colors for points */
  public scatterChartColor: string[] = [];

  /** chart data */
  public scatterChartData: ChartDataSets[] = [];

  /** chart type */
  public scatterChartType: ChartType = 'scatter';

  constructor(private playerService: PlayerService,
              private colorService: ColorService,
              private sleeperService: SleeperService) {
  }

  ngOnInit(): void {
    this.refreshChart();
  }

  ngOnChanges(): void {
    this.refreshChart();
  }

  /**
   * refresh chart metrics on changes
   */
  refreshChart(): void {
    const pointBackgroundColors = [];
    const pointBorderColors = [];
    const playerData = this.players?.map(player => {
      const isOwnedByUser = this.sleeperService.leagueLoaded &&
        player.owner && player.owner?.userId === this.sleeperService.sleeperUser?.userData?.user_id;
      const isFreeAgent = this.sleeperService.leagueLoaded && !player.owner;
      pointBackgroundColors.push(this.colorService.getPointBackgroundColor(this.highlightFreeAgents,
        this.highlightYourTeam, isOwnedByUser, isFreeAgent));
      pointBorderColors.push(this.colorService.getPointBorderColor(this.highlightFreeAgents, this.highlightYourTeam,
        isOwnedByUser, isFreeAgent));
      return {
        x: this.getMetricForPlayer(this.selectedMetrics[0].value, player),
        y: this.getMetricForPlayer(this.selectedMetrics[1].value, player)
      };
    });
    this.scatterChartData[0] = {
      data: playerData,
      label: 'Players',
      pointRadius: 4,
      pointBackgroundColor: pointBackgroundColors,
      pointBorderColor: pointBorderColors
    };
    if (this.chart && this.chart.chart) {
      this.chart.chart.options.scales.xAxes[0].scaleLabel.labelString = this.selectedMetrics[0].displayName;
      this.chart.chart.options.scales.yAxes[0].scaleLabel.labelString = this.selectedMetrics[1].displayName;
    }
    this.chart?.updateColors();
  }

  /**
   * return metric value point for player
   * @param value value string
   * @param player player object
   * @private
   */
  private getMetricForPlayer(value: string, player: KTCPlayer): number {
    switch (value) {
      case 'sf_trade_value':
        return player.sf_trade_value;
      case 'trade_value':
        return player.trade_value;
      case 'cmp_pct':
        return this.playerService.playerStats[player.sleeper_id]?.cmp_pct / this.playerService.playerStats[player.sleeper_id]?.gp;
      default:
        if (!this.playerService.playerStats[player.sleeper_id]) {
          return 0;
        }
        return Number(this.playerService.playerStats[player.sleeper_id][value] || 0);
    }
  }
}
