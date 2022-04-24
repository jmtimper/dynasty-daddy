/* tslint:disable:variable-name */
import {DraftCapital} from './SleeperUser';
import set = Reflect.set;

export class TeamMetrics {

  constructor(settings: any) {
    this.wins = settings?.wins || 0;
    this.waiverPosition = settings?.waiver_position || 0;
    this.ppts = settings?.ppts + (settings?.ppts_decimal / 100) || 0;
    this.losses = settings?.losses || 0;
    this.fpts = settings?.fpts + (settings?.fpts_decimal / 100) || 0;
    this.fptsAgainst = settings?.fpts_against + (settings?.fpts_against_decimal / 100) || 0;
    this.division = settings?.division || 0;
    this.ties = settings?.ties || 0;
    this.rank = settings?.rank || 0;
  }


  wins: number;
  waiverPosition: number;
  rank: number;
  ppts: number;
  losses: number;
  ties: number;
  fptsAgainst: number;
  fpts: number;
  division: number;
}

export class SleeperRosterData {
  constructor(roster_id: number, owner_id: string, players: string[], settings: TeamMetrics) {
    this.rosterId = roster_id;
    this.ownerId = owner_id;
    this.players = players;
    this.teamMetrics = settings;
  }

  rosterId: number;
  ownerId: string;
  players: string[];
  teamMetrics: TeamMetrics;
}

export class SleeperOwnerData {
  constructor(user_id: string, display_name: string, team_name: string, avatar: string) {
    this.userId = user_id;
    this.ownerName = display_name;
    this.teamName = team_name || display_name;
    this.avatar = avatar;
  }

  ownerName: string;
  teamName: string;
  userId: string;
  avatar: string;
}

export class SleeperTeam {
  constructor(owner: SleeperOwnerData, roster: SleeperRosterData) {
    this.owner = owner;
    this.roster = roster;
  }

  owner: SleeperOwnerData;
  roster: SleeperRosterData;
  draftCapital: DraftCapital[] = [];
  futureDraftCapital: DraftCapital[] = [];
}

export class SleeperRawDraftOrderData {
  constructor(draft_id: string,
              league_id: string,
              status: string,
              type: string,
              draft_order: any,
              slot_to_roster_id: any,
              year: string,
              settings: any) {
    this.draftId = draft_id;
    this.leagueId = league_id;
    this.status = status;
    this.type = type;
    this.draftOrder = draft_order;
    this.slotToRosterId = slot_to_roster_id;
    this.rounds = settings.rounds;
    this.season = year;
    this.playerType = settings.player_type;
  }

  draftOrder: any;
  slotToRosterId: any;
  leagueId: string;
  draftId: string;
  status: string;
  type: string;
  rounds: number;
  season: string;
  playerType: number;
}

export class SleeperRawTradePicksData {
  constructor(owner_id: number, previous_owner_id: number, roster_id: number, round: number, season: string) {
    this.ownerId = owner_id;
    this.previousOwnerId = previous_owner_id;
    this.rosterId = roster_id;
    this.round = round;
    this.season = season;
  }

  ownerId: number;
  previousOwnerId: number;
  rosterId: number;
  round: number;
  season: string;
}

export class SleeperTeamMatchUpData {
  constructor(matchup: any) {
    this.starterPoints = matchup.starters_points;
    this.starters = matchup.starters;
    this.rosterId = matchup.roster_id;
    this.points = matchup.points;
    this.players = matchup.players;
    this.matchupId = matchup.matchup_id;
    this.customPoints = matchup.custom_points;
  }

  starterPoints: number[];
  starters: string[];
  rosterId: number;
  points: number;
  players: string[];
  matchupId: number;
  customPoints: number;
}

export class SleeperTeamTransactionData {
  constructor(transaction: any, picks: SleeperRawTradePicksData[] = []) {
    this.type = transaction.type;
    this.transactionId = transaction.transaction_id;
    this.status = transaction.status;
    this.settings = transaction.settings;
    this.rosterIds = transaction.roster_ids;
    this.drops = transaction.drops;
    this.adds = transaction.adds;
    this.draftpicks = picks;
    this.createdAt = transaction.created;
  }


  type: string;
  transactionId: string;
  status: string;
  settings: {};
  rosterIds: number[];
  drops: {};
  adds: {};
  draftpicks: SleeperRawTradePicksData[];
  createdAt: number;
}

export class SleeperCompletedPickData {

  constructor(pick: any) {
    this.round = pick.round;
    this.draftSlot = pick.draft_slot;
    this.sleeperId = pick.player_id;
    this.isKeeper = pick.is_keeper;
    this.rosterId = pick.roster_id;
    this.pickNumber = pick.pick_no;
    this.draftId = pick.draft_id;
    this.firstName = pick.metadata.first_name;
    this.lastName = pick.metadata.last_name;
    this.position = pick.metadata.position;
  }

  round: number;
  rosterId: number;
  sleeperId: string;
  pickNumber: number;
  isKeeper: boolean;
  draftSlot: number;
  draftId: string;
  firstName: string;
  lastName: string;
  position: string;
}

export class SleeperStateOfNFL {
  constructor(season: any) {
    this.week = season.week;
    this.season = season.season;
    this.previousSeason = season.previous_season;
    this.seasonType = season.season_type;
  }

  week: number;
  season: string;
  previousSeason: string;
  seasonType: string;
  completedWeek: number;
}

export class SleeperPlayoffMatchUp {
  constructor(game: any) {
    this.round = game.r;
    this.matchUpId = game.m;
    this.team1 = game.t1;
    this.team2 = game.t2;
    this.win = game.w;
    this.loss = game.l;
  }

  round: number;
  matchUpId: number;
  team1: number;
  team2: number;
  win: number;
  loss: number;
}
