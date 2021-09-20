import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ChartDataSets, ChartOptions, ChartType} from 'chart.js';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {PlayerService} from '../../../services/player.service';
import {ColorService} from "../../services/color.service";

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

  constructor(private playerService: PlayerService, private colorService: ColorService) { }

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
    const pointColors = [];
    const playerData = this.players?.map(player =>
    { pointColors.push({backgroundColor: this.colorService.getTeamColor(player.team)});
      return {x: this.isSuperFlex ? player.sf_trade_value : player.trade_value,
        y: Number(this.playerService.playerStats[player.sleeper_id]?.pts_half_ppr || 0)}
    });
    // console.log(pointColors)
    // this.scatterChartColor = pointColors;
    this.scatterChartData[0] = {
      data: playerData,
      label: 'Players',
      pointRadius: 4
    };
  }

}
