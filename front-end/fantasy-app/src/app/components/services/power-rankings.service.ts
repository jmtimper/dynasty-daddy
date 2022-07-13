import {Injectable} from '@angular/core';
import {SleeperTeam} from '../../model/SleeperLeague';
import {KTCPlayer} from '../../model/KTCPlayer';
import {PositionPowerRanking, TeamPowerRanking, TeamRankingTier} from '../model/powerRankings';
import {SleeperService} from '../../services/sleeper.service';
import {PlayerService} from '../../services/player.service';
import {Observable, of} from 'rxjs';
import {max, min} from 'simple-statistics';

@Injectable({
  providedIn: 'root'
})
export class PowerRankingsService {

  /** team power rankings */
  powerRankings: TeamPowerRanking[] = [];

  constructor(private sleeperService: SleeperService, public playerService: PlayerService) {
  }

  /** supported position groups to power rank */
  positionGroups: string[] = ['QB', 'RB', 'WR', 'TE'];

  /**
   * maps players to sleeper id's on rosters
   * @param teams
   * @param players
   */
  mapPowerRankings(teams: SleeperTeam[], players: KTCPlayer[]): Observable<any> {
    try {
      if (this.powerRankings.length === 0) {
        teams?.map((team) => {
          const roster = [];
          let sfTradeValueTotal = 0;
          let tradeValueTotal = 0;
          // TODO refactor this section both comparisons are redundant
          for (const sleeperId of team.roster?.players) {
            for (const player of players) {
              if (sleeperId === player.sleeper_id) {
                roster.push(player);
                sfTradeValueTotal += player.sf_trade_value;
                tradeValueTotal += player.trade_value;
                break;
              }
            }
          }
          const positionRoster: PositionPowerRanking[] = [];
          for (const group of this.positionGroups) {
            let sfTradeValue = 0;
            let tradeValue = 0;
            let groupList: KTCPlayer[] = [];
            groupList = roster.filter(player => {
              if (player.position === group) {
                sfTradeValue += player.sf_trade_value;
                tradeValue += player.trade_value;
                return player;
              }
            });
            positionRoster.push(new PositionPowerRanking(group, sfTradeValue, tradeValue, groupList));
          }
          const pickValues = players.filter(player => {
            return player.position === 'PI';
          });
          const picks: KTCPlayer[] = [];
          let sfPickTradeValue = 0;
          let pickTradeValue = 0;
          // combine upcoming and future draft capital for rankings
          const allPicks = team.draftCapital.concat(team.futureDraftCapital);
          allPicks.map(pick => {
              for (const pickValue of pickValues) {
                if (pickValue.last_name.includes(pick.round.toString()) && pickValue.first_name === pick.year) {
                  if (pick.pick < 5 && pickValue.last_name.includes('Early')) {
                    sfPickTradeValue += pickValue.sf_trade_value;
                    pickTradeValue += pickValue.trade_value;
                    sfTradeValueTotal += pickValue.sf_trade_value;
                    tradeValueTotal += pickValue.trade_value;
                    picks.push(pickValue);
                    break;
                  } else if (pick.pick > 8 && pickValue.last_name.includes('Late')) {
                    sfPickTradeValue += pickValue.sf_trade_value;
                    pickTradeValue += pickValue.trade_value;
                    sfTradeValueTotal += pickValue.sf_trade_value;
                    tradeValueTotal += pickValue.trade_value;
                    picks.push(pickValue);
                    break;
                  } else if (pick.pick > 4 && pick.pick < 9 && pickValue.last_name.includes('Mid')) {
                    sfPickTradeValue += pickValue.sf_trade_value;
                    pickTradeValue += pickValue.trade_value;
                    sfTradeValueTotal += pickValue.sf_trade_value;
                    tradeValueTotal += pickValue.trade_value;
                    picks.push(pickValue);
                    break;
                  }
                }
              }
            }
          );
          const rankedPicks = new PositionPowerRanking('PI', sfPickTradeValue, pickTradeValue, picks);
          this.powerRankings.push(new TeamPowerRanking(team, positionRoster, sfTradeValueTotal, tradeValueTotal, rankedPicks));
        });
        this.rankTeams(this.sleeperService.selectedLeague.isSuperflex);
      }
    } catch (e: any) {
      console.error('Error Mapping League Data: ', e);
    }
    return of(this.powerRankings);
  }

  /**
   * sort position groups based on value
   * @param isSuperflex
   */
  sortRosterByValue(isSuperflex: boolean): void {
    this.powerRankings.map(team => {
      for (const group of team.roster) {
        group.players.sort((a, b) => {
          if (isSuperflex) {
            return b.sf_trade_value - a.sf_trade_value;
          } else {
            return b.trade_value - a.trade_value;
          }
        });
      }
      team.picks.players.sort((a, b) => {
        if (isSuperflex) {
          return b.sf_trade_value - a.sf_trade_value;
        } else {
          return b.trade_value - a.trade_value;
        }
      });
    });
  }

  /**
   * calculates and ranks teams based on trade value
   * @param isSuperflex
   */
  rankTeams(isSuperflex: boolean): void {
    // Sort position groups and picks desc
    this.sortRosterByValue(isSuperflex);
    // Rank position groups
    this.positionGroups.forEach((value, index) => {
      this.powerRankings.sort((teamA, teamB) => {
        if (isSuperflex) {
          return teamB.roster[index].sfTradeValue - teamA.roster[index].sfTradeValue;
        } else {
          return teamB.roster[index].tradeValue - teamA.roster[index].tradeValue;
        }
      });
      this.powerRankings.forEach((team, teamIndex) => {
        team.roster[index].rank = teamIndex + 1;
      });
    });
    // Rank picks
    this.powerRankings.sort((teamA, teamB) => {
      if (isSuperflex) {
        return teamB.picks.sfTradeValue - teamA.picks.sfTradeValue;
      } else {
        return teamB.picks.tradeValue - teamA.picks.tradeValue;
      }
    });
    this.powerRankings.forEach((team, teamIndex) => {
      team.picks.rank = teamIndex + 1;
    });
    // calculate best starting lineup
    this.calculateStarterValue();
    // Rank starting lineups
    this.powerRankings = this.sortOnStarterValue(this.powerRankings, isSuperflex);
    this.powerRankings.forEach((team, index) => {
      team.starterRank = index + 1;
    });
    // rank overall points
    this.powerRankings.sort((teamA, teamB) => {
      if (isSuperflex) {
        return teamB.sfTradeValueOverall - teamA.sfTradeValueOverall;
      } else {
        return teamB.tradeValueOverall - teamA.tradeValueOverall;
      }
    });
    this.powerRankings.forEach((team, index) => {
      team.overallRank = index + 1;
    });
    this.setTeamTiers(isSuperflex);
  }

  /**
   * Sorts team power rankings array by starter value
   * @param teams power ranked teams
   * @param isSuperflex is super flex or not
   * @private
   */
  private sortOnStarterValue(teams: TeamPowerRanking[], isSuperflex: boolean): TeamPowerRanking[] {
    return teams.sort((teamA, teamB) => {
      if (isSuperflex) {
        return teamB.sfTradeValueStarter - teamA.sfTradeValueStarter;
      } else {
        return teamB.tradeValueStarter - teamA.tradeValueStarter;
      }
    });
  }

  /**
   * calculates starters for teams
   */
  calculateStarterValue(): void {
    const positionGroupCount: number[] = [];
    for (const pos of this.positionGroups) {
      positionGroupCount.push(this.getCountForPosition(pos));
    }
    positionGroupCount.push(this.getCountForPosition('FLEX'));
    positionGroupCount.push(this.getCountForPosition('SUPER_FLEX'));
    this.powerRankings.map(team => {
      let teamRosterCount: number[] = positionGroupCount.slice();
      if (teamRosterCount[0] > 0) // qb
      {
        team.starters.push(...this.getHealthyPlayersFromList(team.roster[0].players, teamRosterCount[0]));
      }
      if (teamRosterCount[1] > 0) // rb
      {
        team.starters.push(...this.getHealthyPlayersFromList(team.roster[1].players, teamRosterCount[1]));
      }
      if (teamRosterCount[2] > 0) // wr
      {
        team.starters.push(...this.getHealthyPlayersFromList(team.roster[2].players, teamRosterCount[2]));
      }
      if (teamRosterCount[3] > 0) // te
      {
        team.starters.push(...this.getHealthyPlayersFromList(team.roster[3].players, teamRosterCount[3]));
      }
      if (teamRosterCount[4] > 0) // flex
      {
        teamRosterCount = this.getBestAvailableFlex(teamRosterCount[4], teamRosterCount, team);
      }
      if (teamRosterCount[5] > 0) // sflex
      {
        const superFlexQB = this.getHealthyPlayersFromList(team.roster[0].players, 1, team.starters);
        if (superFlexQB.length > 0) {
          team.starters.push(...superFlexQB);
          teamRosterCount[0]++;
        } else {
          teamRosterCount = this.getBestAvailableFlex(teamRosterCount[5], teamRosterCount, team);
        }
      }
      for (const starter of team.starters) {
        team.sfTradeValueStarter += starter.sf_trade_value;
        team.tradeValueStarter += starter.trade_value;
      }
    });
  }

  /**
   * Determine what the tier bins are and assign teams a tier
   * @param isSuperflex is league superflex
   * @private
   */
  private setTeamTiers(isSuperflex: boolean): void {
    const groups = [];
    // create a map of all starter rankings for teams
    const ratings = this.powerRankings.map(team => {
      return isSuperflex ? team.sfTradeValueStarter : team.tradeValueStarter;
    });
    // get min rating
    const minRating = min(ratings);
    // get max rating
    const maxRating = max(ratings);
    // determine number of bins
    const binCount = Math.ceil(Math.sqrt(ratings.length));
    // calculate the bin width
    const binWidth = (maxRating - minRating) / binCount;
    // set up loop with floor & ceiling
    let binFloor = minRating;
    let binCeiling = minRating + binWidth;
    // loop through teams and determine each group
    for (let groupInd = 0; groupInd < binCount; groupInd++) {
      const newGroup = [];
      this.powerRankings.forEach((team) => {
        if (isSuperflex ? team?.sfTradeValueStarter >= binFloor && team?.sfTradeValueStarter < binCeiling
          : team?.tradeValueStarter >= binFloor &&  team?.tradeValueStarter < binCeiling) {
          newGroup?.push(team);
        }
      });
      // after checking each team push group and set up next group
      groups.push(newGroup);
      binFloor = binCeiling;
      binCeiling += binWidth + 1;
    }

    // assign tier based on grouping
    groups.reverse().map((group, ind) => {
        // set super team if criteria is met
        if (group.length === 1 && ind === 0) {
          group[0].tier = ind;
          // set trust the process if criteria is met
        } else if (group.length === 1 && ind === groups.length - 1) {
          group[0].tier = 5;
        } else {
          group.map((team) => {
            team.tier = ind + 1;
          });
        }
      }
    );
  }

  /**
   * return list of healthy players from list
   * @param players list of players to choose from
   * @param numberOfPlayer number of players to choose
   * @param excludedPlayers players to exclude from search
   * @param excludedStatus injury status to exclude from active
   * @private
   */
  private getHealthyPlayersFromList(
    players: KTCPlayer[],
    numberOfPlayer: number,
    excludedPlayers: KTCPlayer[] = [],
    excludedStatus: string[] = ['PUP', 'IR', 'Sus', 'COV']
  ): KTCPlayer[] {
    const activePlayers = [];
    players.map(player => {
      if (!excludedStatus.includes(player.injury_status) && activePlayers.length < numberOfPlayer && !excludedPlayers.includes(player)) {
        activePlayers.push(player);
      }
    });
    return activePlayers;
  }

  /**
   * determines the best available flex option for team by trade value
   * @param spots
   * @param teamRosterCount
   * @param team
   * @param isSuperFlex
   * @private
   */
  private getBestAvailableFlex(spots: number, teamRosterCount: number[], team: TeamPowerRanking): number[] {
    // create clone for tracking flex
    const processedPlayers = teamRosterCount.slice();

    // selected player count
    let selectedCount = 0;

    // loop and get best flex option
    for (let i = 0; selectedCount < spots; i++) {
      const topRb = team.roster[1]?.players[processedPlayers[1]];
      const topWr = team.roster[2]?.players[processedPlayers[2]];
      const topTe = team.roster[3]?.players[processedPlayers[3]];
      const flexPlayer = this.getBetterPlayer(topTe, this.getBetterPlayer(topRb, topWr));
      // if no player is found return
      if (!flexPlayer) {
        return teamRosterCount;
      }
      processedPlayers[this.positionGroups.indexOf(flexPlayer.position)]++;
      const activeFlex = this.getHealthyPlayersFromList([flexPlayer], 1, team.starters);
      if (activeFlex.length > 0) {
        team.starters.push(flexPlayer);
        teamRosterCount[this.positionGroups.indexOf(flexPlayer.position)]++;
        selectedCount++;
      }
    }
    return teamRosterCount;
  }

  /**
   * determines which player has the higher value
   * @param player1
   * @param player2
   * @private
   */
  private getBetterPlayer(player1: KTCPlayer, player2: KTCPlayer): KTCPlayer {
    if (player1 && player2) {
      if (this.sleeperService.selectedLeague.isSuperflex) {
        if (player1.sf_trade_value > player2.sf_trade_value) {
          return player1;
        } else {
          return player2;
        }
      } else {
        if (player1.trade_value > player2.trade_value) {
          return player1;
        } else {
          return player2;
        }
      }
    } else if (player1) {
      return player1;
    } else {
      return player2;
    }
  }

  /**
   * calculates the number of starter positions by position in league
   * @param position
   * @private
   */
  private getCountForPosition(position: string): number {
    return this.sleeperService.selectedLeague.rosterPositions.filter(x => x === position).length;
  }

  /**
   * resets power rankings
   */
  reset(): void {
    this.powerRankings = [];
  }

  /**
   * gets rankings by team
   * @param rosterId selected roster id
   */
  findTeamFromRankingsByRosterId(rosterId: number): TeamPowerRanking {
    for (const team of this.powerRankings) {
      if (team.team.roster.rosterId === rosterId) {
        return team;
      }
    }
    return null;
  }

  /**
   * gets rankings by team
   * @param rosterId selected roster id
   */
  findTeamFromRankingsByUserId(userId: string): TeamPowerRanking {
    for (const team of this.powerRankings) {
      if (team.team.roster.ownerId === userId) {
        return team;
      }
    }
    return null;
  }
}
