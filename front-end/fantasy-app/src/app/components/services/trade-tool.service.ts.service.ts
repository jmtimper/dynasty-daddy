import {Injectable} from '@angular/core';
import {TradePackage} from '../model/tradePackage';
import {KTCPlayer} from '../../model/KTCPlayer';
import {PlayerService} from '../../services/player.service';

@Injectable({
  providedIn: 'root'
})
export class TradeService {

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

    undeterminedTradePackage = this.determineValueAdjustment(undeterminedTradePackage, isSuperFlex);

    return undeterminedTradePackage;
  }

  /**
   * determine value adjustment from trade
   * @param tradePackage
   * @param isSuperFlex
   */
  determineValueAdjustment(tradePackage: TradePackage, isSuperFlex: boolean): TradePackage {
    // all players in trade
    const allAssets = [...tradePackage.team2Assets, ...tradePackage.team1Assets];
    // trade value of team sides
    const team1TotalValue = this.playerService.getTotalValueOfPlayersFromList(tradePackage.team1Assets, isSuperFlex);
    const team2TotalValue = this.playerService.getTotalValueOfPlayersFromList(tradePackage.team2Assets, isSuperFlex);
    // total value of trade
    const totalTradeValue = team1TotalValue + team2TotalValue;
    // determine STUD pick
    const studPlayer = this.getStudPlayer(allAssets, isSuperFlex);
    // difference between each side
    const tradeValueDiff = Math.abs(team2TotalValue - team1TotalValue);
    // logic of multiplier
    const multiplier = 1 + ((isSuperFlex ? studPlayer.sf_trade_value : studPlayer.trade_value) / totalTradeValue);
    // TODO change when adding multi team support
    if (tradePackage.team2Assets.includes(studPlayer)) {
      tradePackage.valueAdjustmentSide = 2;
    } else {
      tradePackage.valueAdjustmentSide = 1;
    }
    const valAdj = (tradePackage.valueAdjustmentSide === 1 ? team1TotalValue : team2TotalValue) - tradeValueDiff * multiplier;
    tradePackage.valueAdjustment = valAdj;
    console.log(valAdj, team1TotalValue, team2TotalValue);
    console.log(tradePackage);
    return tradePackage;
  }

  /**
   * get the STUD player from list of players
   * @param players
   * @param isSuperFlex
   * @private
   */
  private getStudPlayer(players: KTCPlayer[], isSuperFlex: boolean): KTCPlayer {
    let stud: KTCPlayer = players[0];
    players.slice(1).map(player => {
        if (isSuperFlex ? player.sf_trade_value > stud.sf_trade_value : player.trade_value > stud.trade_value) {
          stud = player;
        }
      }
    );
    return stud;
  }
}
