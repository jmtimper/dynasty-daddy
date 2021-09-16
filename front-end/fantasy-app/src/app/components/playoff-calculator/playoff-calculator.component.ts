import { Component, OnInit } from '@angular/core';
import {SleeperService} from '../../services/sleeper.service';
import {PlayoffCalculatorService} from '../services/playoff-calculator.service';
import {NflService} from '../../services/utilities/nfl.service';
import {MatchUpProbability} from '../model/playoffCalculator';
import {MatchupService} from '../services/matchup.service';
import {PowerRankingsService} from '../services/power-rankings.service';
import {ConfigService} from '../../services/init/config.service';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-playoff-calculator',
  templateUrl: './playoff-calculator.component.html',
  styleUrls: ['./playoff-calculator.component.css']
})
export class PlayoffCalculatorComponent implements OnInit {

  /** upcoming match ups prob */
  upcomingMatchUps: MatchUpProbability[][] = [];

  /** playoff match ups prob */
  playoffMatchUps: MatchUpProbability[][] = [];

  /** past match ups prob */
  completedMatchUps: MatchUpProbability[][] = [];

  /** list of selectable weeks to choose from */
  selectableWeeks: {week: number; value: string}[] = [];

  /** currently selected forecast week */
  selectedWeek: number;

  /** show playoff machine game selections */
  showPlayoffMachine: boolean = false;

  /** playoff machine start week */
  playoffMachineWeek: number;
  constructor(
    public sleeperService: SleeperService,
    public playoffCalculatorService: PlayoffCalculatorService,
    private nflService: NflService,
    public powerRankingsService: PowerRankingsService,
    private matchupService: MatchupService,
    public configService: ConfigService) { }

  ngOnInit(): void {
    if (this.sleeperService.selectedLeague) {
      console.log(this.sleeperService.selectedLeague);
      // TODO fix this
      if (this.matchupService.leagueMatchUpUI.length === 0 || this.playoffCalculatorService.matchUpsWithProb.length === 0) {
        console.warn('Warning: Match Data was not loaded correctly. Recalculating Data...');
        this.matchupService.initMatchUpCharts(this.sleeperService.selectedLeague);
      }
      this.playoffMachineWeek = this.nflService.stateOfNFL.completedWeek;
      this.refreshGames();
      this.generateSelectableWeeks();
    }
  }

  /**
   * generate valid weeks to select probability
   * @private
   */
  private generateSelectableWeeks(): void {
    this.selectableWeeks.push({week: this.sleeperService.selectedLeague.startWeek, value: 'Preseason'});
    const selectableWeekMax = this.sleeperService.selectedLeague.status !== 'complete' ? this.nflService.stateOfNFL.completedWeek
      : this.playoffCalculatorService.matchUpsWithProb.length;
    for (let i = 1; i <= selectableWeekMax; i++) {
      const disclaimer = this.sleeperService.selectedLeague.playoffStartWeek === this.sleeperService.selectedLeague.startWeek + i ? ' (End of regular season)' : '';
      this.selectableWeeks.push({week: this.sleeperService.selectedLeague.startWeek + i, value: 'Before Week '
          + (this.sleeperService.selectedLeague.startWeek + i) + disclaimer});
    }
    if (this.sleeperService.selectedLeague.status === 'complete') {
      this.selectableWeeks.push({week: this.sleeperService.selectedLeague.startWeek
          + this.playoffCalculatorService.matchUpsWithProb.length + 1, value: 'Today'});
    }
    this.selectedWeek = this.selectableWeeks.reverse()[0].week;
  }

  /**
   * refresh game probability
   */
  refreshGames(): void {
    this.playoffCalculatorService.calculateGamesWithProbability(this.selectedWeek);
    if (this.playoffCalculatorService.matchUpsWithProb.length > 0) {
      if (this.sleeperService.selectedLeague.season === this.nflService.stateOfNFL.season) {
        this.upcomingMatchUps = this.playoffCalculatorService.matchUpsWithProb.slice(
          this.nflService.stateOfNFL.completedWeek,
          this.sleeperService.selectedLeague.playoffStartWeek - 1,
        );
        this.playoffMatchUps = this.playoffCalculatorService.matchUpsWithProb.slice(
          this.sleeperService.selectedLeague.playoffStartWeek - 1
        );
        this.completedMatchUps =
          this.playoffCalculatorService.matchUpsWithProb.slice(0, this.nflService.stateOfNFL.completedWeek).reverse();
      } else {
        this.completedMatchUps = this.playoffCalculatorService.matchUpsWithProb.slice().reverse();
      }
    }
  }

  /**
   * update probability handler may remove later idk
   * @param value
   */
  updateProbability(value: number): void {
    this.selectedWeek = value;
    this.playoffCalculatorService.updateSeasonOdds(value);
  }

  /**
   * handles downloading csv of season data
   */
  downloadPlayoffCalculatorData(): void {

    const seasonData: any[][] = [
      ['rosterId', 'teamName', 'teamOwner', 'week', 'starterValue', 'projWins', 'projLosses', 'makePlayoffOdds', 'winDivisionOdds', 'winByeOdds', 'makeConfOdds', 'makeChampOdds', 'winChampOdds'],
    ];
    for (const team of this.sleeperService.sleeperTeamDetails) {
      const row = [team.roster.rosterId, team.owner.teamName, team.owner.ownerName, this.selectedWeek];
      row.push(this.sleeperService.selectedLeague.isSuperflex
        ? this.powerRankingsService.findTeamFromRankingsByRosterId(team.roster.rosterId).sfTradeValueStarter
      : this.powerRankingsService.findTeamFromRankingsByRosterId(team.roster.rosterId).tradeValueStarter);
      row.push(this.playoffCalculatorService.teamsProjectedRecord[team.roster.rosterId].projWins);
      row.push(this.playoffCalculatorService.teamsProjectedRecord[team.roster.rosterId].projLoss);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesMakingPlayoffs);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWinningDivision);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWithBye);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesMakeConfRd);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesMakeChampionship);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWinChampionship);
      seasonData.push(row);
    }

    const seasonOddsCSV = seasonData.map(e => e.join(',')).join('\n');

    const filename = `${this.sleeperService.selectedLeague.name.replace(/ /g, '_')}_Season_Projections_${this.sleeperService.selectedLeague.season}_${this.selectedWeek}.csv`;

    const blob = new Blob([seasonOddsCSV], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  /**
   * handles page select for playoff machine
   * @param change
   */
  updatePlayoffMachineWeek(change: number): void {
    this.playoffMachineWeek += change;
  }
}
