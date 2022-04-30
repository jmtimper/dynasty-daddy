import {Injectable} from '@angular/core';
import {StudPlayerResponse, TradePackage} from '../model/tradePackage';
import {KTCPlayer} from '../../model/KTCPlayer';
import {PlayerService} from '../../services/player.service';
import {SleeperService} from "../../services/sleeper.service";

@Injectable({
  providedIn: 'root'
})
export class TradeService {

  tradePackage: TradePackage = null;

  constructor(
    private playerService: PlayerService,
    private sleeperService: SleeperService
  ) {
  }

  /**
   * generate trade package based on input trade package
   * uses builder pattern
   * @param undeterminedTradePackage unfinished trade package
   * @param isSuperFlex
   */
  determineTrade(undeterminedTradePackage: TradePackage, isSuperFlex: boolean): TradePackage {
    return this.determineValueAdjustment(undeterminedTradePackage, isSuperFlex);
  }

  /**
   * determine value adjustment from trade
   * @param tradePackage
   * @param isSuperFlex
   */
  determineValueAdjustment(tradePackage: TradePackage, isSuperFlex: boolean): TradePackage {
    // trade value of team sides
    const team1TotalValue = this.playerService.getTotalValueOfPlayersFromList(tradePackage.team1Assets, isSuperFlex);
    const team2TotalValue = this.playerService.getTotalValueOfPlayersFromList(tradePackage.team2Assets, isSuperFlex);
    // total value of trade
    const totalTradeValue = team1TotalValue + team2TotalValue;
    // determine STUD pick
    const studPlayerResponse = this.determineValuePlayer(tradePackage.team1Assets, tradePackage.team2Assets, isSuperFlex);
    const studPlayer = studPlayerResponse?.studPlayer;
    console.log('stud ', studPlayerResponse);
    const studPlayerValue = isSuperFlex ? studPlayer?.sf_trade_value : studPlayer?.trade_value;
    // TODO change when adding multi team support
    if (tradePackage.team2Assets.includes(studPlayer)) {
      tradePackage.valueAdjustmentSide = 2;
    } else {
      tradePackage.valueAdjustmentSide = 1;
    }
    // calculate value adjustment
    const valAdj = Math.round(studPlayerValue / totalTradeValue *
      (tradePackage.valueAdjustmentSide === 1 ? team2TotalValue : team1TotalValue));
    // set all values from calculations in trade package object
    tradePackage.valueAdjustment = Math.round(valAdj * (studPlayerResponse?.adjustmentMultiplier || 1) || 0);
    tradePackage.team1AssetsValue = team1TotalValue;
    tradePackage.team2AssetsValue = team2TotalValue;
    tradePackage.isSuperFlex = isSuperFlex;
    tradePackage.valueToEvenTrade = tradePackage.valueAdjustmentSide === 1 ?
      Math.abs((team1TotalValue + tradePackage.valueAdjustment) - team2TotalValue) || 0 :
      Math.abs((team2TotalValue + tradePackage.valueAdjustment) - team1TotalValue) || 0;
    tradePackage.acceptanceBufferAmount = (totalTradeValue + tradePackage.valueAdjustment) * (tradePackage.acceptanceVariance / 100);
    console.log(tradePackage);
    return tradePackage;
  }

  /**
   * Determines the value adjustment player. This is based on sorting by each team by value.
   * Then we make sure a player of equivalent value (5% range) isn't on the other team.
   * (i.e. Pat Mahomes and Josh Allen are basically equivalent in value so we don't need an adjustment)
   * TODO clean up redundant code
   * @param team1 team 1 players
   * @param team2 team 2 players
   * @param isSuperFlex boolean
   * @private
   */
  private determineValuePlayer(team1: KTCPlayer[], team2: KTCPlayer[], isSuperFlex: boolean): StudPlayerResponse {
    let valueAdjustmentMultiplier = 1;
    const filteredTeam1Players: KTCPlayer[] = team1.slice().sort((a, b) =>
      isSuperFlex ? b.sf_trade_value - a.sf_trade_value : b.trade_value - a.trade_value);
    const filteredTeam2Players: KTCPlayer[] = team2.slice().sort((a, b) =>
      isSuperFlex ? b.sf_trade_value - a.sf_trade_value : b.trade_value - a.trade_value);
    // loop through trade package and remove "equal" value players
    while (filteredTeam1Players.length > 0 && filteredTeam2Players.length > 0) {
      console.log(filteredTeam1Players, filteredTeam2Players);
      const team1Stud = filteredTeam1Players[0];
      const team2Stud = filteredTeam2Players[0];
      if (this.playerService.comparePlayersValue(team1Stud, team2Stud, isSuperFlex)) {
        // team 1 stud is more valuable
        // check if team 2 stud is within 5% of stud
        if (
          isSuperFlex ?
            team1Stud.sf_trade_value * 0.95 <= team2Stud.sf_trade_value
            : team1Stud.trade_value * 0.95 <= team2Stud.trade_value
        ) {
          // remove two players
          filteredTeam2Players.splice(0, 1);
          filteredTeam1Players.splice(0, 1);
        } else {
          valueAdjustmentMultiplier = this.getValueAdjustmentMultiplier(team1Stud, team2, isSuperFlex);
          // return value stud
          return new StudPlayerResponse(team1Stud, valueAdjustmentMultiplier);
        }
      } else {
        // team 2 stud is more valuable
        // check if team 2 stud is within 5% of stud
        if (
          isSuperFlex ?
            team2Stud.sf_trade_value * 0.95 <= team1Stud.sf_trade_value
            : team2Stud.trade_value * 0.95 <= team1Stud.trade_value
        ) {
          // remove two players
          filteredTeam2Players.splice(0, 1);
          filteredTeam1Players.splice(0, 1);
        } else {
          valueAdjustmentMultiplier = this.getValueAdjustmentMultiplier(team2Stud, team1, isSuperFlex);
          // return value stud
          return new StudPlayerResponse(team2Stud, valueAdjustmentMultiplier);
        }
      }
    }
    // if player still exists return that player
    if (filteredTeam1Players.length > 0) {
      return new StudPlayerResponse(filteredTeam1Players[0]);
    }
    if (filteredTeam2Players.length > 0) {
      return new StudPlayerResponse(filteredTeam1Players[0]);
    }
    return null;
  }

  /**
   * find best player based on passed in value
   * @param maxValue max value of player to return
   * @param isSuperFlex is superflex or not
   * @param userIdFilter filter player list by user id or null
   * @param listLength list of players to return
   */
  findBestPlayerForValue(maxValue: number, isSuperFlex: boolean = true, userIdFilter: string = null, listLength: number = 5): KTCPlayer[] {
    // filter list by user id then filter by value last filter by if player is in current trade
    const sortedList = this.filterPlayersList(userIdFilter)
      .filter(player => isSuperFlex ? player.sf_trade_value <= maxValue : player.trade_value <= maxValue)
      .filter(player => !this.tradePackage?.team1Assets.includes(player) && !this.tradePackage?.team2Assets.includes(player));
    // sort list by largest value
    return sortedList.sort((a, b) => isSuperFlex ?
      b.sf_trade_value - a.sf_trade_value : b.trade_value - a.trade_value).slice(0, listLength);
  }

  /**
   * Filters list of all players by team.
   * Used for filtering which players show up in searches
   * @param userId string
   * @private
   */
  filterPlayersList(userId: string = null): KTCPlayer[] {
    if (userId) {
      // filter players by team
      const playerList = this.playerService.playerValues.filter(it => it.owner?.userId === userId);
      // get draft capital for team in filter
      const team = this.sleeperService.getTeamByUserId(userId);
      if (team) {
        const picks = this.sleeperService.getDraftCapitalToNameId([...team.futureDraftCapital, ...team.draftCapital]);
        picks.map(pick => {
          const pickPlayer = this.playerService.getPlayerByNameId(pick);
          if (pickPlayer) {
            playerList.push(pickPlayer);
          }
        });
      }
      return playerList.sort((a, b) => b.sf_trade_value - a.sf_trade_value);
    } else {
      return this.playerService.playerValues;
    }
  }

  /**
   * returns a multiplier for modifying the value adjustment
   * @param stud stud player in trade
   * @param otherTeam assets
   * @param isSuperFlex is super flex
   * @private
   */
  private getValueAdjustmentMultiplier(stud: KTCPlayer, otherTeam: KTCPlayer[], isSuperFlex: boolean): number {
    let valueModifier = 1;
    const studPosition = this.playerService.getPlayersValueIndex(stud, isSuperFlex);
    otherTeam.forEach(player => {
      if (        isSuperFlex ?
        stud.sf_trade_value * 0.95 > player.sf_trade_value
        : stud.trade_value * 0.95 > player.trade_value) {
        if (Math.abs(studPosition
          - this.playerService.getPlayersValueIndex(player, isSuperFlex)) <= (studPosition < 10 ? 5 : 20) ) {
          valueModifier -= 0.2;
        }
      }

    });
    return valueModifier;
  }

  /**
   * get total amount of trade package by side
   * @param teamNumber 1 or 2
   */
  getTradeValueBySide(teamNumber: number): number {
    if (!this.tradePackage) {
      return 0;
    }
    if (teamNumber === 1) {
      return this.tradePackage?.team1AssetsValue + (
        this.tradePackage?.valueAdjustmentSide === 1
          ? this.tradePackage.valueAdjustment : 0);
    } else {
      return this.tradePackage?.team2AssetsValue + (
        this.tradePackage?.valueAdjustmentSide === 2
          ? this.tradePackage.valueAdjustment : 0);
    }
  }
}
