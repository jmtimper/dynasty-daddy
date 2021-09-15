import {Component, Input, OnInit} from '@angular/core';
import {MatchUpProbability} from '../../../model/playoffCalculator';
import {SleeperTeam} from '../../../../model/SleeperLeague';
import {SleeperService} from '../../../../services/sleeper.service';
import {PlayoffCalculatorService} from '../../../services/playoff-calculator.service';
import {DisplayService} from '../../../../services/utilities/display.service';

@Component({
  selector: 'app-playoff-calculator-selectable-game-card',
  templateUrl: './playoff-calculator-selectable-game-card.component.html',
  styleUrls: ['./playoff-calculator-selectable-game-card.component.css']
})
export class PlayoffCalculatorSelectableGameCardComponent implements OnInit {

  /** match up object with probability */
  @Input()
  game: MatchUpProbability;

  /** team 1 sleeper object */
  team1: SleeperTeam;

  /** team 2 sleeper object */
  team2: SleeperTeam;

  constructor(private sleeperService: SleeperService,
              private playoffCalculatorService: PlayoffCalculatorService,
              public displayService: DisplayService) {
  }

  ngOnInit(): void {
    this.team1 = this.sleeperService.getTeamByRosterId(this.game?.matchUpDetails.team1RosterId);
    this.team2 = this.sleeperService.getTeamByRosterId(this.game?.matchUpDetails.team2RosterId);
  }

  /**
   * updates matchup details with selected winner value and refreshes odds
   * @param winner number
   */
  updateGameResultOption(winner: number): void {
    this.playoffCalculatorService.forceShowRecord = true;
    this.game.matchUpDetails.selectedWinner = winner === this.game.matchUpDetails.selectedWinner ? 0 : winner;
    this.playoffCalculatorService.updateSeasonOdds();
  }
}
