import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions, ChartType} from 'chart.js';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {PlayerService} from '../../../services/player.service';
import {ColorService} from '../../services/color.service';
import {BaseChartDirective} from 'ng2-charts';
import {SleeperService} from "../../../services/sleeper.service";

@Component({
  selector: 'app-player-pos-scatter-chart',
  templateUrl: './player-pos-scatter-chart.component.html',
  styleUrls: ['./player-pos-scatter-chart.component.css']
})
export class PlayerPosScatterChartComponent implements OnInit, OnChanges {

  /** filtered players */
  @Input()
  players: KTCPlayer[];

  @Input()
  isSuperFlex: boolean;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective;

  /** scatter plot options */
  public scatterChartOptions: ChartOptions = {
    responsive: true,
    tooltips: {
      callbacks: {
        label: (item, data) =>
        {
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


  public scatterChartColor: string[] = [];

  public scatterChartData: ChartDataSets[] = [];

  public scatterChartType: ChartType = 'scatter';

  constructor(private playerService: PlayerService,
              private colorService: ColorService,
              private sleeperService: SleeperService) { }

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
      pointBackgroundColors.push(this.colorService.getPointBackgroundColor(isOwnedByUser));
      pointBorderColors.push(this.colorService.getPointBorderColor(isOwnedByUser));
      return {
        x: this.isSuperFlex ? player.sf_trade_value : player.trade_value,
        y: Number(this.playerService.playerStats[player.sleeper_id]?.pts_half_ppr || 0)
      };
    });
    this.scatterChartData[0] = {
      data: playerData,
      label: 'Players',
      pointRadius: 4,
      pointBackgroundColor: pointBackgroundColors,
      pointBorderColor: pointBorderColors
    };
    this.chart?.updateColors();
  }
}
