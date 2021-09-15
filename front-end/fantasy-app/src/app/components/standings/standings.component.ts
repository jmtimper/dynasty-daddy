import {Component, OnInit} from '@angular/core';
import {SleeperService} from '../../services/sleeper.service';
import {PlayoffCalculatorService} from '../services/playoff-calculator.service';
import {SleeperTeam} from '../../model/SleeperLeague';
import {MatchupService} from '../services/matchup.service';
import {ConfigService} from '../../services/init/config.service';

@Component({
  selector: 'app-standings',
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.css']
})
export class StandingsComponent implements OnInit {

  constructor(public sleeperService: SleeperService,
              public playoffCalculatorService: PlayoffCalculatorService,
              public matchupService: MatchupService,
              public configService: ConfigService) {
  }

  divisionTableCols = ['teamName', 'record', 'pf', 'pot'];

  ngOnInit(): void {
    // TODO fix this
    if (this.sleeperService.selectedLeague && this.matchupService.leagueMatchUpUI.length === 0) {
      console.warn('Warning: Match Data was not loaded correctly. Recalculating Data...');
      this.matchupService.initMatchUpCharts(this.sleeperService.selectedLeague);
    }
  }

  roundNumber(num: number): number {
    return Math.round(num);
  }

  getPointPotentialPercent(team: SleeperTeam): number {
    return Math.round(team.roster.teamMetrics.fpts / team.roster.teamMetrics.ppts * 100);
  }
}
