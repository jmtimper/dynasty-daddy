import {Injectable} from '@angular/core';
import {KTCApiConfigService} from './api/ktc-api-config.service';
import {SleeperApiConfigService} from './api/sleeper/sleeper-api-config.service';
import {ConfigApiConfigService} from './api/config/config-api-config.service';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {

  // TODO add cloud base url for api
  private baseUrl = 'https://dynasty-daddy.com/api';
  // uncomment for dev environment
  // private baseUrl = 'http://localhost:3000/api';

  constructor(private ktcApiConfigService: KTCApiConfigService,
              private sleeperApiConfigService: SleeperApiConfigService,
              private configApiConfigService: ConfigApiConfigService) {
  }

  public assignEndpoints(): void {

    // config option endpoint
    this.configApiConfigService.getConfigOptionsEndpoint = this.baseUrl + '/v1/config/all';

    // KTC Database Endpoints
    this.ktcApiConfigService.getPlayerValuesForTodayEndpoint = this.baseUrl + '/v1/player/all/today';
    this.ktcApiConfigService.getPrevPlayerValuesEndpoint = this.baseUrl + '/v1/player/all/prev/';
    this.ktcApiConfigService.getHistoricalPlayerValues = this.baseUrl + '/v1/player/sleeper/';

    // Sleeper Endpoints
    this.sleeperApiConfigService.getSleeperUsernameEndpoint = 'https://api.sleeper.app/v1/user/';
    this.sleeperApiConfigService.getSleeperLeagueEndpoint = 'https://api.sleeper.app/v1/league/';
    this.sleeperApiConfigService.getSleeperDraftEndpoint = 'https://api.sleeper.app/v1/draft/';
    this.sleeperApiConfigService.getSleeperStatsEndpoint = 'https://api.sleeper.app/v1/stats/nfl/regular/';
    this.sleeperApiConfigService.getSleeperProjectionsEndpoint = 'https://api.sleeper.app/v1/projections/nfl/regular/';
    this.sleeperApiConfigService.getSleeperNFLStateEndpoint = 'https://api.sleeper.app/v1/state/nfl';
    this.sleeperApiConfigService.getSleeperPlayersEndpoint = 'https://api.sleeper.app/v1/players/nfl';
  }
}
