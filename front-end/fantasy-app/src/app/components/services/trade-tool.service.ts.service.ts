import {Injectable} from '@angular/core';
import {TradePackage} from '../model/tradePackage';
import {KTCPlayer} from '../../model/KTCPlayer';
import {PlayerService} from '../../services/player.service';

@Injectable({
  providedIn: 'root'
})
export class TradeService {

  tradePackage: TradePackage = null;

  constructor(
    private playerService: PlayerService
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
    const studPlayer = this.determineValuePlayer(tradePackage.team1Assets, tradePackage.team2Assets, isSuperFlex);
    console.log('stud ', studPlayer);
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
    tradePackage.valueAdjustment = valAdj || 0;
    tradePackage.team1AssetsValue = team1TotalValue;
    tradePackage.team2AssetsValue = team2TotalValue;
    tradePackage.isSuperFlex = isSuperFlex;
    tradePackage.valueToEvenTrade = tradePackage.valueAdjustmentSide === 1 ?
      Math.abs((team1TotalValue + valAdj) - team2TotalValue) || 0 :
      Math.abs((team2TotalValue + valAdj) - team1TotalValue) || 0;
    tradePackage.acceptanceBufferAmount = (totalTradeValue + tradePackage.valueAdjustment) * (tradePackage.acceptanceVariance / 100);
    console.log(tradePackage);
    return tradePackage;
  }

  /**
   * Determines the value adjustment player. This is based on sorting by each team by value.
   * Then we make sure a player of equivalent value (5% range) isn't on the other team.
   * (i.e. Pat Mahomes and Josh Allen are basically equivalent in value so we don't need an adjustment)
   *
   * @param team1 team 1 players
   * @param team2 team 2 players
   * @param isSuperFlex boolean
   * @private
   */
  private determineValuePlayer(team1: KTCPlayer[], team2: KTCPlayer[], isSuperFlex: boolean): KTCPlayer {
    const filteredTeam1Players: KTCPlayer[] = team1.slice().sort((a, b) =>
      isSuperFlex ? b.sf_trade_value - a.sf_trade_value : b.trade_value - a.trade_value);
    const filteredTeam2Players: KTCPlayer[] = team2.slice().sort((a, b) =>
      isSuperFlex ? b.sf_trade_value - a.sf_trade_value : b.trade_value - a.trade_value);
    // loop through trade package and remove "equal" value players
    while (filteredTeam1Players.length > 0 && filteredTeam2Players.length > 0) {
      console.log(filteredTeam1Players, filteredTeam2Players);
      const team1Stud = filteredTeam1Players[0];
      const team2Stud = filteredTeam2Players[0];
      if (this.playerService.comparePlayers(team1Stud, team2Stud, isSuperFlex)) {
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
          // return value stud
          return team1Stud;
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
          // return value stud
          return team2Stud;
        }
      }
    }
    // if player still exists return that player
    if (filteredTeam1Players.length > 0) {
      return filteredTeam1Players[0];
    }
    if (filteredTeam2Players.length > 0) {
      return filteredTeam2Players[0];
    }
    return null;
  }
}
