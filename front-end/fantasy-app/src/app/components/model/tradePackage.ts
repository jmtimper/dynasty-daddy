import {KTCPlayer} from '../../model/KTCPlayer';

export class TradePackage {
  team1Id: number = null;
  team1Assets: KTCPlayer[] = [];
  team2Id: number = null;
  team2Assets: KTCPlayer[] = [];
  valueAdjustment: number = 0;
  // if applies to team 1's side this would be 1 or team 2 this would be 2
  // I left this as a number to support the option for 3 team trades in the future
  valueAdjustmentSide: number = 0;
  autoFillTeam1: boolean = false;
  autoFillTeam2: boolean = false;

  constructor(team1Assets: KTCPlayer[], team2Assets: KTCPlayer[]) {
    this.team1Assets = team1Assets;
    this.team2Assets = team2Assets;
  }
}
