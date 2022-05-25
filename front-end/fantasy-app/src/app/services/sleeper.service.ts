import {Injectable} from '@angular/core';
import {CompletedDraft, DraftCapital, SleeperData, SleeperLeagueData, SleeperUserData} from '../model/SleeperUser';
import {SleeperApiService} from './api/sleeper/sleeper-api.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {
  SleeperOwnerData, SleeperPlayoffMatchUp, SleeperRawDraftOrderData, SleeperRawTradePicksData,
  SleeperRosterData, SleeperTeam, SleeperTeamMatchUpData, SleeperTeamTransactionData, TeamMetrics
} from '../model/SleeperLeague';
import {forkJoin, Observable, of} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SleeperService {

  /** sleeper user data */
  sleeperUser: SleeperData;

  /** selected league data */
  selectedLeague: SleeperLeagueData;

  /** selected year */
  selectedYear: string;

  /** is league loaded */
  leagueLoaded: boolean = false;

  /** selected league team data */
  sleeperTeamDetails: SleeperTeam[];

  /** upcoming draft data */
  upcomingDrafts: SleeperRawDraftOrderData[] = [];

  /** completed draft data */
  completedDrafts: CompletedDraft[] = [];

  /** dict of sleeper player ids */
  sleeperPlayers = {};

  playoffMatchUps: SleeperPlayoffMatchUp[] = [];

  constructor(private sleeperApiService: SleeperApiService, private spinner: NgxSpinnerService) {
  }

  /**
   * loads team data, roster, and draft picks by league
   * @param selectedLeague selected league
   */
  $loadNewLeague(selectedLeague: SleeperLeagueData): Observable<any> {
    this.leagueLoaded = false;
    this.selectedLeague = selectedLeague;
    if (this.selectedLeague.rosterPositions.filter(x => x === 'QB').length > 1) {
      this.selectedLeague.isSuperflex = true;
    }
    return this.sleeperApiService.getSleeperOwnersbyLeagueId(selectedLeague.leagueId).pipe(mergeMap((owners: SleeperOwnerData[]) => {
        // fetch matchUps for league
        const leagueMatchups = {};
        const leagueTransactions = {};
        const observe = [];
        for (let weekNum = selectedLeague.startWeek; weekNum < 19; weekNum++) {
          observe.push(this.sleeperApiService.getSleeperMatchUpsForWeekByLeagueId(selectedLeague.leagueId, weekNum)
            .pipe(mergeMap((weekMatchups) => {
              const matchupData: SleeperTeamMatchUpData[] = [];
              for (const matchup of weekMatchups) {
                matchupData.push(new SleeperTeamMatchUpData(matchup));
              }
              leagueMatchups[weekNum] = matchupData;
              return of(weekMatchups);
            })));
          observe.push(this.sleeperApiService.getSleeperTransactionByLeagueIdForWeek(selectedLeague.leagueId, weekNum)
            .pipe(mergeMap((weekTransactions) => {
              const transactionsData: SleeperTeamTransactionData[] = [];
              for (const transaction of weekTransactions) {
                const picks = [];
                for (const pick of transaction.draft_picks) {
                  picks.push(new SleeperRawTradePicksData(pick.owner_id, pick.previous_owner_id, pick.roster_id, pick.round, pick.season));
                }
                transactionsData.push(new SleeperTeamTransactionData(transaction, picks));
              }
              leagueTransactions[weekNum] = transactionsData;
              return of(weekTransactions);
            })));
        }
        observe.push(this.sleeperApiService.fetchAllSleeperPlayers().pipe(map((players) => {
            this.sleeperPlayers = players;
            return of(this.sleeperPlayers);
          }))
        );
        observe.push(this.sleeperApiService.getSleeperPlayoffsByLeagueId(this.selectedLeague.leagueId).pipe(map((playoffs) => {
            this.playoffMatchUps = playoffs;
            return of(this.playoffMatchUps);
          }))
        );
        forkJoin(observe).subscribe(() => {
            this.selectedLeague.leagueMatchUps = leagueMatchups;
            this.selectedLeague.leagueTransactions = leagueTransactions;
            return of();
          }
        );
        // fetch rosters and drafts picks
        return this.sleeperApiService.getSleeperRostersByLeagueId(selectedLeague.leagueId).pipe(mergeMap((rosters: SleeperRosterData[]) => {
            console.log('Fetching Roster Ids...');
            this.sleeperTeamDetails = [];
            rosters.map(roster => {
              for (const owner of owners) {
                if (roster.ownerId === owner?.userId) {
                  this.sleeperTeamDetails.push(new SleeperTeam(owner, roster));
                  break;
                }
              }
            });
            return this.sleeperApiService.getSleeperDraftbyLeagueId(selectedLeague.leagueId).pipe(mergeMap((draftIds: string[]) => {
              draftIds.map((draftId: string) => {
                  console.log('processing draft:', draftId);
                  return this.$assignPicks(draftId).subscribe();
                }
              );
              return this.$generateFutureDraftCapital();
            }));
          })
        );
      })
    );
  }

  /**
   * loads new user data from sleeper username
   * @param userName user name
   * @param year
   */
  loadNewUser(userName: string, year: string): Observable<any> {
    this.spinner.show();
    console.time('Fetch Sleeper User Data');
    this.selectedYear = year;
    try {
      this.sleeperApiService.getSleeperUserInformation(userName).subscribe((userData: SleeperUserData) => {
        if (userData == null) {
          this.spinner.hide();
          this.sleeperUser = null;
          throw new Error('User data could not be found. Try again!');
        }
        this.sleeperApiService.getSleeperLeaguesByUserID(userData.user_id, year).subscribe((response: SleeperLeagueData[]) => {
          this.sleeperUser = {leagues: response, userData};
          this.spinner.hide();
          console.timeEnd('Fetch Sleeper User Data');
          return of();
        });
      });
    } catch (e: any) {
      this.spinner.hide();
      console.error('Failed to get data for user ', e);
      return of();
    }
  }

  /**
   * generate future draft capital for teams
   * @private
   */
  private $generateFutureDraftCapital(): Observable<SleeperTeam[]> {
    return this.sleeperApiService.getSleeperTradedPicksByLeagueId(this.selectedLeague.leagueId)
      .pipe(mergeMap((tradedPicks: SleeperRawTradePicksData[]) => {
        this.sleeperTeamDetails.map((team: SleeperTeam) => {
          let draftPicks: DraftCapital[] = [];
          for (
            let year = Number(this.selectedLeague.season) + 1;
            year < Number(this.selectedLeague.season) + 4;
            year++
          ) {
            for (let i = 0; i < this.selectedLeague.draftRounds; i++) {
              draftPicks.push(new DraftCapital(true, i + 1, this.selectedLeague.totalRosters / 2, year.toString()));
            }
          }
          // TODO repeated code here
          tradedPicks.map((tradedPick: SleeperRawTradePicksData) => {
            if (Number(tradedPick.season) > Number(this.selectedLeague.season)
              && tradedPick.ownerId === team.roster.rosterId
              && tradedPick.rosterId !== team.roster.rosterId
            ) {
              draftPicks.push(new DraftCapital(false, tradedPick.round,
                this.selectedLeague.totalRosters / 2, tradedPick.season));
            }
          });
          tradedPicks.map((tradedPick: SleeperRawTradePicksData) => {
            if (Number(tradedPick.season) > Number(this.selectedLeague.season)
              && tradedPick.ownerId !== team.roster.rosterId
              && tradedPick.rosterId === team.roster.rosterId
            ) {
              draftPicks = this.removeDraftPick(draftPicks.slice(), tradedPick);
            }
          });
          team.futureDraftCapital = draftPicks;
        });
        return of(this.sleeperTeamDetails);
      }));
  }

  // TODO clean up mock draft code... create separate object or use draft capital from team details
  private $assignPicks(draftId: string): Observable<SleeperTeam[]> {
    return this.sleeperApiService.getSleeperDraftDetailsByDraftId(draftId).pipe(mergeMap((draft: SleeperRawDraftOrderData) => {
      if (draft.status === 'pre_draft' && draft.draftOrder) {
        return this.sleeperApiService.getSleeperTradedPicksByDraftId(draft.draftId)
          .pipe(mergeMap((tradedPicks: SleeperRawTradePicksData[]) => {
            this.sleeperTeamDetails.map((team: SleeperTeam) => {
              const draftPicks: DraftCapital[] = [];
              const slot = draft.draftOrder[team.owner?.userId];
              for (let i = 0; i < draft.rounds; i++) {
                let slotPick = slot;
                if (draft.type === 'snake' && i + 1 % 2 === 0) {
                  slotPick = this.selectedLeague.totalRosters - slot;
                }
                draftPicks.push(new DraftCapital(true, i + 1, Number(slot), draft.season));
              }
              const rosterId = draft.slotToRosterId[slot];
              tradedPicks.reverse();
              tradedPicks.map((tradedPick: SleeperRawTradePicksData) => {
                if (tradedPick.rosterId === rosterId && tradedPick.ownerId !== rosterId) {
                  const index = draftPicks.map((i) => i.round).indexOf(tradedPick.round);
                  draftPicks.splice(index, 1);
                } else if (tradedPick.ownerId === rosterId) {
                  let pickSlot = Number(Object.keys(draft.slotToRosterId).find(key => draft.slotToRosterId[key] ===
                    tradedPick.rosterId));
                  if (draft.type === 'snake' && tradedPick.round % 2 === 0) {
                    pickSlot = this.selectedLeague.totalRosters - pickSlot;
                  }
                  if (!this.doesPickAlreadyExist(tradedPick, draftPicks, pickSlot)) {
                    draftPicks.push(new DraftCapital(false, tradedPick.round, pickSlot, tradedPick.season));
                  }
                }
              });
              team.draftCapital = draftPicks;
            });
            this.upcomingDrafts.push(draft);
            return of(this.sleeperTeamDetails);
          }));
      } else if (draft.status === 'complete' && draft.draftOrder) {
        forkJoin([
          this.sleeperApiService.getSleeperCompletedDraftsByDraftId(draft.draftId),
          this.sleeperApiService.getSleeperTradedPicksByDraftId(draft.draftId)]
        ).subscribe(([picks, tradedPicks]) => {
            tradedPicks.reverse().map((tradedPick: SleeperRawTradePicksData) => {
              picks.filter(pick => {
                if (pick.round === tradedPick.round && tradedPick.previousOwnerId === pick.rosterId) {
                  pick.rosterId = tradedPick.previousOwnerId;
                }
              });
            });
            this.completedDrafts.push(new CompletedDraft(draft, picks));
          }
        );
      }
      return of(this.sleeperTeamDetails);
    }));
  }

  /**
   * reset league data
   */
  resetLeague(): void {
    this.leagueLoaded = false;
    this.selectedLeague = null;
    this.sleeperTeamDetails = [];
    this.completedDrafts = [];
    this.upcomingDrafts = [];
    this.playoffMatchUps = [];
  }

  /**
   * does this pick already exist
   * catches traded picks back to the original owner
   * @param tradedPick traded pick data
   * @param draftPicks player draft capital
   * @param pickNumber pick number
   * @private
   * returns true if pick already exists
   */
  private doesPickAlreadyExist(tradedPick: SleeperRawTradePicksData, draftPicks: DraftCapital[], pickNumber: number): boolean {
    for (const pick of draftPicks) {
      if (pick.round === tradedPick.round && pick.pick === pickNumber) {
        return true;
      }
    }
    return false;
  }

  /**
   * get team by roster id
   * @param rosterId id
   * returns sleeper team data
   */
  getTeamByRosterId(rosterId): SleeperTeam {
    for (const team of this.sleeperTeamDetails) {
      if (team.roster.rosterId === rosterId) {
        return team;
      }
    }
    // TODO improve handling when player leaves league mid season without replacement
    // if not found we return a dummy object
    return new SleeperTeam(
      new SleeperOwnerData(
        'unable_to_find',
        'Retired Owner',
        'Retired Team',
        ''
      ),
      new SleeperRosterData(
        rosterId,
        'unable_to_find',
        [],
        new TeamMetrics(null)
      )
    );
  }

  /**
   * get team by user id
   * returns sleeper team data
   * @param userId
   */
  getTeamByUserId(userId: string): SleeperTeam {
    for (const team of this.sleeperTeamDetails) {
      if (team.roster.ownerId === userId) {
        return team;
      }
    }
    return null;
  }

  /**
   * Convert draft capital objects into a list of name ids.
   * This will be used to filter name ids from players.
   * @param draftCapital
   */
  getDraftCapitalToNameId(draftCapital: DraftCapital[]): string[] {
    const nameIds = [];
    draftCapital.map(pick => {
      let pickString = '';
      if (pick.pick <= this.selectedLeague.totalRosters / 3) {
        pickString = 'early';
      } else if (pick.pick >= 2 * this.selectedLeague.totalRosters / 3) {
        pickString = 'late';
      } else {
        pickString = 'mid';
      }
      let rdString = null;
      switch (pick.round) {
        case 1: {
          rdString = '1stpi';
          break;
        }
        case 2: {
          rdString = '2ndpi';
          break;
        }
        case 3: {
          rdString = '3rdpi';
          break;
        }
        case 4: {
          rdString = '4thpi';
          break;
        }
      }
      if (rdString) {
        nameIds.push(`${pick.year}${pickString}${rdString}`);
      }
    });
    return nameIds;
  }

  /**
   * handles removing draft pick from draft capital
   * @param draftPicks
   * @param tradedPick
   * @private
   */
  private removeDraftPick(draftPicks: DraftCapital[], tradedPick: SleeperRawTradePicksData): DraftCapital[] {
    for (let i = 0; i < draftPicks.length; i++) {
      if (draftPicks[i].round === tradedPick.round && draftPicks[i].year === tradedPick.season) {
        draftPicks.splice(i, 1);
        return draftPicks;
      }
    }
    return draftPicks;
  }
}
