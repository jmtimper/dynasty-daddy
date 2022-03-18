import {Injectable} from '@angular/core';
import {KTCPlayer} from '../../model/KTCPlayer';
import {TeamMockDraftPick} from '../model/mockDraft';
import {SleeperTeam} from '../../model/SleeperLeague';
import {DraftCapital, SleeperLeagueData} from '../../model/SleeperUser';
import {TeamPowerRanking} from '../model/powerRankings';
import {SleeperService} from '../../services/sleeper.service';

@Injectable({
  providedIn: 'root'
})
export class MockDraftService {

  /** team picks */
  teamPicks: TeamMockDraftPick[] = [];

  /** available players */
  selectablePlayers: KTCPlayer[] = [];

  /** current filter for mock draft */
  mockDraftConfig: string = 'player';

  /** state of value selected players */
  valueSelectedPlayers: KTCPlayer[] = [];

  /** state of custom selected players */
  customSelectedPlayers: KTCPlayer[] = [];

  constructor(private sleeperService: SleeperService) {
  }

  /**
   * generate draft order
   * @param players list of players
   * @param isSuperFlex is draft super flex
   * @param playerType draft type, 1 == rookies only, 2 == vets only, 3 == all players
   */
  generateDraft(players: KTCPlayer[], isSuperFlex: boolean = true, playerType: number = 3): void {
    if (playerType === 1) { // rookies only
      this.selectablePlayers = players.filter(player => {
        return player.experience === 0 && player.position !== 'PI';
      });
    } else if (playerType === 2) { // vets only
      this.selectablePlayers = players.filter(player => {
        return player.experience !== 0 && player.position !== 'PI';
      });
    } else { // all players
      this.selectablePlayers = players.filter(player => {
        return player.position !== 'PI';
      });
    }
    // sort players by value
    // TODO refactor
    this.selectablePlayers.sort((playerA, playerB) => {
      if (this.sleeperService.selectedLeague.isSuperflex){
        return playerB.sf_trade_value - playerA.sf_trade_value;
      } else {
        return playerB.trade_value - playerA.trade_value;
      }
    });
    this.valueSelectedPlayers = this.selectablePlayers.slice();
  }

  /**
   * map draft objects to teams
   * @param teams fantasy teams
   */
  mapDraftObjects(teams: SleeperTeam[]): void  {
    if (this.teamPicks.length === 0) {
      teams.map(team => {
        for (const pick of team.draftCapital) {
          if (pick.year === this.sleeperService.selectedLeague.season) {
            this.teamPicks.push(new TeamMockDraftPick(((pick.round - 1) * 12) + pick.pick,
              this.createPickString(pick),
              team.owner?.ownerName,
              team.owner?.teamName));
          }
        }
      });
      this.teamPicks.sort((pickA, pickB) => {
        return pickA.pick - pickB.pick;
      });
    }
  }

  /**
   * reset mock drafts to defaults
   */
  resetDraftList(): void {
    this.mockDraftConfig === 'custom' ? this.customSelectedPlayers = [] : this.valueSelectedPlayers = this.selectablePlayers.slice();
  }

  /**
   * create pick string display
   * @param pick pick details
   * @private
   * returns string
   */
  private createPickString(pick: DraftCapital): string {
    return pick.round.toString() + '.' + (pick.pick > 9 ? pick.pick.toString() : '0' + pick.pick.toString());
  }

  /**
   * reset variables when league is changed
   */
  reset(): void {
    this.teamPicks = [];
    this.selectablePlayers = [];
  }
}
