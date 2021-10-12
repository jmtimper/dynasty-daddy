import {Component, OnInit, ViewChild, Input, OnChanges} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {SleeperCompletedPickData, SleeperTeam} from '../../../model/SleeperLeague';
import {CompletedDraft} from '../../../model/SleeperUser';
import {MatPaginator} from '@angular/material/paginator';
import {SleeperService} from '../../../services/sleeper.service';
import {PlayerService} from '../../../services/player.service';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {ConfigService} from '../../../services/init/config.service';
import {ChartOptions, ChartType} from 'chart.js';
import {BaseChartDirective, Label} from 'ng2-charts';
import 'chartjs-plugin-colorschemes/src/plugins/plugin.colorschemes';
import {Classic10} from 'chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau';
import {PlayerComparisonService} from '../../services/player-comparison.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-completed-draft-table',
  templateUrl: './completed-draft-table.component.html',
  styleUrls: ['./completed-draft-table.component.css']
})
export class CompletedDraftTableComponent implements OnInit, OnChanges {

  /** selected draft completed */
  @Input()
  selectedDraft: CompletedDraft;

  /** columns */
  displayedColumns = this.configService.isMobile ? ['pickNumber', 'owner', 'selectedPlayer'] : ['pickNumber', 'team', 'owner', 'selectedPlayer', 'actions'];

  /** mat paginator */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /** chart set up */
  @ViewChild(BaseChartDirective, {static: true}) chart: BaseChartDirective;

  /** pie chart values */
  public pieChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      position: 'left',
    },
    plugins: {
      colorschemes: {
        scheme: Classic10,
        override: true
      }
    }
  };
  public pieChartLabels: Label[] = [];
  public pieChartData: number[] = [];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;

  /** page length */
  pageLength: number;

  /** mat datasource */
  dataSource: MatTableDataSource<SleeperCompletedPickData> = new MatTableDataSource<SleeperCompletedPickData>();

  /** search value */
  searchVal: string = '';

  /** filter positions */
  filterPosGroup: boolean[] = [true, true, true, true];

  /** is superflex */
  isSuperFlex: boolean = true;

  /** filtered draft list */
  filteredDraftPicks: SleeperCompletedPickData[] = [];

  /** display string for best overall pick */
  bestOverallPickStr: string = '';

  /** display string for best value pick */
  bestValuePickStr: string = '';

  /** best team draft data */
  bestTeamDraft: { team: SleeperTeam, valueAdded: number } = null;

  /** worst team draft data */
  worstTeamDraft: { team: SleeperTeam, valueAdded: number } = null;

  /** pick array of values */
  pickValues: KTCPlayer[] = [];

  constructor(private sleeperService: SleeperService,
              public playerService: PlayerService,
              public configService: ConfigService,
              public playerComparisonService: PlayerComparisonService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.pieChartLegend = this.configService.isMobile ? false : true;
    this.pageLength = this.sleeperService.selectedLeague.totalRosters;
    this.isSuperFlex = this.sleeperService.selectedLeague.isSuperflex;
    this.pickValues = this.playerService.getDraftPicksForYear();
    this.refreshMetrics();
    this.paginator.pageIndex = 0;
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(): void {
    this.isSuperFlex = this.sleeperService.selectedLeague.isSuperflex;
    this.dataSource = new MatTableDataSource(this.selectedDraft.picks);
    this.refreshMetrics();
    this.paginator.pageIndex = 0;
    this.dataSource.paginator = this.paginator;
  }

  /**
   * refresh draft metrics
   * @private
   */
  private refreshMetrics(): void {
    this.bestOverallPickStr = this.getBestOverallPick();
    this.bestValuePickStr = this.getBestValuePick();
    this.findBestAndWorstDraftsForTeams();
    this.calculatePositionAggregate();
  }

  /**
   * get team name from roster id
   * @param rosterId roster id
   * return name
   */
  getTeamName(rosterId: string): string {
    for (const team of this.sleeperService.sleeperTeamDetails) {
      if (team.roster.rosterId.toString() === rosterId.toString()) {
        return team.owner?.teamName;
      }
    }
    return 'none';
  }

  /**
   * get owner name by roster id
   * @param rosterId roster id
   */
  getOwnerName(rosterId: number): string {
    for (const team of this.sleeperService.sleeperTeamDetails) {
      if (team.roster.rosterId === rosterId) {
        return team.owner?.ownerName;
      }
    }
    return 'none';
  }

  /**
   * get player by sleeper id
   * @param sleeperId sleeper id
   */
  getPlayerBySleeperId(sleeperId: string): KTCPlayer {
    return this.playerService.getPlayerBySleeperId(sleeperId);
  }

  /**
   * update draft filter values
   */
  updateDraftFilters(): void {
    this.filteredDraftPicks = this.selectedDraft.picks.slice();
    const filterOptions = ['QB', 'RB', 'WR', 'TE'];
    for (let i = 0; i < this.filterPosGroup.length; i++) {
      if (!this.filterPosGroup[i]) {
        this.filteredDraftPicks = this.filteredDraftPicks.filter(pick => {
          if (pick.position !== filterOptions[i] && filterOptions.includes(pick.position)) {
            return pick;
          }
        });
      }
    }
    if (this.searchVal && this.searchVal.length > 0) {
      this.filteredDraftPicks = this.filteredDraftPicks.filter(player => {
        return ((player.firstName + ' ' + player.lastName).toLowerCase().indexOf(this.searchVal.toLowerCase()) >= 0
          || (player.round.toString().toLowerCase().indexOf(this.searchVal.toLowerCase()) >= 0)
          || (this.getOwnerName(player.rosterId).toLowerCase().indexOf(this.searchVal.toLowerCase()) >= 0));
      });
    }
    this.dataSource = new MatTableDataSource(this.filteredDraftPicks);
    this.paginator.pageIndex = 0;
    this.dataSource.paginator = this.paginator;
  }

  /**
   * get best overall player selected by value
   */
  getBestOverallPick(): string {
    let topPick = this.selectedDraft.picks[0];
    let ktcPlayer = this.playerService.getPlayerBySleeperId(topPick.sleeperId);
    for (const pick of this.selectedDraft.picks.slice(1)) {
      const tempPlayer = this.playerService.getPlayerBySleeperId(pick.sleeperId);
      if (this.isSuperFlex ? ktcPlayer?.sf_trade_value < tempPlayer?.sf_trade_value
        : ktcPlayer?.trade_value < tempPlayer?.trade_value) {
        topPick = pick;
        ktcPlayer = tempPlayer;
      }
    }
    return 'Pick ' + topPick.pickNumber + ': ' + ktcPlayer.position + ' - ' + ktcPlayer.last_name;
  }

  /**
   * get best player at value
   */
  getBestValuePick(): string {
    let topPick = this.selectedDraft.picks[0];
    let topValue = this.getPickValueRatio(topPick);
    for (const pick of this.selectedDraft.picks.slice(1)) {
      const tempValue = this.getPickValueRatio(pick);
      if (tempValue > topValue) {
        topPick = pick;
        topValue = tempValue;
      }
    }
    const ktcPlayer = this.playerService.getPlayerBySleeperId(topPick.sleeperId);
    return 'Pick ' + topPick.pickNumber + ': ' + ktcPlayer.position + ' - ' + ktcPlayer.last_name;
  }

  /**
   * get value ratio in player and pick used to select the player
   * @param pick
   * @private
   */
  private getPickValueRatio(pick: SleeperCompletedPickData): number {
    const pickValue = this.isSuperFlex ? this.pickValues[(pick.round - 1) * 3 + 1]?.sf_trade_value
      || this.pickValues[this.pickValues.length - 1]?.sf_trade_value :
      this.pickValues[(pick.round - 1) * 3 + 1]?.trade_value || this.pickValues[this.pickValues.length - 1]?.trade_value;
    return this.isSuperFlex ? (this.playerService.getPlayerBySleeperId(pick.sleeperId)?.sf_trade_value || 0) / pickValue :
      (this.playerService.getPlayerBySleeperId(pick.sleeperId)?.trade_value || 0) / pickValue;
  }

  /**
   * get value difference in player and pick used to select the player
   * @param pick
   * @private
   */
  private getPickValueAdded(pick: SleeperCompletedPickData): number {
    const pickValue = this.isSuperFlex ? this.pickValues[(pick.round - 1) * 3 + 1]?.sf_trade_value
      || this.pickValues[this.pickValues.length - 1]?.sf_trade_value :
      this.pickValues[(pick.round - 1) * 3 + 1]?.trade_value || this.pickValues[this.pickValues.length - 1]?.trade_value;
    return this.isSuperFlex ? (this.playerService.getPlayerBySleeperId(pick.sleeperId)?.sf_trade_value || 0) - pickValue :
      (this.playerService.getPlayerBySleeperId(pick.sleeperId)?.trade_value || 0) - pickValue;
  }

  /**
   * sets worst and best teams draft value added
   */
  findBestAndWorstDraftsForTeams(): void {
    const teams: { team: SleeperTeam, valueAdded: number }[] = [];
    for (const team of this.sleeperService.sleeperTeamDetails) {
      let valueAdded = 0;
      for (const pick of this.selectedDraft.picks) {
        if (pick.rosterId === team.roster.rosterId) {
          valueAdded += this.getPickValueAdded(pick);
        }
      }
      teams.push({team, valueAdded});
    }
    teams.sort((a, b) => {
      return b.valueAdded - a.valueAdded;
    });
    this.bestTeamDraft = teams[0];
    this.worstTeamDraft = teams[teams.length - 1];
  }

  /**
   * calculate position agg for draft
   * @private
   */
  private calculatePositionAggregate(): void {
    const labels: string[] = [];
    const data: number[] = [];
    for (const pick of this.selectedDraft.picks) {
      const player = this.sleeperService.sleeperPlayers[pick.sleeperId];
      const index = labels.indexOf(player.position);
      if (index === -1) {
        labels.push(player.position);
        data.push(1);
      } else {
        data[index]++;
      }
    }
    this.pieChartLabels = labels;
    this.pieChartData = data;
    if (this.chart?.datasets?.length > 0) {
      this.chart.updateColors();
    }
  }

  /**
   * open player comparison page
   * @param selectedPlayer selected player
   */
  openPlayerComparison(selectedPlayer: KTCPlayer): void {
    this.playerComparisonService.addPlayerToCharts(selectedPlayer);
    this.router.navigateByUrl('players/comparison');
  }
}
