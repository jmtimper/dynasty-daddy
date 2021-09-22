import {Injectable} from '@angular/core';
import {KTCPlayer, KTCPlayerDataPoint} from '../../model/KTCPlayer';
import {HttpClient} from '@angular/common/http';
import {KTCApiConfigService} from './ktc-api-config.service';
import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class KTCApiService {

  /**
   * cached players list
   * @private
   */
  private playersList: KTCPlayer[];

  /**
   * cached prev month player list
   * @private
   */
  private prevPlayerList: KTCPlayerDataPoint[];

  constructor(private http: HttpClient, private ktcApiConfigService: KTCApiConfigService) {
  }

  /**
   * get player values for today
   */
  getPlayerValuesForToday(): Observable<KTCPlayer[]> {
    return this.playersList ? of(this.playersList) : this.refreshPlayerValuesForToday();
  }

  /**
   * refresh cached player values for today
   */
  refreshPlayerValuesForToday(): Observable<KTCPlayer[]> {
    return this.http.get<KTCPlayer[]>(this.ktcApiConfigService.getPlayerValuesForTodayEndpoint)
      .pipe(tap((players: KTCPlayer[]) => this.playersList = players, err => {
          throw new Error(err);
        }
      ));
  }

  /**
   * get player values for last month
   */
  getPrevPlayerValues(days: number = 30): Observable<KTCPlayerDataPoint[]> {
    return this.prevPlayerList ? of(this.prevPlayerList) : this.refreshPrevPlayerValues(days);
  }

  /**
   * refresh cached player values for last month
   */
  refreshPrevPlayerValues(days: number): Observable<KTCPlayerDataPoint[]> {
    return this.http.get<KTCPlayerDataPoint[]>(this.ktcApiConfigService.getPrevPlayerValuesEndpoint + days)
      .pipe(tap((players: KTCPlayerDataPoint[]) => this.prevPlayerList = players, err => {
          throw new Error(err);
        }
      ));
  }


  /**
   * get historical player value over time by id
   * @param nameId player name id
   */
  getHistoricalPlayerValueById(nameId: string): Observable<KTCPlayerDataPoint[]> {
    return this.http.get<KTCPlayerDataPoint[]>(this.ktcApiConfigService.getHistoricalPlayerValues + nameId)
      .pipe(tap((players: KTCPlayerDataPoint[]) => players
      ));
  }
}
