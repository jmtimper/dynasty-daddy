import {Injectable} from '@angular/core';
import {TransactionPlayer, TransactionUI} from '../model/transaction';
import {SleeperRawTradePicksData, SleeperTeam, SleeperTeamTransactionData} from '../../model/SleeperLeague';
import {SleeperService} from '../../services/sleeper.service';
import {NflService} from '../../services/utilities/nfl.service';
import {PlayerService} from '../../services/player.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {

  /** aggregate values for transactions */
  transactionAggregate = {};

  constructor(private sleeperService: SleeperService, private nflService: NflService, private playerService: PlayerService) {
  }

  /**
   * generate team transaction history from sleeper team object
   * @param selectedTeam
   */
  generateTeamTransactionHistory(selectedTeam: SleeperTeam): TransactionUI[] {
    const teamActivity = [];
    for (let i = this.sleeperService.selectedLeague.startWeek; i < this.sleeperService.selectedLeague.playoffStartWeek; i++) {
      for (const transaction of this.sleeperService.selectedLeague.leagueTransactions[i] as SleeperTeamTransactionData[]) {
        if (transaction.rosterIds.includes(selectedTeam.roster.rosterId) && transaction.status === 'complete') {
          teamActivity.push(this.formatTransactionUI(transaction, selectedTeam));
        }
      }
    }
    for (const activity of teamActivity) {
      activity.netValue = this.calculateNetValue(activity);
      activity.headerDisplay = this.getTransactionHeaderDisplay(activity, selectedTeam.roster.rosterId);
    }
    teamActivity.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    return teamActivity;
  }

  /**
   * format transaction into transactionUI object for display
   * @param transaction
   * @param selectedTeam
   * @private
   */
  private formatTransactionUI(transaction: SleeperTeamTransactionData, selectedTeam: SleeperTeam): TransactionUI {
    const adds = [];
    for (const sleeperId in transaction.adds) {
      if (transaction.adds[sleeperId] === selectedTeam.roster.rosterId) {
        adds.push(this.getPlayerDetails(sleeperId, selectedTeam.roster.rosterId));
      }
    }
    const drops = [];
    for (const sleeperId in transaction.drops) {
      if (transaction.drops[sleeperId] === selectedTeam.roster.rosterId) {
        drops.push(this.getPlayerDetails(sleeperId, selectedTeam.roster.rosterId));
      }
    }
    for (const draftPick of transaction.draftpicks) {
      if (draftPick.ownerId === selectedTeam.roster.rosterId) {
        adds.push(this.processTransactionPicks(draftPick, selectedTeam.roster.rosterId));
      } else if (draftPick.previousOwnerId === selectedTeam.roster.rosterId) {
        drops.push(this.processTransactionPicks(draftPick, selectedTeam.roster.rosterId));
      }
    }
    return new TransactionUI(transaction, adds, drops);
  }

  /**
   * get player details from sleeper id
   * @param sleeperId
   * @param rosterId
   * @private
   */
  private getPlayerDetails(sleeperId: string, rosterId: number): TransactionPlayer {
    const player = this.playerService.getPlayerBySleeperId(sleeperId);
    if (player) {
      return {
        playerName: player.full_name, value: this.sleeperService.selectedLeague.isSuperflex ?
          player.sf_trade_value : this.playerService.playerValueAnalysis[player.name_id].trade_value, rosterId
      };
    } else {
      return {playerName: this.sleeperService.sleeperPlayers[sleeperId].full_name, value: 0, rosterId};
    }
  }

  /**
   * get pick details from draft pick
   * @param draftPick draft
   * @param rosterId team roster id
   * @private
   */
  private processTransactionPicks(draftPick: SleeperRawTradePicksData, rosterId: number): TransactionPlayer {
    const pick = this.playerService.getEstimatePickValueBy(draftPick.round, draftPick.season);
    if (pick) {
      return {
        playerName: pick.full_name, value: this.sleeperService.selectedLeague.isSuperflex ?
          pick.sf_trade_value : pick.trade_value, rosterId
      };
    } else {
      return {
        playerName: draftPick.season + ' ' + draftPick.round + 'th', value: 0, rosterId
      };
    }

  }

  /**
   * calculate net value of transaction
   * @param transactionUI
   * @private
   */
  private calculateNetValue(transaction: TransactionUI): number {
    let netValue = 0;
    for (const add of transaction.adds) {
      netValue += add.value;
    }
    for (const drop of transaction.drops) {
      netValue -= drop.value;
    }
    return netValue;
  }

  /**
   * create display header for transaction
   * @param transaction
   * @param selectedRosterId
   * @private
   */
  private getTransactionHeaderDisplay(transaction: TransactionUI, selectedRosterId: number): string {
    switch (transaction.type) {
      case 'trade': {
        const teams = [];
        for (const rosterId of transaction.rosterIds) {
          for (const team of this.sleeperService.sleeperTeamDetails) {
            if (team.roster.rosterId === rosterId && selectedRosterId !== team.roster.rosterId) {
              teams.push(team.owner?.teamName);
              break;
            }
          }
        }
        return 'Trade with ' + teams.toString();
      }
      default: {
        return 'Free Agent Signing';
      }
    }
  }

  /**
   * returns number of trades in transactions
   * @param teamActivity
   */
  getTradeTotal(teamActivity: TransactionUI[]): number {
    let tradeCount = 0;
    for (const activity of teamActivity) {
      if (activity.type === 'trade') {
        tradeCount++;
      }
    }
    return tradeCount;
  }

  /**
   * returns net value returned from transactions
   * @param teamActivity
   */
  getNetValueAdded(teamActivity: TransactionUI[]): number {
    let netValue = 0;
    for (const activity of teamActivity) {
      netValue += activity.netValue;
    }
    return netValue;
  }

  /**
   * generate transaction aggregate for teams
   * @param endWeek
   */
  generateTransactionAggregate(endWeek: number): void {
    if (this.sleeperService.selectedLeague.leagueTransactions && this.sleeperService.selectedLeague.leagueTransactions[1]) {
      this.transactionAggregate = {};
      for (let rosterId = 1; rosterId <= this.sleeperService.selectedLeague.totalRosters; rosterId++) {
        this.transactionAggregate[rosterId] = {actions: 0, trades: 0};
      }
      for (let i = this.sleeperService.selectedLeague.startWeek; i <= endWeek; i++) {
        if (this.sleeperService.selectedLeague.leagueTransactions[i]) {
          this.sleeperService.selectedLeague.leagueTransactions[i]?.map(transaction => {
            transaction?.rosterIds.map(team => {
              transaction.type === 'trade' ? this.transactionAggregate[team].trades++ : this.transactionAggregate[team].actions++;
            });
          });
        }
      }
    }
  }

  /** reset aggregate */
  reset(): void {
    this.transactionAggregate = {};
  }
}
