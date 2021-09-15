import {SleeperTeamMatchUpData} from "../../model/SleeperLeague";

export class ScheduleComp {
  constructor(rosterId: number, record: {}) {
    this.rosterId = rosterId;
    this.record = record;
  }

  rosterId: number;
  record: {};
}

export class WeeklyRecordComp {
  constructor(rosterId: number, records: {}, wins: number, loss: number, ties: number) {
    this.rosterId = rosterId;
    this.totalWins = wins;
    this.totalLosses = loss;
    this.totalTies = ties;
    this.records = records;
  }

  rosterId: number;
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  records: {};
}

export class MatchUpUI {
  constructor(week: number, team1: SleeperTeamMatchUpData, team2: SleeperTeamMatchUpData) {
    this.week = week;
    this.matchUpId = team1.matchupId;
    this.team1RosterId = team1.rosterId;
    this.team1Starters = team1.starters;
    this.team1Points = team1.points;
    this.team1StartersPoints = team1.starterPoints;
    this.team2RosterId = team2.rosterId;
    this.team2Starters = team2.starters;
    this.team2Points = team2.points;
    this.team2StartersPoints = team2.starterPoints;
  }

  week: number;
  matchUpId: number;
  team1RosterId: number;
  team1Starters: string[];
  team1StartersPoints: number[];
  team1Points: number;
  team2RosterId: number;
  team2Starters: string[];
  team2StartersPoints: number[];
  team2Points: number;
  selectedWinner: number = 0;
  selectedTeam1MedianWin: number = 0;
  selectedTeam2MedianWin: number = 0;
}
