/* tslint:disable */
import {SleeperOwnerData} from "./SleeperLeague";

export class KTCPlayer {
  id: number;
  name_id: string;
  sleeper_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  team: string;
  position: string;
  sf_position_rank: string;
  position_rank: string;
  age: number;
  experience: number;
  injury_status: string;
  sf_trade_value: number;
  trade_value: number;
  owner: SleeperOwnerData = null;
  date: string;
}

export class KTCPlayerDataPoint {
  name_id: string;
  full_name: string;
  sf_position_rank: string;
  position_rank: string;
  sf_trade_value: number;
  trade_value: number;
  date: string;
}

export enum Position {
  QB,
  RB,
  WR,
  TE,
  PICK,
}
