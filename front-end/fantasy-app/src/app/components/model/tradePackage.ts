import {KTCPlayer} from '../../model/KTCPlayer';

export class TradePackage {
  team1UserId: string = null;
  team1Assets: KTCPlayer[] = [];
  team1AssetsValue: number = 0;
  team2UserId: string = null;
  team2Assets: KTCPlayer[] = [];
  team2AssetsValue: number = 0;
  valueAdjustment: number = 0;
  // if applies to team 1's side this would be 1 or team 2 this would be 2
  // I left this as a number to support the option for 3 team trades in the future
  valueAdjustmentSide: number = 0;
  valueToEvenTrade: number = 0;
  acceptanceVariance: number = 5;
  acceptanceBufferAmount: number = 1000;
  isSuperFlex: boolean = true;
  autoFillTrade: boolean = false;

  constructor(team1Assets: KTCPlayer[], team2Assets: KTCPlayer[], acceptanceVariance: number = 5) {
    this.team1Assets = team1Assets;
    this.team2Assets = team2Assets;
    this.acceptanceVariance = acceptanceVariance;
  }

  setTeam1(userId: string): TradePackage {
    this.team1UserId = userId;
    return this;
  }

  setTeam2(userId: string): TradePackage {
    this.team2UserId = userId;
    return this;
  }

  addTeam2Assets(player: KTCPlayer): TradePackage {
    this.team2Assets.push(player);
    return this;
  }

  setAutofill(): TradePackage {
    this.autoFillTrade = true;
    return this;
  }
}

export class StudPlayerResponse {
  studPlayer: KTCPlayer = null;
  adjustmentMultiplier: number = 1;

  constructor(player: KTCPlayer, value: number = 1) {
    this.studPlayer = player;
    this.adjustmentMultiplier = value;
  }

}
