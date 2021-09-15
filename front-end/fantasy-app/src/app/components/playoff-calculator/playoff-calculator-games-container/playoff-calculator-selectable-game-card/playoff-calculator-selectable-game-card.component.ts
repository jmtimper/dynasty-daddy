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

  constructor(public sleeperService: SleeperService,
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
    // if game is being decided for first time select default median options
    if (this.game.matchUpDetails.selectedWinner === 0 && this.sleeperService.selectedLeague.medianWins) {
      if (winner === 1) {
        this.game.matchUpDetails.selectedTeam1MedianWin = 1;
        this.game.matchUpDetails.selectedTeam2MedianWin = -1;
      } else {
        this.game.matchUpDetails.selectedTeam1MedianWin = -1;
        this.game.matchUpDetails.selectedTeam2MedianWin = 1;
      }
    }
    // set winner
    this.game.matchUpDetails.selectedWinner = winner === this.game.matchUpDetails.selectedWinner ? 0 : winner;

    // if game is going back to unselected deselect median wins
    if (this.sleeperService.selectedLeague.medianWins) {
      if (this.game.matchUpDetails.selectedWinner === 0) {
        this.game.matchUpDetails.selectedTeam1MedianWin = 0;
        this.game.matchUpDetails.selectedTeam2MedianWin = 0;
      } else {
        // if new winner is below median but loser is above median correct stats
        if (this.game.matchUpDetails.selectedWinner === 1 &&
          this.game.matchUpDetails.selectedTeam1MedianWin < this.game.matchUpDetails.selectedTeam2MedianWin) {
          this.game.matchUpDetails.selectedTeam1MedianWin = 1;
        } else if (this.game.matchUpDetails.selectedWinner === 2
          && this.game.matchUpDetails.selectedTeam2MedianWin < this.game.matchUpDetails.selectedTeam1MedianWin) {
          this.game.matchUpDetails.selectedTeam2MedianWin = 1;
        }
      }
    }
    this.playoffCalculatorService.updateSeasonOdds();
  }

  /**
   * handles changes to the median wins when selections are made
   * @param medianWinner number
   * @param team number
   */
  updateMedianResultOption(medianWinner: number, team: number): void {
    this.playoffCalculatorService.forceShowRecord = true;
    // if median is first thing selected fire defaults
    if (this.game.matchUpDetails.selectedWinner === 0) {
      this.updateGameResultOption(team);
    } else {
      // set new median win value
      const newWinnerValue = medianWinner === 0 ? 1 : medianWinner * -1;
      team === 1 ? this.game.matchUpDetails.selectedTeam1MedianWin = newWinnerValue
        : this.game.matchUpDetails.selectedTeam2MedianWin = newWinnerValue;
      // if new winner is below median but loser is above median correct stats
      if (this.game.matchUpDetails.selectedWinner === 1 &&
        this.game.matchUpDetails.selectedTeam1MedianWin === -1) {
        this.game.matchUpDetails.selectedTeam2MedianWin = -1;
      } else if (this.game.matchUpDetails.selectedWinner === 2
        && this.game.matchUpDetails.selectedTeam2MedianWin === -1) {
        this.game.matchUpDetails.selectedTeam1MedianWin = -1;
      }
      this.playoffCalculatorService.updateSeasonOdds();
    }
  }
}
