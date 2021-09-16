/* tslint:disable:variable-name */
import {SleeperCompletedPickData, SleeperRawDraftOrderData, SleeperRawTradePicksData} from './SleeperLeague';

export class SleeperUserData {
  username: string;
  user_id: string;
  avatar: string;
}

export class CompletedDraft {
  constructor(draft: SleeperRawDraftOrderData, picks: SleeperCompletedPickData[]) {
    this.draft = draft;
    this.picks = picks;
  }

  draft: SleeperRawDraftOrderData;
  picks: SleeperCompletedPickData[];
}

export class SleeperLeagueData {
  constructor(b: boolean,
              name: string,
              league_id: string,
              total_rosters: number,
              roster_positions: string[],
              previous_league_id: string,
              status: string,
              season: string,
              metadata: any,
              settings: any) {
    this.isSuperflex = b;
    this.name = name;
    this.leagueId = league_id;
    this.totalRosters = total_rosters;
    this.rosterPositions = roster_positions;
    this.prevLeagueId = previous_league_id;
    this.status = status;
    this.divisions = settings.divisions;
    for (let i = 0; i < this.divisions; i++) {
      this.divisionNames.push( metadata ? metadata[`division_${i + 1}`] : `Division ${i + 1}`);
    }
    this.playoffTeams = settings.playoff_teams;
    this.startWeek = settings.start_week;
    this.playoffStartWeek = settings.playoff_week_start;
    this.draftRounds = settings.draft_rounds;
    this.season = season;
    this.playoffRoundType = settings.playoff_round_type;
    this.medianWins = settings.league_average_match === 1;
  }

  isSuperflex: boolean = true;
  name: string;
  leagueId: string;
  totalRosters: number;
  rosterPositions: string[];
  prevLeagueId: string;
  divisionNames: string[] = [];
  divisions: number;
  status: string;
  playoffTeams: number;
  startWeek: number;
  playoffStartWeek: number;
  leagueMatchUps: {};
  leagueTransactions: {};
  draftRounds: number;
  season: string;
  playoffRoundType: number;
  medianWins: boolean;
}

export class SleeperData {
  userData: SleeperUserData;
  leagues: SleeperLeagueData[];
}

export class DraftCapital {
  constructor(b: boolean, round: number, number: number, year: string) {
    this.isFirstOwner = b;
    this.round = round;
    this.pick = number;
    this.year = year;
  }

  isFirstOwner: boolean;
  round: number;
  pick: number;
  year: string;
}
