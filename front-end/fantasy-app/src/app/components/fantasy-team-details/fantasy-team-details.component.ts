import {Component, OnInit} from '@angular/core';
import {SleeperService} from '../../services/sleeper.service';
import {ActivatedRoute, Router} from '@angular/router';
import {PlayoffCalculatorService} from '../services/playoff-calculator.service';
import {SleeperTeam, SleeperTeamTransactionData} from '../../model/SleeperLeague';
import {MatchupService} from '../services/matchup.service';
import {PowerRankingsService} from '../services/power-rankings.service';
import {PlayerService} from '../../services/player.service';
import {KTCPlayer} from '../../model/KTCPlayer';
import {PlayerComparisonService} from '../services/player-comparison.service';
import {TransactionsService} from '../services/transactions.service';
import {TransactionUI} from '../model/transaction';
import {ConfigService} from '../../services/init/config.service';

@Component({
  selector: 'app-fantasy-team-details',
  templateUrl: './fantasy-team-details.component.html',
  styleUrls: ['./fantasy-team-details.component.css']
})
export class FantasyTeamDetailsComponent implements OnInit {

  /** selected fantasy team */
  selectedTeam: SleeperTeam;

  /** full list of team activites */
  teamActivity: TransactionUI[] = [];

  /** filtered list of team activities */
  filterTeamActivity: TransactionUI[] = [];

  /** roster of players */
  roster: KTCPlayer[] = [];

  /** activity filter */
  activitySearchVal: string;

  /** show more activities */
  activityShowMore: boolean = false;

  constructor(public sleeperService: SleeperService,
              private route: ActivatedRoute,
              public powerRankingsService: PowerRankingsService,
              public playerService: PlayerService,
              private playerComparisonService: PlayerComparisonService,
              private router: Router,
              public transactionsService: TransactionsService,
              public configService: ConfigService) {
  }

  ngOnInit(): void {
    const ownerName = this.route.snapshot.paramMap.get('ownerName');

    if (this.sleeperService.leagueLoaded && this.sleeperService.selectedLeague) {
      // get selected team from sleeper data
      const teamIndex = this.sleeperService.sleeperTeamDetails.map(e => e.owner?.ownerName).indexOf(ownerName);
      this.selectedTeam = this.sleeperService.sleeperTeamDetails[teamIndex];
      // generate roster and sort
      for (const sleeperId of this.selectedTeam.roster.players) {
        const player = this.playerService.getPlayerBySleeperId(sleeperId);
        if (player) {
          this.roster.push(player);
        }
      }
      this.roster.sort((a, b) => {
        if (this.sleeperService.selectedLeague.isSuperflex) {
          return b.sf_trade_value - a.sf_trade_value;
        } else {
          return b.trade_value - a.trade_value;
        }
      });

      // generates team activities and cleans data for display
      this.teamActivity = this.transactionsService.generateTeamTransactionHistory(this.selectedTeam);
      this.activityShowMore = this.teamActivity.length <= 5;
      this.filterTeamActivity = this.teamActivity.slice(0, 5);
    }
  }

  /**
   * get average points for team
   */
  getAveragePoints(): number {
    return Math.round(this.selectedTeam.roster.teamMetrics.fpts
      / (this.sleeperService.selectedLeague.playoffStartWeek - this.sleeperService.selectedLeague.startWeek));
  }

  /**
   * open player comparison page
   * @param selectedPlayer selected player
   */
  openPlayerComparison(selectedPlayer: KTCPlayer): void {
    this.playerComparisonService.addPlayerToCharts(selectedPlayer);
    this.router.navigateByUrl('players/comparison');
  }

  /**
   * filters activities based on search preferences
   */
  updateActivityFilter(): void {
    if (this.activitySearchVal && this.activitySearchVal.length > 0) {
      const fullFilteredList = this.teamActivity.filter(activity => {
        return (activity.adds.findIndex(add => add.playerName.toLowerCase().includes(this.activitySearchVal.toLowerCase())) >= 0
          || activity.drops.findIndex(drop => drop.playerName.toLowerCase().includes(this.activitySearchVal.toLowerCase())) >= 0
          || activity.type.toLowerCase().includes(this.activitySearchVal.toLowerCase())
          || activity.headerDisplay.toLowerCase().includes(this.activitySearchVal.toLowerCase()));
      });
      this.activityShowMore ? this.filterTeamActivity = fullFilteredList.slice() : this.filterTeamActivity = fullFilteredList.slice(0, 5);
    } else {
      this.activityShowMore ? this.filterTeamActivity =
        this.teamActivity.slice() : this.filterTeamActivity = this.teamActivity.slice(0, 5);
    }
  }

  /**
   * set filter value to trade to only show team trades
   */
  showOnlyTrades(): void {
    this.activitySearchVal = 'trade';
    this.updateActivityFilter();
  }
}
