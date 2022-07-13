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
  all_time_high_sf: number;
  all_time_low_sf: number;
  all_time_high: number;
  all_time_low: number;
  three_month_high_sf: number;
  three_month_high: number;
  three_month_low_sf: number;
  three_month_low: number;
  last_month_value: number;
  last_month_value_sf: number;
  most_recent_data_point: string;
  sf_change: number = null;
  standard_change: number = null;
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
