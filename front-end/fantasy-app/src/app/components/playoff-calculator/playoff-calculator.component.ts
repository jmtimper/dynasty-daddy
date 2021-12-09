import {Component, OnInit} from '@angular/core';
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
  selectableWeeks: { week: number; value: string }[] = [];

  /** currently selected forecast week */
  selectedWeek: number;

  /** show playoff machine game selections */
  showPlayoffMachine: boolean = false;

  /** matchup offset for upcoming matchup selection cards */
  matchupOffset: number = 0;

  /** playoff machine start week */
  playoffMachineWeek: number;

  /** selectable metrics */
  selectableMetrics: { display: string, value: string, isDisabled: boolean }[] = [
    {display: 'Projected record', value: 'record', isDisabled: false},
    {display: 'Make playoffs', value: 'makePlayoffs', isDisabled: true},
    {display: 'Win division', value: 'winDivision', isDisabled: false},
    {display: 'Bye week', value: 'getBye', isDisabled: false},
    {display: 'Best Record', value: 'bestRecord', isDisabled: false},
    {display: 'Worst Record', value: 'worstRecord', isDisabled: false},
    {display: 'Run the table (from selected week)', value: 'winOut', isDisabled: false},
    {display: 'Make semi finals', value: 'makeConfChamp', isDisabled: false},
    {display: 'Make championship', value: 'makeChampionship', isDisabled: false},
    {display: 'Win championship', value: 'winChampionship', isDisabled: false}];

  /** form control for metrics dropdown */
  selectedMetrics = new FormControl();


  constructor(
    public sleeperService: SleeperService,
    public playoffCalculatorService: PlayoffCalculatorService,
    private nflService: NflService,
    public powerRankingsService: PowerRankingsService,
    private matchupService: MatchupService,
    public configService: ConfigService) {
  }

  ngOnInit(): void {
    if (this.sleeperService.selectedLeague) {
      // TODO fix this
      if (this.matchupService.leagueMatchUpUI.length === 0 || this.playoffCalculatorService.matchUpsWithProb.length === 0) {
        console.warn('Warning: Match Data was not loaded correctly. Recalculating Data...');
        this.matchupService.initMatchUpCharts(this.sleeperService.selectedLeague);
      }
      this.playoffMachineWeek = this.nflService.stateOfNFL.completedWeek;
      this.refreshGames();
      this.generateSelectableWeeks();
      this.selectedMetrics.setValue(this.setDefaultSelectedMetrics());
    }
  }

  /**
   * generate valid weeks to select probability
   * @private
   */
  private generateSelectableWeeks(): void {
    this.selectableWeeks.push({week: this.sleeperService.selectedLeague.startWeek, value: 'Preseason'});
    const selectableWeekMax = this.sleeperService.selectedLeague.season === this.nflService.stateOfNFL.season ?
      this.nflService.stateOfNFL.completedWeek : this.playoffCalculatorService.matchUpsWithProb.length;
    for (let i = this.sleeperService.selectedLeague.startWeek; i <= selectableWeekMax; i++) {
      const disclaimer = this.sleeperService.selectedLeague.playoffStartWeek === i + 1 ? ' (End of regular season)' : '';
      this.selectableWeeks.push({
        week: i + 1, value: 'Before Week '
          + (i + 1) + disclaimer
      });
    }
    if (this.sleeperService.selectedLeague.status === 'complete') {
      this.selectableWeeks.push({
        week: this.sleeperService.selectedLeague.startWeek
          + this.playoffCalculatorService.matchUpsWithProb.length + 1, value: 'Today'
      });
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
        // get upcoming match ups
        this.upcomingMatchUps = this.playoffCalculatorService.matchUpsWithProb.slice(
          this.nflService.stateOfNFL.completedWeek - this.sleeperService.selectedLeague.startWeek + 1,
          this.sleeperService.selectedLeague.playoffStartWeek - this.sleeperService.selectedLeague.startWeek,
        );
        // get upcoming playoff match ups
        this.playoffMatchUps = this.playoffCalculatorService.matchUpsWithProb.slice(
          this.sleeperService.selectedLeague.playoffStartWeek - this.sleeperService.selectedLeague.startWeek
        );
        // get completed match ups
        this.completedMatchUps =
          this.playoffCalculatorService.matchUpsWithProb.slice(0, this.nflService.stateOfNFL.completedWeek
            - this.sleeperService.selectedLeague.startWeek + 1).reverse();
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
    this.selectedMetrics.setValue(this.setDefaultSelectedMetrics());
    this.playoffCalculatorService.updateSeasonOdds(value);
  }

  /**
   * handles downloading csv of season data
   */
  downloadPlayoffCalculatorData(): void {

    const seasonData: any[][] = [
      ['rosterId', 'teamName', 'teamOwner', 'week', 'starterValue', 'projWins', 'projLosses', 'medianWins', 'medianLosses', 'makePlayoffOdds', 'winDivisionOdds', 'winByeOdds', 'bestRecord', 'worstRecord', 'winOut', 'makeConfOdds', 'makeChampOdds', 'winChampOdds'],
    ];
    for (const team of this.sleeperService.sleeperTeamDetails) {
      const row = [team.roster.rosterId, team.owner.teamName, team.owner.ownerName, this.selectedWeek];
      row.push(this.sleeperService.selectedLeague.isSuperflex
        ? this.powerRankingsService.findTeamFromRankingsByRosterId(team.roster.rosterId).sfTradeValueStarter
        : this.powerRankingsService.findTeamFromRankingsByRosterId(team.roster.rosterId).tradeValueStarter);
      row.push(this.playoffCalculatorService.teamsProjectedRecord[team.roster.rosterId].projWins);
      row.push(this.playoffCalculatorService.teamsProjectedRecord[team.roster.rosterId].projLoss);
      row.push(this.playoffCalculatorService.teamsProjectedRecord[team.roster.rosterId].medianWins);
      row.push(this.playoffCalculatorService.teamsProjectedRecord[team.roster.rosterId].medianLoss);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesMakingPlayoffs);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWinningDivision);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWithBye);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWithBestRecord);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWithWorstRecord);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesTeamWonOut);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesMakeConfRd);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesMakeChampionship);
      row.push(this.playoffCalculatorService.teamPlayoffOdds[team.roster.rosterId].timesWinChampionship);
      seasonData.push(row);
    }

    const seasonOddsCSV = seasonData.map(e => e.join(',')).join('\n');

    const filename = `${this.sleeperService.selectedLeague.name.replace(/ /g, '_')}_Season_Projections_${this.sleeperService.selectedLeague.season}_${this.selectedWeek}.csv`;

    const blob = new Blob([seasonOddsCSV], {type: 'text/csv;charset=utf-8;'});
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
    this.matchupOffset += change;
  }

  /**
   * generate default selected metrics on init
   * @private
   */
  private setDefaultSelectedMetrics(): { display: string, name: string, isDisabled: boolean }[] {
    let defaultMetrics = [];
    this.updateDisabledSelectedMetrics();
    if (this.selectedWeek >= this.sleeperService.selectedLeague.playoffStartWeek) {
      defaultMetrics = this.buildMetricsListOnValues(['makePlayoffs', 'makeConfChamp', 'makeChampionship', 'winChampionship']);
    } else {
      defaultMetrics = this.buildMetricsListOnValues(['record', 'makePlayoffs', 'winDivision', 'getBye', 'winChampionship']);
      if (this.sleeperService.selectedLeague.playoffTeams % 4 === 0) {
        defaultMetrics.splice(3, 1);
      }
      if (this.sleeperService.selectedLeague.divisions < 2) {
        defaultMetrics.splice(2, 1);
      }
      if (defaultMetrics.length <= 3) {
        defaultMetrics = this.buildMetricsListOnValues(['record', 'makePlayoffs', 'makeConfChamp', 'makeChampionship', 'winChampionship']);
      }
      if (this.configService.isMobile) {
        defaultMetrics.splice(0, 1);
      }
    }
    return defaultMetrics;
  }

  /**
   * returns a list in correct format of selected metric objects
   * @param valueList
   * @private
   */
  private buildMetricsListOnValues(valueList: string[]): { display: string, value: string, isDisabled: boolean }[] {
    const selectedValues = [];
    valueList.map(value => {
      selectedValues.push(this.selectableMetrics.find(element => element.value === value));
    });
    return selectedValues;
  }

  /**
   * helper to handle disabling fields based on conditions
   * @private
   */
  private updateDisabledSelectedMetrics(): void {
    if (this.selectedWeek >= this.sleeperService.selectedLeague.playoffStartWeek) {
      // disable during season metrics
      this.selectableMetrics[0].isDisabled = true;
      this.selectableMetrics[2].isDisabled = true;
      this.selectableMetrics[3].isDisabled = true;
      this.selectableMetrics[4].isDisabled = true;
      this.selectableMetrics[5].isDisabled = true;
      this.selectableMetrics[6].isDisabled = true;
    } else {
      this.selectableMetrics[0].isDisabled = false;
      this.selectableMetrics[2].isDisabled = false;
      this.selectableMetrics[3].isDisabled = false;
      this.selectableMetrics[4].isDisabled = false;
      this.selectableMetrics[5].isDisabled = false;
      this.selectableMetrics[6].isDisabled = false;
    }
    if (this.sleeperService.selectedLeague.divisions <= 1) {
      this.selectableMetrics[2].isDisabled = true;
    }
    if (this.sleeperService.selectedLeague.playoffTeams % 4 === 0) {
      this.selectableMetrics[3].isDisabled = true;
    }
  }
}
