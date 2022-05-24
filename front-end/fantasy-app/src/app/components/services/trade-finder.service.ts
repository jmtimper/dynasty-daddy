import { Injectable } from '@angular/core';
import {KTCPlayer} from '../../model/KTCPlayer';
import {TradePackage} from '../model/tradePackage';
import {TradeService} from './trade.service.ts.service';

@Injectable({
  providedIn: 'root'
})
export class TradeFinderService {

  selectedTeamUserId: string;

  selectedPlayers: KTCPlayer[] = [];

  constructor(private tradeService: TradeService) { }

  /**
   * Generate list of valid trade packages
   * @param players lists of players in trade finder
   * @param userId team 1 user id
   * @param isSuperFlex is superflex league
   * @param limit how many results to return. DEFAULT 10
   * @return list of trade packages
   */
  generateTradeFinderResults(players: KTCPlayer[], userId: string, isSuperFlex: boolean = true, limit: number = 10): TradePackage[] {
    const tradePackages = [];
    for (let i = 0; i < limit; i++) {
      const newTrade = new TradePackage(players, [])
        .setTeam1(userId)
        .setAutofill();
      const processedTrade = this.tradeService.determineTrade(newTrade, isSuperFlex);
      tradePackages.push(processedTrade);
    }
    return tradePackages;
  }
}
