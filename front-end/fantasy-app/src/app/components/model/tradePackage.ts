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
  acceptanceVariance: number = .05;
  acceptanceBufferAmount: number = 1000;
  isSuperFlex: boolean = true;
  autoFillTeam1: boolean = false;
  autoFillTeam2: boolean = false;

  constructor(team1Assets: KTCPlayer[], team2Assets: KTCPlayer[], acceptanceVariance: number = 0.05) {
    this.team1Assets = team1Assets;
    this.team2Assets = team2Assets;
    this.acceptanceVariance = acceptanceVariance;
  }
}
