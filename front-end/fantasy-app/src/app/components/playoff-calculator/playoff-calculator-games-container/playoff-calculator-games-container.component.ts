import {Component, Input, OnInit} from '@angular/core';
import {MatchUpProbability} from '../../model/playoffCalculator';
import {SleeperService} from '../../../services/sleeper.service';
import {PlayoffCalculatorService} from '../../services/playoff-calculator.service';
import {NflService} from '../../../services/utilities/nfl.service';

@Component({
  selector: 'app-playoff-calculator-games-container',
  templateUrl: './playoff-calculator-games-container.component.html',
  styleUrls: ['./playoff-calculator-games-container.component.css']
})
export class PlayoffCalculatorGamesContainerComponent implements OnInit {

  /** week match ups */
  @Input()
  weekMatchUps: MatchUpProbability[];

  /** is card group probability or selecting game winners */
  @Input()
  selectable?: boolean = false;

  /** record string */
  recordString: string = '';

  constructor(public sleeperService: SleeperService,
              public playoffCalculatorService: PlayoffCalculatorService,
              public nflService: NflService) {
  }

  ngOnInit(): void {
    let correct = 0;
    let incorrect = 0;
    for (const matchUp of this.weekMatchUps) {
      if (matchUp.matchUpDetails.team1Points !== 0 && matchUp.matchUpDetails.team2Points !== 0) {
        if (matchUp.matchUpDetails.team1Points > matchUp.matchUpDetails.team2Points) {
          matchUp.team1Prob > matchUp.team2Prob ? correct++ : incorrect++;
        } else {
          matchUp.team2Prob > matchUp.team1Prob ? correct++ : incorrect++;
        }
      }
    }
    if (correct !== 0 || incorrect !== 0) {
      this.recordString = `${correct}/${incorrect + correct}`;
    }
  }

  /**
   * reset selected week of games
   */
  resetSelectableGames(): void {
    this.weekMatchUps.map(matchups => {
      matchups.matchUpDetails.selectedWinner = 0;
      matchups.matchUpDetails.selectedTeam2MedianWin = 0;
      matchups.matchUpDetails.selectedTeam1MedianWin = 0;
    });
    this.playoffCalculatorService.updateSeasonOdds();
  }
}
