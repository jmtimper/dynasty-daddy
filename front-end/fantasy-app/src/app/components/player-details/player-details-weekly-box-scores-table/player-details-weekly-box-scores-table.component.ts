import {Component, Input, OnInit} from '@angular/core';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {PlayerService} from '../../../services/player.service';
import {MatTableDataSource} from '@angular/material/table';
import {ChartOptions, ChartType} from 'chart.js';
import {Label, PluginServiceGlobalRegistrationAndOptions, SingleDataSet} from 'ng2-charts';

@Component({
  selector: 'app-player-details-weekly-box-scores-table',
  templateUrl: './player-details-weekly-box-scores-table.component.html',
  styleUrls: ['./player-details-weekly-box-scores-table.component.css']
})
export class PlayerDetailsWeeklyBoxScoresTableComponent implements OnInit {

  /** selected player data */
  @Input()
  selectedPlayer: KTCPlayer;

  /** general box score cols */
  generalBoxScore = ['week', 'points', 'off_snp'];

  /** passing box score */
  passingBoxScore = ['pass_att', 'pass_cmp', 'pass_yd', 'pass_td', 'pass_int'];

  /** rushing box score */
  rushingBoxScore = ['rush_att', 'rush_yd', 'rush_ypa', 'rush_td'];

  /** sack box score */
  sackBoxScore = ['pass_sack', 'pass_sack_yds'];

  /** turnover box score */
  turnoverBoxScore = ['fum', 'fum_lost'];

  /** receiving Box score */
  receivingBoxScore = ['rec', 'rec_tgt', 'rec_yd', 'rec_ypr', 'rec_td', 'rec_rz_tgt'];

  /** columns to display, aggregate of columns above based on pos */
  displayedColumns: string[] = [];

  /** player weekly stats */
  playerWeeklyStats = [];

  /** mat datasource */
  datasource: MatTableDataSource<any[]> = new MatTableDataSource<any[]>();

  /** chart settings */
  doughnutChartData: SingleDataSet[] = [];
  doughnutChartLabels: Label[][] =  [];
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartOptions: ChartOptions = {
    rotation: 1 * Math.PI,
    circumference: 1 * Math.PI,
    animation: {
      animateScale: true,
      animateRotate: true,
    }
  };
  public chartColors: any[] = [
    {
      backgroundColor: ['#4f76b2', '#de8324']
    }];

  /** custom plugin for chart */
  public doughnutChartPlugins: PluginServiceGlobalRegistrationAndOptions[] = [{
    beforeDraw(chart): void {
      const ctx = chart.ctx;
      const txt = 'Center Text';

      // Get options from the center object in options
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      const centerY = chart.chartArea.bottom - 16;

      // Pick a new font size so it will not be larger than the height of label.
      const fontSizeToUse = 16;

      ctx.font = fontSizeToUse + 'px Roboto, "Helvetica Neue", sans-serif';
      ctx.fillStyle = '#e0e0e0';

      // Draw text in center
      ctx.fillText(chart.data.datasets[0].data[0].toString(), centerX, centerY);
    }
  }];

  constructor(public playerService: PlayerService) { }

  ngOnInit(): void {
    this.setDisplayColumns();
    for (let i = 1; i < 19; i++) {
      const weekStats = this.playerService.pastSeasonWeeklyStats[i];
      if (weekStats[this.selectedPlayer.sleeper_id]) { this.playerWeeklyStats.push(
        {week: i, stats: weekStats[this.selectedPlayer.sleeper_id]}); }
    }
    this.datasource = new MatTableDataSource<any>(this.playerWeeklyStats);
    if (this.playerService.leagueLeaders.rec.sleeperId !== '') {
      this.setUpSeasonMetrics();
    }
  }

  /**
   * set display column order based on player position
   * @private
   */
  private setDisplayColumns(): void {
    switch (this.selectedPlayer.position){
      case 'QB':
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.passingBoxScore,
          this.rushingBoxScore,
          this.sackBoxScore,
          this.turnoverBoxScore
        );
        break;
      case 'RB':
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.rushingBoxScore,
          this.receivingBoxScore,
          this.turnoverBoxScore
        );
        break;
      case 'WR':
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.receivingBoxScore,
          this.turnoverBoxScore
        );
        break;
      default:
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.receivingBoxScore,
          this.turnoverBoxScore
        );
    }
  }

  /**
   * get week number
   * @param i number from today
   */
  getDisplayWeek(i: number): string {
    return this.playerService.getWeekByIndex(i).slice(5);
  }

  /**
   * generates datasets and labels for bar charts based on player position
   * @private
   */
  private setUpSeasonMetrics(): void {
    this.doughnutChartLabels.push(['Fantasy Points', 'Behind leader']);
    this.doughnutChartData.push([this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.pts_half_ppr || 0,
        Math.round(this.playerService.leagueLeaders.pts_half_ppr.value
        - (this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.pts_half_ppr || 0))]);
    switch (this.selectedPlayer.position) {
      case 'RB': {
        this.doughnutChartLabels.push(['Rushing Attempts', 'Behind leader'], ['Rushing Yards', 'Behind leader'], ['Rushing TDs', 'Behind leader'], ['Receiving Yards', 'Behind leader']);
        const order = ['rush_att', 'rush_yd', 'rush_td', 'rec_yd'];
        for (const field of order) {
          this.doughnutChartData.push([this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.[field] || 0,
            this.playerService.leagueLeaders[field].value - (this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.[field]
              || 0)]);
        }
        break;
      }
      case 'QB': {
        this.doughnutChartLabels.push(['Passing Completions', 'Behind leader'], ['Passing Yards', 'Behind leader'], ['Passing TDs', 'Behind leader'], ['Passing Ints', 'Behind leader']);
        const order = ['pass_cmp', 'pass_yd', 'pass_td', 'pass_int'];
        for (const field of order) {
          this.doughnutChartData.push([this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.[field] || 0,
            this.playerService.leagueLeaders[field].value - (this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.[field]
              || 0)]);
        }
        break;
      }
      default: {
        this.doughnutChartLabels.push(['Targets', 'Behind leader'], ['Receptions', 'Behind leader'], ['Receiving Yards', 'Behind leader'],
          ['Receiving TDs', 'Behind leader']);
        const order = ['rec_tgt', 'rec', 'rec_yd', 'rec_td'];
        for (const field of order) {
          this.doughnutChartData.push([this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.[field] || 0,
            this.playerService.leagueLeaders[field].value - (this.playerService.playerStats[this.selectedPlayer.sleeper_id]?.[field]
              || 0)]);
        }
        break;
      }
    }
  }
}
