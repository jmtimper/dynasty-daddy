import {Injectable} from '@angular/core';
import {SleeperPlayoffMatchUp, SleeperTeam} from '../../model/SleeperLeague';
import {Division, MatchUpProbability, SimulatedTeamInfo} from '../model/playoffCalculator';
import {SleeperLeagueData} from '../../model/SleeperUser';
import {PowerRankingsService} from './power-rankings.service';
import {MatchupService} from './matchup.service';
import {MatchUpUI} from '../model/matchup';
import {SleeperService} from '../../services/sleeper.service';
import {NflService} from '../../services/utilities/nfl.service';
import {cumulativeStdNormalProbability, mean, median, standardDeviation, zScore} from 'simple-statistics';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayoffCalculatorService {

  /** division objects */
  divisions: Division[] = [];

  /** array of arrays of match ups with prob */
  matchUpsWithProb: MatchUpProbability[][] = [];

  /** team odds dict of object with proj wins and proj losses based on roster id key */
  teamsProjectedRecord = {};

  /** team Prob values by roster id */
  teamRatingsPValues = {};

  /** odds values by roster id */
  teamPlayoffOdds = {};

  /** how many selected wins by roster id, used for season table record */
  selectedGameResults = {};

  /** median win probability for each team based on median of team rank 6 and 7 */
  medianWinProbability = {};

  /** force show records of teams on table if game results are selected */
  forceShowRecord: boolean = false;

  /** total number of simulations, if changed make sure to update percentage function */
  NUMBER_OF_SIMULATIONS = 10000;

  constructor(
    private sleeperService: SleeperService,
    private powerRankingsService: PowerRankingsService,
    private matchUpService: MatchupService,
    private nflService: NflService
  ) {
  }

  /**
   * calculate games with probability
   */
  calculateGamesWithProbability(week: number): void {
    // get mean of team ratings
    const ratings = this.powerRankingsService.powerRankings.map(team => {
      return this.sleeperService.selectedLeague.isSuperflex ? team.sfTradeValueStarter : team.tradeValueStarter;
    });
    const meanRating = mean(ratings);

    // get standard deviation of team ratings
    const stdRating = standardDeviation(ratings);

    // get z scores and p values for each team
    for (const team of this.powerRankingsService.powerRankings) {
      const teamZ = zScore(this.sleeperService.selectedLeague.isSuperflex
        ? team.sfTradeValueStarter : team.tradeValueStarter, meanRating, stdRating);
      const teamP = cumulativeStdNormalProbability(teamZ);
      this.teamRatingsPValues[team.team.roster.rosterId] = teamP;
    }
    // generate mean value score and save it to position 0 of dict
    this.generateMedianProbabilities(meanRating, stdRating);
    this.generateMatchUpsWithProb();
    this.getProjectedRecord(week);
    this.generatePlayoffOdds(week);
  }

  /**
   * generates probabilities for matchups and stores matchup object with it
   * @private
   */
  private generateMatchUpsWithProb(): void {
    this.matchUpsWithProb = [];
    this.matchUpService.leagueMatchUpUI.map(weekMatchups => {
      const games: MatchUpProbability[] = [];
      weekMatchups.map(matchup => {
        matchup.selectedWinner = 0;
        matchup.selectedTeam1MedianWin = 0;
        matchup.selectedTeam2MedianWin = 0;
        games.push(this.getProbabilityForGame(matchup));
      });
      this.matchUpsWithProb.push(games);
    });
  }

  /**
   * get probability for each match up
   * @param matchup array of arrays of match up prob
   */
  private getProbabilityForGame(matchup: MatchUpUI): MatchUpProbability {
    const team1Prob = 0.5 + (this.teamRatingsPValues[matchup.team1RosterId] - this.teamRatingsPValues[matchup.team2RosterId]) / 2;
    const team2Prob = 0.5 + (this.teamRatingsPValues[matchup.team2RosterId] - this.teamRatingsPValues[matchup.team1RosterId]) / 2;
    return new MatchUpProbability(
      matchup,
      this.getPercent(team1Prob),
      this.getPercent(team2Prob)
    );
  }

  /**
   * calculates projected record based on points
   */
  private getProjectedRecord(startWeek: number = this.getStartWeek()): void {
    for (let rosterId = 1; rosterId <= this.sleeperService.selectedLeague.totalRosters; rosterId++) {
      let totalWins = 0;
      let projectedWeeks = 0;
      let selectedWins = 0;
      let selectedLosses = 0;
      let totalMedianWins = 0;
      let selectedMedianWins = 0;
      let selectedMedianLosses = 0;
      for (let week = startWeek - this.sleeperService.selectedLeague.startWeek;
           week < this.sleeperService.selectedLeague.playoffStartWeek - this.sleeperService.selectedLeague.startWeek; week++) {
        projectedWeeks++;
        this.matchUpsWithProb[week]?.map(matchUp => {
          if (matchUp.matchUpDetails.team1RosterId === rosterId) {
            if (matchUp.matchUpDetails.selectedWinner === 0) {
              totalWins += matchUp.team1Prob;
              if (this.sleeperService.selectedLeague.medianWins) {
                totalMedianWins += this.medianWinProbability[rosterId].meanProb;
              }
            } else if (matchUp.matchUpDetails.selectedWinner === 1) {
              selectedWins++;
              projectedWeeks--;
              if (this.sleeperService.selectedLeague.medianWins) {
                matchUp.matchUpDetails.selectedTeam1MedianWin === 1
                  ? selectedMedianWins++ : selectedMedianLosses++;
              }
            } else if (matchUp.matchUpDetails.selectedWinner === 2) {
              selectedLosses++;
              projectedWeeks--;
              if (this.sleeperService.selectedLeague.medianWins) {
                matchUp.matchUpDetails.selectedTeam1MedianWin === 1
                  ? selectedMedianWins++ : selectedMedianLosses++;
              }
            }
            return;
          } else if (matchUp.matchUpDetails.team2RosterId === rosterId) {
            if (matchUp.matchUpDetails.selectedWinner === 0) {
              totalWins += matchUp.team2Prob;
              if (this.sleeperService.selectedLeague.medianWins) {
                totalMedianWins += this.medianWinProbability[rosterId].meanProb;
              }
            } else if (matchUp.matchUpDetails.selectedWinner === 2) {
              selectedWins++;
              projectedWeeks--;
              if (this.sleeperService.selectedLeague.medianWins) {
                matchUp.matchUpDetails.selectedTeam2MedianWin === 1
                  ? selectedMedianWins++ : selectedMedianLosses++;
              }
            } else if (matchUp.matchUpDetails.selectedWinner === 1) {
              selectedLosses++;
              projectedWeeks--;
              if (this.sleeperService.selectedLeague.medianWins) {
                matchUp.matchUpDetails.selectedTeam2MedianWin === 1
                  ? selectedMedianWins++ : selectedMedianLosses++;
              }
            }
            return;
          }
        });
      }
      const winsAtDate = this.getWinsAtWeek(rosterId, startWeek - 1);
      const lossesAtDate = this.getLossesAtWeek(rosterId, startWeek - 1);
      this.selectedGameResults[rosterId] = {
        selectedWins,
        selectedLosses,
        selectedMedianWins,
        selectedMedianLosses,
      };
      // if median league than double the amount of projected games to take into account
      // if (this.sleeperService.selectedLeague.medianWins) { projectedWeeks *= 2; }
      this.teamsProjectedRecord[rosterId] = {
        projWins: winsAtDate.wins + selectedWins + Math.round(totalWins / 100),
        projLoss: lossesAtDate.losses + selectedLosses + projectedWeeks - Math.round(totalWins / 100),
        medianWins: winsAtDate.medianWins + selectedMedianWins + Math.round(totalMedianWins / 100),
        medianLoss: lossesAtDate.medianLosses + selectedMedianLosses + projectedWeeks - Math.round(totalMedianWins / 100)
      };
    }
  }

  /**
   * get number of wins at a current week in the past
   * TODO maybe move to separate service?
   * @param rosterId
   * @param endWeek
   */
  getWinsAtWeek(rosterId: number, endWeek: number): { totalWins: number, wins: number, medianWins: number } {
    let wins = 0;
    let medianWins = 0;
    for (let i = 0; i <= endWeek - this.sleeperService.selectedLeague.startWeek; i++) {
      const medianValue = this.sleeperService.selectedLeague.medianWins ? this.getMedianPointsForWeek(this.matchUpsWithProb[i]) : 0;
      this.matchUpsWithProb[i]?.map(matchUp => {
        if (matchUp.matchUpDetails.team1RosterId === rosterId) {
          if (matchUp.matchUpDetails.team1Points > matchUp.matchUpDetails.team2Points) {
            wins++;
          }
          if (this.sleeperService.selectedLeague.medianWins && matchUp.matchUpDetails.team1Points >= medianValue) {
            medianWins++;
          }
        } else if (matchUp.matchUpDetails.team2RosterId === rosterId) {
          if (matchUp.matchUpDetails.team2Points > matchUp.matchUpDetails.team1Points) {
            wins++;
          }
          if (this.sleeperService.selectedLeague.medianWins && matchUp.matchUpDetails.team2Points >= medianValue) {
            medianWins++;
          }
        }
      });
    }
    return {totalWins: wins + medianWins, wins, medianWins};
  }

  /**
   * get number of losses at a current week in the past
   * TODO maybe move to separate service?
   * @param rosterId
   * @param endWeek
   */
  getLossesAtWeek(rosterId: number, endWeek: number): { totalLosses: number, losses: number, medianLosses: number } {
    let losses = 0;
    let medianLosses = 0;
    for (let i = 0; i <= endWeek - this.sleeperService.selectedLeague.startWeek; i++) {
      const medianValue = this.sleeperService.selectedLeague.medianWins ? this.getMedianPointsForWeek(this.matchUpsWithProb[i]) : 0;
      this.matchUpsWithProb[i]?.map(matchUp => {
        if (matchUp.matchUpDetails.team1RosterId === rosterId) {
          if (matchUp.matchUpDetails.team1Points < matchUp.matchUpDetails.team2Points) {
            losses++;
          }
          if (this.sleeperService.selectedLeague.medianWins && matchUp.matchUpDetails.team1Points < medianValue) {
            medianLosses++;
          }
        } else if (matchUp.matchUpDetails.team2RosterId === rosterId) {
          if (matchUp.matchUpDetails.team2Points < matchUp.matchUpDetails.team1Points) {
            losses++;
          }
          if (this.sleeperService.selectedLeague.medianWins && matchUp.matchUpDetails.team2Points < medianValue) {
            medianLosses++;
          }
        }
      });
    }
    return {totalLosses: losses + medianLosses, losses, medianLosses};
  }

  /**
   * return number as a rounded percent
   * @param num
   * @private
   */
  private getPercent(num: number): number {
    return Math.round(num * 100);
  }

  /**
   * generate league divisions
   * TODO create standings service for this since it doesn't relate
   * @param league league data
   * @param teams fantasy teams
   */
  generateDivisions(league: SleeperLeagueData, teams: SleeperTeam[]): Observable<any> {
    if (this.divisions?.length === 0) {
      if (league.divisions && league.divisions > 1) {
        for (let i = 0; i < league.divisions; i++) {
          const divisionTeams: SleeperTeam[] = [];
          for (const team of teams) {
            if (team.roster.teamMetrics.division === i + 1) {
              divisionTeams.push(team);
            }
          }
          divisionTeams.sort((a, b) => {
            return a.roster.teamMetrics.rank - b.roster.teamMetrics.rank || b.roster.teamMetrics.wins - a.roster.teamMetrics.wins
              || b.roster.teamMetrics.fpts - a.roster.teamMetrics.fpts;
          });
          this.divisions.push(new Division(i + 1, divisionTeams));
        }
      } else {
        const allTeams = teams.slice();
        allTeams.sort((a, b) => {
          return a.roster.teamMetrics.rank - b.roster.teamMetrics.rank || b.roster.teamMetrics.wins - a.roster.teamMetrics.wins
            || b.roster.teamMetrics.fpts - a.roster.teamMetrics.fpts;
        });
        if (allTeams[0].roster.teamMetrics.rank === 0) {
          for (let i = 0; i < allTeams.length; i++) {
            allTeams[i].roster.teamMetrics.rank = i + 1;
          }
        }
        this.divisions.push(new Division(1, allTeams));
        league.divisions = 1;
      }
    }
    return of(this.divisions);
  }

  /**
   * resets division data
   */
  reset(): void {
    this.divisions = [];
    this.matchUpsWithProb = [];
    this.teamPlayoffOdds = {};
    this.teamsProjectedRecord = {};
    this.teamRatingsPValues = {};
    this.selectedGameResults = {};
    this.medianWinProbability = {};
    this.forceShowRecord = false;
  }

  /**
   * update season odds handler may remove later if unnecessary
   * @param value
   */
  updateSeasonOdds(selectedWeek?: number): void {
    this.getProjectedRecord(selectedWeek);
    this.generatePlayoffOdds(selectedWeek);
  }

  /**
   * get Division by Roster id
   * @param rosterId
   */
  getDivisionByRosterId(rosterId: number): Division {
    for (const division of this.divisions) {
      for (const team of division.teams) {
        if (team.roster.rosterId === rosterId) {
          return division;
        }
      }
    }
    return null;
  }

  /**
   * simulate regular season from week
   * @param startWeek week number to start simulation from
   * @private
   */
  private simulateRegularSeason(startWeek: number): SimulatedTeamInfo[] {
    const wins = [];
    // simulate regular season
    for (let rosterId = 1; rosterId <= this.sleeperService.selectedLeague.totalRosters; rosterId++) {
      let totalWins = 0;
      for (let week = startWeek; week < this.sleeperService.selectedLeague.playoffStartWeek; week++) {
        this.matchUpsWithProb[week - this.sleeperService.selectedLeague.startWeek]?.map(matchUp => {
          if (matchUp.matchUpDetails.team1RosterId === rosterId) {
            // check if game was manually selected
            if (matchUp.matchUpDetails.selectedWinner === 0) {
              // randomly select winner
              if (this.getRandomInt(100) < matchUp.team1Prob) {
                totalWins++;
              }
              if (this.sleeperService.selectedLeague.medianWins && this.getRandomInt(100) < this.medianWinProbability[rosterId].meanProb) {
                totalWins++;
              }
            } else if (matchUp.matchUpDetails.selectedWinner !== 0) {
              if (matchUp.matchUpDetails.selectedWinner === 1) {
                totalWins++;
              }
              if (matchUp.matchUpDetails.selectedTeam1MedianWin === 1) {
                totalWins++;
              }
            }
            return;
          } else if (matchUp.matchUpDetails.team2RosterId === rosterId) {
            // check if game was manually selected
            if (matchUp.matchUpDetails.selectedWinner === 0) {
              // randomly generate winner based on prob
              if (this.getRandomInt(100) < matchUp.team2Prob) {
                totalWins++;
              }
              if (this.sleeperService.selectedLeague.medianWins && this.getRandomInt(100) < this.medianWinProbability[rosterId].meanProb) {
                totalWins++;
              }
            } else if (matchUp.matchUpDetails.selectedWinner !== 0) {
              if (matchUp.matchUpDetails.selectedWinner === 2) {
                totalWins++;
              }
              if (matchUp.matchUpDetails.selectedTeam2MedianWin === 1) {
                totalWins++;
              }
            }
            return;
          }
        });
      }
      wins.push({
        team: this.sleeperService.getTeamByRosterId(rosterId),
        projWins: this.teamPlayoffOdds[rosterId].winsAtStartDate.totalWins + totalWins
      });
      if (totalWins >= (this.sleeperService.selectedLeague.playoffStartWeek - startWeek)
        * (this.sleeperService.selectedLeague.medianWins ? 2 : 1)
      ) {
        this.teamPlayoffOdds[rosterId].timesTeamWonOut += 1;
      }
    }
    return wins;
  }

  /**
   * simulate division winners by record
   * @param wins array of simulated record
   * @param numOfByeWeeks number if byes spots
   * @private
   */
  private simulateDivisionWinners(wins: SimulatedTeamInfo[], numOfByeWeeks: number): SimulatedTeamInfo[] {
    // division winners to filter out if applicable
    const divisionWinners = [];

    this.divisions.map(division => {
      let divWinnerTeam = null;
      let numOfwins = 0;
      division.teams.map(team => {
        for (const teamWins of wins) {
          if (divWinnerTeam) {
            if (numOfwins < teamWins.projWins && teamWins.team.roster.rosterId === team.roster.rosterId) {
              divWinnerTeam = teamWins;
              numOfwins = teamWins.projWins;
              break;
            } else if (numOfwins === teamWins.projWins && teamWins.team.roster.rosterId === team.roster.rosterId
              && divWinnerTeam.team.roster.rosterId !== teamWins.team.roster.rosterId) {
              divWinnerTeam = this.calculateTieBreaker([divWinnerTeam, teamWins]);
            }
          } else {
            if (team.roster.rosterId === teamWins.team.roster.rosterId) {
              divWinnerTeam = teamWins;
              numOfwins = teamWins.projWins;
              break;
            }
          }
        }
      });
      divisionWinners.push(divWinnerTeam);
      this.teamPlayoffOdds[divWinnerTeam?.team.roster.rosterId].timesMakingPlayoffs =
        (this.teamPlayoffOdds[divWinnerTeam?.team.roster.rosterId]?.timesMakingPlayoffs) + 1;
      this.teamPlayoffOdds[divWinnerTeam?.team.roster.rosterId].timesWinningDivision =
        (this.teamPlayoffOdds[divWinnerTeam?.team.roster.rosterId]?.timesWinningDivision) + 1;
    });

    // assign bye weeks TODO what if byes are greater than division winners?
    const byeWeekTeams = [];
    for (let i = 0; i < numOfByeWeeks; i++) {
      // get unique bye week team
      const byeWeekTeam = this.determineBestTeamFromArray(divisionWinners, byeWeekTeams);
      this.teamPlayoffOdds[byeWeekTeam.team.roster.rosterId].timesWithBye =
        (this.teamPlayoffOdds[byeWeekTeam.team.roster.rosterId]?.timesWithBye || 0) + 1;
      byeWeekTeams.push(byeWeekTeam);
    }

    return divisionWinners;
  }

  /**
   * simulate round of playoff and returns advanced teams
   * @param playoffTeams array of teams
   * @private
   */
  private simulateRoundOfPlayoffs(playoffTeams: SimulatedTeamInfo[]): SimulatedTeamInfo[] {
    // is the format 2 games or 1 game per round
    const gamesPerRound = this.sleeperService.selectedLeague.playoffRoundType === 2 ? 2 : 1;
    // initialize array of advancing teams
    const advancingTeams: SimulatedTeamInfo[] = [];
    for (let i = 0; i < playoffTeams.length / 2; i++) {
      // get two teams facing off
      const team1 = playoffTeams[i];
      const team2 = playoffTeams[playoffTeams.length - 1 - i];

      // get prob team 1 wins
      const team1WinsOdds = Math.round((0.5 + (this.teamRatingsPValues[team1.team.roster.rosterId]
        - this.teamRatingsPValues[team2.team.roster.rosterId]) / 2) * 100);

      // handles 1 game per round format
      if (gamesPerRound === 1) {
        if (this.getRandomInt(100) < team1WinsOdds) {
          advancingTeams.push(team1);
        } else {
          advancingTeams.push(team2);
        }
      } else {
        // handles 2 games per round playoff format
        let team1Wins = 0;
        let team2Wins = 0;
        for (let round = 0; round < gamesPerRound; round++) {
          if (this.getRandomInt(100) < team1WinsOdds) {
            team1Wins++;
          } else {
            team2Wins++;
          }
        }
        if (team1Wins === team2Wins) {
          if (this.getRandomInt(100) < team1WinsOdds) {
            advancingTeams.push(team1);
          } else {
            advancingTeams.push(team2);
          }
        } else if (team1Wins === gamesPerRound) {
          advancingTeams.push(team1);
        } else {
          advancingTeams.push(team2);
        }
      }
    }
    return advancingTeams;
  }

  /**
   * handles add/removing teams from teams left
   * @param teamsLeft current array
   * @param matchup matchup to process
   * @private
   */
  private processTeamsLeft(teamsLeft: number[], matchup: SleeperPlayoffMatchUp): number[] {
    if (matchup.win === null && matchup.loss === null) {
      return teamsLeft;
    }
    if (matchup.win === matchup.team1) {
      if (!teamsLeft.includes(matchup.team1)) {
        teamsLeft.push(matchup.team1);
      }
      if (teamsLeft.includes(matchup.team2)) {
        teamsLeft.splice(teamsLeft.indexOf(matchup.team2), 1);
      }
    } else {
      if (!teamsLeft.includes(matchup.team2)) {
        teamsLeft.push(matchup.team2);
      }
      if (teamsLeft.includes(matchup.team1)) {
        teamsLeft.splice(teamsLeft.indexOf(matchup.team1), 1);
      }
    }
    return teamsLeft;
  }

  /**
   * update playoff odds for week in the playoffs
   * @param startWeek
   */
  private updatePlayoffOdds(startWeek): void {
    // teams that haven't lost yet
    const teamsLeft = [];

    // eliminated teams used to check with matchup is winners bracket
    const teamsEliminated = [];

    // currently selected round of the playoffs
    const weekDiff = startWeek - this.sleeperService.selectedLeague.playoffStartWeek + 1;

    // teams that have a bye for the simulation
    const byeWeekTeams = [];

    // how many games per selected rd for array length
    let gamesThisRd = 0;

    // calculate current state of playoffs
    this.sleeperService.playoffMatchUps.map((matchup) => {
      if (matchup.round === weekDiff && (!teamsEliminated.includes(matchup.team1) || !teamsEliminated.includes(matchup.team2))) {
        gamesThisRd++;
      }
      if (matchup.round <= weekDiff) {
        if (matchup.round === 1) {
          teamsLeft.push(matchup.win);
          teamsEliminated.push(matchup.loss);
          this.teamPlayoffOdds[matchup.team1].timesMakingPlayoffs = this.NUMBER_OF_SIMULATIONS;
          this.teamPlayoffOdds[matchup.team2].timesMakingPlayoffs = this.NUMBER_OF_SIMULATIONS;
        } else if (matchup.round === 2 && (teamsLeft.includes(matchup.team1) || teamsLeft.includes(matchup.team2))) {
          this.processTeamsLeft(teamsLeft, matchup);
          teamsEliminated.push(matchup.loss);
          this.teamPlayoffOdds[matchup.team1].timesMakingPlayoffs = this.NUMBER_OF_SIMULATIONS;
          this.teamPlayoffOdds[matchup.team2].timesMakingPlayoffs = this.NUMBER_OF_SIMULATIONS;
          this.teamPlayoffOdds[matchup.team1].timesMakeConfRd = this.NUMBER_OF_SIMULATIONS;
          this.teamPlayoffOdds[matchup.team2].timesMakeConfRd = this.NUMBER_OF_SIMULATIONS;
        } else if (matchup.round === 3 && (teamsLeft.includes(matchup.team1) || teamsLeft.includes(matchup.team2))) {
          this.processTeamsLeft(teamsLeft, matchup);
          if (matchup.loss) {
            teamsEliminated.push(matchup.loss);
          }
          this.teamPlayoffOdds[matchup.team1].timesMakeChampionship = this.NUMBER_OF_SIMULATIONS;
          this.teamPlayoffOdds[matchup.team2].timesMakeChampionship = this.NUMBER_OF_SIMULATIONS;
          if (weekDiff > 3 && matchup.loss !== null) {
            if (!teamsEliminated.includes(matchup.team1)) {
              this.teamPlayoffOdds[matchup.team1].timesWinChampionship = this.NUMBER_OF_SIMULATIONS;
            } else {
              this.teamPlayoffOdds[matchup.team2].timesWinChampionship = this.NUMBER_OF_SIMULATIONS;
            }
          }
        }
      }
      if (weekDiff === 1 && matchup.round === 2) {
        if (!teamsLeft.includes(matchup.team1) && !teamsEliminated.includes(matchup.team1)) {
          teamsLeft.push(matchup.team1);
          byeWeekTeams.push({team: this.sleeperService.getTeamByRosterId(matchup.team1), projWins: 0});
          this.teamPlayoffOdds[matchup.team1].timesMakingPlayoffs = this.NUMBER_OF_SIMULATIONS;
          this.teamPlayoffOdds[matchup.team1].timesMakeConfRd = this.NUMBER_OF_SIMULATIONS;
        }
        if (!teamsLeft.includes(matchup.team2) && !teamsEliminated.includes(matchup.team2)) {
          teamsLeft.push(matchup.team2);
          byeWeekTeams.push({team: this.sleeperService.getTeamByRosterId(matchup.team2), projWins: 0});
          this.teamPlayoffOdds[matchup.team2].timesMakingPlayoffs = this.NUMBER_OF_SIMULATIONS;
          this.teamPlayoffOdds[matchup.team2].timesMakeConfRd = this.NUMBER_OF_SIMULATIONS;
        }
      }
    });

    let simulatedTeamRd: SimulatedTeamInfo[] = Array(gamesThisRd * 2).fill(null);

    let gameCount = 0;
    this.sleeperService.playoffMatchUps.map((matchUp) => {
      if (matchUp.round === weekDiff && (!teamsEliminated.includes(matchUp.team1) || !teamsEliminated.includes(matchUp.team2))) {
        simulatedTeamRd[gameCount] = {team: this.sleeperService.getTeamByRosterId(matchUp.team1), projWins: 0};
        simulatedTeamRd[simulatedTeamRd.length - 1 - gameCount] = {
          team: this.sleeperService.getTeamByRosterId(matchUp.team2),
          projWins: 0
        };
        gameCount++;
        if (gameCount === gamesThisRd) {
          return;
        }
      }
    });
    if (weekDiff <= 1) {
      simulatedTeamRd = this.simulateRoundOfPlayoffs(simulatedTeamRd);
      // assign wins for conference
      for (const team of simulatedTeamRd) {
        this.teamPlayoffOdds[team.team.roster.rosterId].timesMakeConfRd =
          (this.teamPlayoffOdds[team.team.roster.rosterId]?.timesMakeConfRd || 0) + 1;
      }
      simulatedTeamRd = byeWeekTeams.concat(simulatedTeamRd);
    }
    if (weekDiff <= 2) {
      simulatedTeamRd = this.simulateRoundOfPlayoffs(simulatedTeamRd);
      // assign wins for conference
      for (const team of simulatedTeamRd) {
        this.teamPlayoffOdds[team.team.roster.rosterId].timesMakeChampionship =
          (this.teamPlayoffOdds[team.team.roster.rosterId]?.timesMakeChampionship || 0) + 1;
      }
    }
    if (weekDiff <= 3) {
      simulatedTeamRd = this.simulateRoundOfPlayoffs(simulatedTeamRd);
      // assign wins for conference
      for (const team of simulatedTeamRd) {
        this.teamPlayoffOdds[team.team.roster.rosterId].timesWinChampionship =
          (this.teamPlayoffOdds[team.team.roster.rosterId]?.timesWinChampionship || 0) + 1;
      }
    }
  }

  /**
   * simulate playoffs during the regular season
   * @param playoffTeams teams in playoff
   * @param numOfBye number of byes
   * @private
   */
  private simulatePlayoffs(playoffTeams: SimulatedTeamInfo[], numOfBye: number): void {

    // remove teams with byes
    const divRdTeams = playoffTeams.slice(numOfBye);

    // simulate round and back bye week teams
    const confRdTeams = playoffTeams.slice(0, numOfBye).concat(this.simulateRoundOfPlayoffs(divRdTeams));

    // assign wins for conference
    for (const team of confRdTeams) {
      this.teamPlayoffOdds[team.team.roster.rosterId].timesMakeConfRd =
        (this.teamPlayoffOdds[team.team.roster.rosterId]?.timesMakeConfRd || 0) + 1;
    }

    // simulate championship teams
    const championshipTeams = this.simulateRoundOfPlayoffs(confRdTeams);

    // assign championships to teams
    for (const team of championshipTeams) {
      this.teamPlayoffOdds[team.team.roster.rosterId].timesMakeChampionship =
        (this.teamPlayoffOdds[team.team.roster.rosterId]?.timesMakeChampionship || 0) + 1;
    }

    // simulate championship game
    const winChampionship = this.simulateRoundOfPlayoffs(championshipTeams);

    // assign championship
    for (const team of winChampionship) {
      this.teamPlayoffOdds[team.team.roster.rosterId].timesWinChampionship =
        (this.teamPlayoffOdds[team.team.roster.rosterId]?.timesWinChampionship || 0) + 1;
    }
  }

  /**
   * handles simulating one whole season including playoffs
   * @param startWeek
   */
  simulateOneSeason(startWeek: number = this.getStartWeek()): void {

    // get simulated regular season wins per team
    const simulatedWins: SimulatedTeamInfo[] = this.simulateRegularSeason(startWeek);

    // determine worst record and update odds
    this.determineWorstRecordTeam(simulatedWins);

    // determine best record and update odds
    const bestTeam = this.determineBestTeamFromArray(simulatedWins, []);
    this.teamPlayoffOdds[bestTeam.team.roster.rosterId].timesWithBestRecord += 1;

    // determine number of bye weeks
    const numOfByeWeeks = this.sleeperService.selectedLeague.playoffTeams % 4;

    // number of spots available
    let numOfPlayoffSpotsLeft = this.sleeperService.selectedLeague.playoffTeams;

    // division winners array
    let nonWildCardTeams: SimulatedTeamInfo[] = [];

    let simulatedPlayoffTeams: SimulatedTeamInfo[] = [];

    // if divisions calculate winner
    // determine division winner and bye
    if (this.divisions.length > 1) {
      // get array of division winners
      nonWildCardTeams = this.simulateDivisionWinners(simulatedWins, numOfByeWeeks);
      // subtract division winners to determine how many more wildcard spots there are
      numOfPlayoffSpotsLeft -= this.divisions.length;
    } else {
      // get byes for best teams since there is no divisions
      for (let i = 0; i < numOfByeWeeks; i++) {
        const byeWeekTeam = this.determineBestTeamFromArray(simulatedWins, nonWildCardTeams);
        this.teamPlayoffOdds[byeWeekTeam.team.roster.rosterId].timesWithBye =
          (this.teamPlayoffOdds[byeWeekTeam.team.roster.rosterId]?.timesWithBye || 0) + 1;
        this.teamPlayoffOdds[byeWeekTeam.team.roster.rosterId].timesMakingPlayoffs =
          (this.teamPlayoffOdds[byeWeekTeam.team.roster.rosterId]?.timesMakingPlayoffs || 0) + 1;
        nonWildCardTeams.push(byeWeekTeam);
      }
      numOfPlayoffSpotsLeft -= numOfByeWeeks;
    }

    // assign the last playoff spots
    for (let selectedTeamCount = 0; selectedTeamCount < numOfPlayoffSpotsLeft; selectedTeamCount++) {
      const wildcardTeam = this.determineBestTeamFromArray(simulatedWins, nonWildCardTeams.concat(simulatedPlayoffTeams));
      this.teamPlayoffOdds[wildcardTeam.team.roster.rosterId].timesMakingPlayoffs =
        (this.teamPlayoffOdds[wildcardTeam.team.roster.rosterId]?.timesMakingPlayoffs || 0) + 1;
      simulatedPlayoffTeams.push(wildcardTeam);
    }
    simulatedPlayoffTeams = nonWildCardTeams.concat(simulatedPlayoffTeams);
    // simulate playoffs
    this.simulatePlayoffs(simulatedPlayoffTeams, numOfByeWeeks);
  }

  /**
   * determines unique playoff team from array
   * @param simulatedTeams all teams to choose from
   * @param excludedTeams teams not to be selected (usually teams that already qualified before)
   * @private
   */
  private determineBestTeamFromArray(simulatedTeams: SimulatedTeamInfo[], excludedTeams: SimulatedTeamInfo[]): SimulatedTeamInfo {
    let selectedTeam = null;
    let maxWinTotal = 0;
    for (const simulatedTeam of simulatedTeams) {
      if (!excludedTeams.includes(simulatedTeam)) {
        if (!selectedTeam || simulatedTeam.projWins > maxWinTotal) {
          selectedTeam = simulatedTeam;
          maxWinTotal = simulatedTeam.projWins;
        } else if (simulatedTeam.projWins === maxWinTotal) {
          selectedTeam = this.calculateTieBreaker([selectedTeam, simulatedTeam]);
        }
      }
    }
    return selectedTeam;
  }

  /**
   * calculates tie break scenario by simulating a match between the two teams
   * @param tiedTeams 2 tied teams
   * @private
   */
  private calculateTieBreaker(tiedTeams: SimulatedTeamInfo[]): SimulatedTeamInfo {
    const team1Prob = this.getPercent(0.5 + (this.teamRatingsPValues[tiedTeams[0].team.roster.rosterId]
      - this.teamRatingsPValues[tiedTeams[1].team.roster.rosterId]) / 2);
    if (this.getRandomInt(100) < team1Prob) {
      return tiedTeams[0];
    }
    return tiedTeams[1];
  }

  /**
   * generate playoffs odds
   * simulate 10000 seasons
   * @param startWeek
   */
  private generatePlayoffOdds(startWeek: number = this.getStartWeek()): void {
    // initialize odds values
    for (const team of this.sleeperService.sleeperTeamDetails) {
      this.teamPlayoffOdds[team.roster.rosterId] = {
        timesMakingPlayoffs: 0,
        timesWinningDivision: 0,
        timesWithBye: 0,
        timesMakeConfRd: 0,
        timesMakeChampionship: 0,
        timesWinChampionship: 0,
        timesTeamWonOut: 0,
        timesWithWorstRecord: 0,
        timesWithBestRecord: 0,
        winsAtStartDate: this.getWinsAtWeek(team.roster.rosterId, startWeek - 1)
      };
    }

    for (let i = 0; i < this.NUMBER_OF_SIMULATIONS; i++) {
      if (startWeek >= this.sleeperService.selectedLeague.playoffStartWeek) {
        this.updatePlayoffOdds(startWeek);
      } else {
        this.simulateOneSeason(startWeek);
      }
    }

    // divisor for percent calculations
    const divisor = (this.NUMBER_OF_SIMULATIONS / 100);

    for (const team of this.sleeperService.sleeperTeamDetails) {
      this.teamPlayoffOdds[team.roster.rosterId] = {
        timesMakingPlayoffs: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesMakingPlayoffs / divisor),
        timesWinningDivision: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesWinningDivision / divisor),
        timesWithBye: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesWithBye / divisor),
        timesMakeConfRd: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesMakeConfRd / divisor),
        timesMakeChampionship: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesMakeChampionship / divisor),
        timesWinChampionship: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesWinChampionship / divisor),
        timesTeamWonOut: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesTeamWonOut / divisor),
        timesWithWorstRecord: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesWithWorstRecord / divisor),
        timesWithBestRecord: Math.round(this.teamPlayoffOdds[team.roster.rosterId].timesWithBestRecord / divisor),
      };
    }
    // console.table(this.teamPlayoffOdds);
  }

  /**
   * get random number
   * TODO create numbers service?
   */
  private getRandomInt(max): number {
    return Math.floor(Math.random() * max);
  }

  /**
   * handles if start week is null
   * TODO check when new weeks are processed
   * @private
   */
  public getStartWeek(): number {
    if (
      this.nflService.stateOfNFL.season === this.sleeperService.selectedLeague.season
      && this.nflService.stateOfNFL.seasonType !== 'post'
    ) {
      return this.nflService.stateOfNFL.completedWeek + 1;
    }
    return Number(this.sleeperService.selectedLeague.season) < 2021 ? 17 : 18;
  }

  /**
   * get median value for week
   * @param matchUpsWithProbElement
   * @private
   */
  private getMedianPointsForWeek(matchUpsWithProbElement: MatchUpProbability[]): number {
    const teamPoints = [];
    matchUpsWithProbElement?.map(matchUp => {
      teamPoints.push(matchUp.matchUpDetails.team1Points);
      teamPoints.push(matchUp.matchUpDetails.team2Points);
    });
    teamPoints.sort((a, b) => {
      return a - b;
    });
    const totalPoints = [teamPoints[this.sleeperService.selectedLeague.totalRosters / 2 - 1],
      teamPoints[this.sleeperService.selectedLeague.totalRosters / 2]];
    return median(totalPoints);
  }

  /**
   * generate odds for a team to beat the median
   * @param meanRating
   * @param stdRating
   * @private
   */
  private generateMedianProbabilities(meanRating: any, stdRating: any): void {
    // sort array based on starter value to find the middle two
    const rankings = this.powerRankingsService.powerRankings.slice();
    rankings.sort((a, b) => {
      return this.sleeperService.selectedLeague.isSuperflex ? a.sfTradeValueStarter - b.sfTradeValueStarter
        : a.tradeValueStarter - b.tradeValueStarter;
    });

    // get median of middle two teams value wise
    const medianStarterValue = median(this.sleeperService.selectedLeague.isSuperflex ?
      [rankings[rankings.length / 2 - 1].sfTradeValueStarter, rankings[rankings.length / 2].sfTradeValueStarter]
      : [rankings[rankings.length / 2 - 1].tradeValueStarter, rankings[rankings.length / 2].tradeValueStarter]);

    // add median probability to pValues at pos 0
    const medianZ = zScore(medianStarterValue, meanRating, stdRating);
    const medianP = cumulativeStdNormalProbability(medianZ);
    this.teamRatingsPValues[0] = medianP;

    // generate odds to beat the mean
    for (const team of this.powerRankingsService.powerRankings) {
      this.medianWinProbability[team.team.roster.rosterId] = {
        meanProb: this.getPercent(0.5 + (this.teamRatingsPValues[team.team.roster.rosterId] - this.teamRatingsPValues[0]) / 2)
      };
    }
  }

  /**
   * calculate the league medians for each week
   */
  calculateLeagueMedians(): void {
    if (this.matchUpsWithProb.length === 0) {
      this.generateMatchUpsWithProb();
    }
    const endWeek = this.sleeperService.selectedLeague.season === this.nflService.stateOfNFL.season
      && this.nflService.stateOfNFL.seasonType !== 'post' ?
        this.nflService.stateOfNFL.completedWeek - this.sleeperService.selectedLeague.startWeek
        : (Number(this.sleeperService.selectedLeague.season) < 2021 ? 17 : 18);
    for (let i = 0; i <= endWeek; i++) {
      this.matchUpService.leagueMedians.push(this.getMedianPointsForWeek(this.matchUpsWithProb[i]));
    }
  }

  /**
   * calculate the worst record team from simulated teams
   * @param simulatedWins
   * @private
   */
  private determineWorstRecordTeam(simulatedWins: SimulatedTeamInfo[]): void {
    let selectedTeam = null;
    let minWinTotal = this.sleeperService.selectedLeague.playoffStartWeek;
    for (const simulatedTeam of simulatedWins) {
      if (!selectedTeam || simulatedTeam.projWins < minWinTotal) {
        selectedTeam = simulatedTeam;
        minWinTotal = simulatedTeam.projWins;
      } else if (simulatedTeam.projWins === minWinTotal) {
        const winner = this.calculateTieBreaker([selectedTeam, simulatedTeam]);
        if (winner.team.roster.rosterId === selectedTeam.team.roster.rosterId) {
          selectedTeam = simulatedTeam;
        }
      }
    }
    this.teamPlayoffOdds[selectedTeam.team.roster.rosterId].timesWithWorstRecord += 1;
  }
}
