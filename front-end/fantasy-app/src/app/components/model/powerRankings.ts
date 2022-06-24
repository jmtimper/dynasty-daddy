import {KTCPlayer} from '../../model/KTCPlayer';
import {SleeperTeam} from '../../model/SleeperLeague';
import {DraftCapital} from '../../model/SleeperUser';

export class TeamPowerRanking {
  constructor(team: SleeperTeam, players: PositionPowerRanking[], sfTradeValue: number, tradeValue: number, picks: PositionPowerRanking) {
    this.team = team;
    this.roster = players;
    this.sfTradeValueOverall = sfTradeValue;
    this.tradeValueOverall = tradeValue;
    this.picks = picks;
  }

  team: SleeperTeam;
  roster: PositionPowerRanking[];
  picks: PositionPowerRanking;
  starters: KTCPlayer[] = [];
  sfTradeValueOverall: number = 0;
  tradeValueOverall: number = 0;
  overallRank: number;
  starterRank: number;
  sfTradeValueStarter: number = 0;
  tradeValueStarter: number = 0;
  tier: TeamRankingTier;
}

export class PositionPowerRanking {
  constructor(pos: string, sfTradeValue: number, tradeValue: number, groupList: KTCPlayer[]) {
    this.sfTradeValue = sfTradeValue;
    this.tradeValue = tradeValue;
    this.players = groupList;
    this.position = pos;
  }

  rank: number;
  position: string;
  sfTradeValue: number;
  tradeValue: number;
  players: KTCPlayer[];
}

export enum TeamRankingTier {
  Contender,
  Frisky,
  Fraud,
  Rebuilding,
  WhatHappened,
  SuperTeam
}
