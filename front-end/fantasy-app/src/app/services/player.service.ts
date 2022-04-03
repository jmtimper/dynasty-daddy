/* tslint:disable:object-literal-key-quotes */
import {Injectable} from '@angular/core';
import {KTCPlayer, KTCPlayerDataPoint} from '../model/KTCPlayer';
import {KTCApiService} from './api/ktc-api.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {forkJoin, Observable, of, Subject} from 'rxjs';
import {SleeperTeam} from '../model/SleeperLeague';
import {SleeperApiService} from './api/sleeper/sleeper-api.service';
import {map} from 'rxjs/operators';
import {NflService} from './utilities/nfl.service';
import {mean, standardDeviation, variance} from 'simple-statistics';
import {PlayerInsights} from '../components/model/playerInsights';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  /** player values for today */
  playerValues: KTCPlayer[] = [];

  /** player values for today with no filtering */
  unfilteredPlayerValues: KTCPlayer[] = [];

  /** player values for last month */
  prevPlayerValues: KTCPlayerDataPoint[] = [];

  /** player yearly stats dict from sleeper */
  playerStats = {};

  /** past week dict from sleeper. 18 weeks */
  pastSeasonWeeklyStats = {};

  /** past week dict from sleeper for projections. 18 weeks */
  pastSeasonWeeklyProjections = {};

  /** dict of trade value calculations by player name id */
  playerValueAnalysis = {};

  /** player stats year */
  playerStatsYear: string = '';

  /** league leaders for stat categories */
  leagueLeaders = {
    pts_half_ppr: {value: 0, sleeperId: ''},
    rec: {value: 0, sleeperId: ''},
    pass_yd: {value: 0, sleeperId: ''},
    pass_td: {value: 0, sleeperId: ''},
    rush_att: {value: 0, sleeperId: ''},
    rush_td: {value: 0, sleeperId: ''},
    rush_yd: {value: 0, sleeperId: ''},
    rec_yd: {value: 0, sleeperId: ''},
    pass_cmp: {value: 0, sleeperId: ''},
    fum_lost: {value: 0, sleeperId: ''},
    pass_int: {value: 0, sleeperId: ''},
    rec_td: {value: 0, sleeperId: ''},
    rec_tgt: {value: 0, sleeperId: ''}
  };

  /** subject for loading player values */
  $currentPlayerValuesLoaded: Subject<void> = new Subject<void>();

  constructor(private ktcApiService: KTCApiService,
              private sleeperApiService: SleeperApiService,
              private spinner: NgxSpinnerService,
              private nflService: NflService) {
  }

  /**
   * loads all player data upon entering site
   */
  loadPlayerValuesForToday(): void {
    this.spinner.show();
    forkJoin(
      [
        this.ktcApiService.getPlayerValuesForToday(),
        this.ktcApiService.getPrevPlayerValues()
      ]
    ).subscribe(([currentPlayers, pastPlayers]) => {
      this.prevPlayerValues = pastPlayers;
      this.unfilteredPlayerValues = currentPlayers;
      this.playerValues = currentPlayers.filter(player => {
        if (player.position === 'PI') {
          return Number(player.first_name) >= new Date().getFullYear();
        } else {
          return player;
        }
      });
      this.$loadPlayerStatsForSeason().subscribe((playerStatsResponse) => {
        this.spinner.hide();
        console.log('state of nfl: ', this.nflService.stateOfNFL);
        this.$currentPlayerValuesLoaded.next();
      }, sleeperError => {
        console.error(`Could Not Load Player Points from sleeper - ${sleeperError}`);
        this.spinner.hide();
      });
      this.playerValues.map(player => {
        this.playerValueAnalysis[player.name_id] = {
          sf_change: this.getPercentChange(player, true),
          standard_change: this.getPercentChange(player, false),
          sf_trade_value: this.getCurrentPlayerValue(player, true),
          trade_value: this.getCurrentPlayerValue(player, false)
        };
      });
      return of(this.playerValues);
    }, error => {
      console.error(`Could Not Load Player Values - ${error}`);
      this.spinner.hide();
      return of(null);
    });
  }

  /**
   * load player stats and projection for season
   * @private
   */
  private $loadPlayerStatsForSeason(): Observable<any> {
    if (this.playerStatsYear !== '') {
      return of(this.playerStats);
    }
    return this.nflService.$initStateOfNfl().pipe(map((season) => {
      this.playerStatsYear = this.nflService.getYearForStats();
      const observe = [];
      observe.push(this.sleeperApiService.getSleeperStatsForYear(this.playerStatsYear).pipe(map((response: any) => {
        this.playerStats = response;
        // get league leaders
        // tslint:disable-next-line:forin
        for (const key in this.playerStats) {
          for (const field in this.leagueLeaders) {
            if (!key.includes('TEAM') && this.playerStats[key]?.[field]
              && this.leagueLeaders[field].value < this.playerStats[key]?.[field]) {
              this.leagueLeaders[field].value = this.playerStats[key]?.[field];
              this.leagueLeaders[field].sleeperId = key;
            }
          }
        }
        return of(this.playerStats);
      })));
      let currentWeekInd = this.nflService.stateOfNFL.seasonType !== 'post' ? this.nflService.stateOfNFL.completedWeek : 18;
      let currentYearInd = Number(this.nflService.getYearForStats());
      for (let weekNum = 1; weekNum < 19; weekNum++) {
        if (currentWeekInd === 0) {
          currentYearInd = currentYearInd - 1;
          currentWeekInd = currentYearInd < 2021 ? 17 : 18;
        }
        observe.push(this.sleeperApiService.getSleeperStatsForWeek(
          currentYearInd.toString(),
          currentWeekInd).pipe(map((weeklyStats) => {
          this.pastSeasonWeeklyStats[weekNum] = weeklyStats;
          return of(weeklyStats);
        })));

        observe.push(this.sleeperApiService.getSleeperProjectionsForWeek(
          currentYearInd.toString(),
          currentWeekInd).pipe(map((weeklyStats) => {
          this.pastSeasonWeeklyProjections[weekNum] = weeklyStats;
          return of(weeklyStats);
        })));
        currentWeekInd--;
      }
      forkJoin(observe).subscribe(() => {
          return of(this.pastSeasonWeeklyStats);
        }
      );
      return of(this.pastSeasonWeeklyStats);
    }));
  }

  /**
   * assign players to fantasy teams
   * @param team
   */
  generateRoster(team: SleeperTeam): KTCPlayer[] {
    const roster = [];
    if (!team.roster.players) {
      return [];
    }
    for (const sleeperId of team.roster?.players) {
      for (const player of this.playerValues) {
        if (sleeperId === player.sleeper_id) {
          player.owner = team.owner;
          roster.push(player);
          break;
        }
      }
    }
    return roster;
  }

  /**
   * get player based on sleeper id
   * @param id
   */
  getPlayerBySleeperId(id: string): KTCPlayer {
    for (const player of this.playerValues) {
      if (id === player.sleeper_id) {
        return player;
      }
    }
    return null;
  }

  /**
   * get player based on name id for previous month
   * @param id
   * TODO change value percent to be based on date passed in?
   */
  getPrevPlayerValueByNameId(nameId: string): KTCPlayerDataPoint {
    for (const player of this.prevPlayerValues) {
      if (nameId === player.name_id) {
        return player;
      }
    }
    return null;
  }

  /**
   * reset players owners when changing leagues
   */
  resetOwners(): void {
    for (const player of this.playerValues) {
      player.owner = null;
    }
  }

  /**
   * get full team name from acc
   * @param acc
   */
  getFullTeamNameFromACC(acc: string): string {
    return this.nflService.teamAccToFullName[acc];
  }

  /**
   * returns players current value based name id
   * @param id
   */
  getPlayerByNameId(id: string): KTCPlayer {
    for (const player of this.playerValues) {
      if (id === player.name_id) {
        return player;
      }
    }
    return null;
  }

  /**
   * get week label for table
   * @param index
   */
  getWeekByIndex(index: number): string {
    index--;
    if (this.nflService.stateOfNFL) {
      let weekNum = this.nflService.stateOfNFL.completedWeek - index;
      let year = Number(this.nflService.getYearForStats());
      if (weekNum < 1) {
        year--;
        weekNum = (year < 2021 ? 17 : 18) - Math.abs(weekNum);
        if (weekNum < 1) {
          year--;
          weekNum = (year < 2021 ? 17 : 18) - Math.abs(weekNum);
        }
      }
      return 'Week ' + weekNum + ' ' + year;
    }
  }

  /**
   * return mid round pick for given year and round
   * @param round
   * @param season
   */
  getEstimatePickValueBy(round: number, season: string): KTCPlayer {
    for (const player of this.playerValues) {
      if (player.first_name === season) {
        if (round === 1 && player.full_name.includes('Mid 1st')) {
          return player;
        } else if (round === 2 && player.full_name.includes('Mid 2nd')) {
          return player;
        } else if (round === 3 && player.full_name.includes('Mid 3rd')) {
          return player;
        } else if (round === 4 && player.full_name.includes('Mid 4th')) {
          return player;
        }
      }
    }
    return null;
  }

  /**
   * return index of player in player values
   * @param nameId
   */
  getRankOfPlayerByNameId(nameId: string, playerList: KTCPlayer[] = this.playerValues): number {
    for (let i = 0; i < playerList.length; i++) {
      if (nameId === playerList[i].name_id) {
        return i;
      }
    }
    return -1;
  }

  /**
   * get Adjacent players by value
   * @param nameId name of player to get adj to
   * @param posFilter what pos to filter on, if empty include all
   * @param isSuperflex is value superflex or standard, default to true
   */
  getAdjacentPlayersByNameId(nameId: string, posFilter: string = '', isSuperflex: boolean = true): KTCPlayer[] {
    const cleanedPlayerList = this.cleanOldPlayerData(this.playerValues);
    const players = [];
    if (!isSuperflex) {
      cleanedPlayerList.sort((a, b) => {
        return this.playerValueAnalysis[b.name_id].trade_value - this.playerValueAnalysis[a.name_id].trade_value;
      });
    }
    const playerRank = this.getRankOfPlayerByNameId(nameId, cleanedPlayerList);
    for (let upInd = playerRank - 1; upInd >= 0 && players.length < 4; upInd--) {
      if (posFilter.length === 0 || cleanedPlayerList[upInd].position === posFilter) {
        players.push(cleanedPlayerList[upInd]);
      }
    }
    for (let downInd = playerRank; downInd < cleanedPlayerList.length && players.length < 9; downInd++) {
      if (posFilter.length === 0 || cleanedPlayerList[downInd].position === posFilter) {
        players.push(cleanedPlayerList[downInd]);
      }
    }
    return players.sort((a, b) => {
      return isSuperflex ? this.playerValueAnalysis[b.name_id].sf_trade_value - this.playerValueAnalysis[a.name_id].sf_trade_value
        : this.playerValueAnalysis[b.name_id].trade_value - this.playerValueAnalysis[a.name_id].trade_value;
    });
  }

  /**
   * returns draft picks values for year
   * @param season season defaults to next season
   */
  getDraftPicksForYear(season: string = (Number(this.nflService.stateOfNFL.season) + 1).toString()): KTCPlayer[] {
    const draftpicks = this.playerValues.filter(pick => {
      if (pick.position === 'PI' && pick.full_name.includes(season)) {
        return pick;
      }
    });
    return draftpicks;
  }

  /**
   * calculate and return percent change over a month
   * @param element ktcplayer
   * @param isSuperFlex boolean
   */
  getPercentChange(element: KTCPlayer, isSuperFlex: boolean): number {
    const playerDataPoint = this.getPrevPlayerValueByNameId(element.name_id);
    // check if data point is older than 2 days
    const yesterdayDate = new Date().getTime() - 1000 * 60 * 60 * 24;
    const isCurrent = new Date(element.date).setHours(0, 0, 0, 0) >= new Date(yesterdayDate).setHours(0, 0, 0, 0);
    if (playerDataPoint) {
      const changeAmount = isSuperFlex ? (isCurrent ? element.sf_trade_value : 0) - playerDataPoint.sf_trade_value
        : (isCurrent ? element.trade_value : 0) - playerDataPoint.trade_value;
      const prevAmount = isSuperFlex ? (playerDataPoint.sf_trade_value > 0 ? playerDataPoint.sf_trade_value : 1)
        : (playerDataPoint.trade_value > 0 ? playerDataPoint.trade_value : 1);
      return Math.round(changeAmount / prevAmount * 100);
    } else {
      const changeAmount = isSuperFlex ? (isCurrent ? element.sf_trade_value : 0) - 0
        : (isCurrent ? element.trade_value : 0) - 0;
      return Math.round(changeAmount);
    }
  }

  /**
   * returns current value of player with a week buffer
   * @param player ktc player
   * @param isSuperFlex boolean
   */
  getCurrentPlayerValue(player: KTCPlayer, isSuperFlex: boolean): number {
    const now = new Date();
    const lastWeekMs = now.getTime() - 1000 * 60 * 60 * 24 * 7;
    if (player.position !== 'PI' && new Date(player.date).setHours(0, 0, 0, 0) < new Date(lastWeekMs).setHours(0, 0, 0, 0)) {
      return 0;
    } else {
      return isSuperFlex ? player.sf_trade_value : player.trade_value;
    }
  }

  /**
   * calculate the player insights for a player
   * @param player
   */
  getPlayerInsights(player: KTCPlayer, isSuperFlex: boolean = true): PlayerInsights {
    const dataSet = [];
    let high = 0;
    let low = 100;
    for (let weekNum = 1; weekNum < 19; weekNum++) {
      // push datapoint if exists for insights
      if (this.pastSeasonWeeklyStats[weekNum][player.sleeper_id] !== undefined
        && this.pastSeasonWeeklyStats[weekNum][player.sleeper_id].pts_half_ppr !== undefined) {
        // update high if weekly high
        if (this.pastSeasonWeeklyStats[weekNum][player.sleeper_id]?.pts_half_ppr > high) {
          high = this.pastSeasonWeeklyStats[weekNum][player.sleeper_id]?.pts_half_ppr;
        }
        // updated low if weekly low
        if (this.pastSeasonWeeklyStats[weekNum][player.sleeper_id]?.pts_half_ppr < low) {
          low = this.pastSeasonWeeklyStats[weekNum][player.sleeper_id]?.pts_half_ppr;
        }
        dataSet.push(this.pastSeasonWeeklyStats[weekNum][player.sleeper_id].pts_half_ppr);
      }
    }
    try {
      // calculate mean from data set
      const ptsMean = mean(dataSet);
      // calculate variance from data set
      const varPoint = variance(dataSet);
      // calculate standard deviation from data set
      const stdDev = standardDeviation(dataSet);
      // calculate point per value ratio
      const valuePointRatio = (isSuperFlex ? player.sf_trade_value : player.trade_value) / ptsMean;
      return {
        gamesPlayed: dataSet.length,
        mean: Math.round(ptsMean * 100) / 100,
        high,
        low,
        variance: Math.round(varPoint * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        valuePerPointRatio: Math.round(valuePointRatio * 100) / 100
      };
    } catch (e: any) {
      console.error('Could not generate player insight. ', e);
    }
  }

  /**
   * returns a list of player values excluding old draft picks and players
   * @param inputPlayers list of players and picks
   */
  cleanOldPlayerData(inputPlayers: KTCPlayer[]): KTCPlayer[] {
    return inputPlayers.filter((player) => {
      if (player.position === 'PI') {
        return this.getCurrentPlayerValue(player, true) !== 0;
      } else {
        // return player if they have had a data point in the past year
        const yearInThePast = new Date().getTime() - 1000 * 60 * 60 * 24 * 365;
        return new Date(player.date).setHours(0, 0, 0, 0)
          >= new Date(yearInThePast).setHours(0, 0, 0, 0);
      }
    });
  }

  /**
   * accepts a list of players and returns the total trade value of list
   */
  getTotalValueOfPlayersFromList(players: KTCPlayer[], isSuperFlex: boolean = true): number {
    let totalValue = 0;
    players.map(player => {
      totalValue += isSuperFlex ? player.sf_trade_value : player.trade_value;
    });
    return totalValue;
  }
}
