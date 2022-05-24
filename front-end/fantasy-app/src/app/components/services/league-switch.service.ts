import {NgxSpinnerService} from 'ngx-spinner';
import {SleeperApiService} from '../../services/api/sleeper/sleeper-api.service';
import {SleeperService} from '../../services/sleeper.service';
import {PowerRankingsService} from './power-rankings.service';
import {PlayerService} from '../../services/player.service';
import {MockDraftService} from './mock-draft.service';
import {MatchupService} from './matchup.service';
import {PlayoffCalculatorService} from './playoff-calculator.service';
import {ConfigService} from '../../services/init/config.service';
import {TransactionsService} from './transactions.service';
import {SleeperLeagueData} from '../../model/SleeperUser';
import {forkJoin, Subject} from 'rxjs';
import {Injectable} from '@angular/core';
import {BaseComponent} from '../base-component.abstract';
import {TradeService} from './trade.service.ts.service';
import {TradeFinderService} from "./trade-finder.service";

@Injectable({
  providedIn: 'root'
})
export class LeagueSwitchService extends BaseComponent {

  /** selected league data */
  selectedLeague: SleeperLeagueData;

  /** event whenever a league has finished changing */
  leagueChanged = new Subject<SleeperLeagueData>();

  constructor(private spinner: NgxSpinnerService,
              private sleeperApiService: SleeperApiService,
              private sleeperService: SleeperService,
              private powerRankingService: PowerRankingsService,
              private playersService: PlayerService,
              private tradeService: TradeService,
              private mockDraftService: MockDraftService,
              private matchupService: MatchupService,
              private playoffCalculatorService: PlayoffCalculatorService,
              private tradeFinderService: TradeFinderService,
              private configService: ConfigService,
              private transactionService: TransactionsService) {
    super();
  }

  /**
   * load league data
   * @param value league data
   */
  loadLeague(value: SleeperLeagueData): void {
    this.selectedLeague = value;
    if (this.selectedLeague !== this.sleeperService.selectedLeague) {
      this.spinner.show();
      this.sleeperService.resetLeague();
      this.powerRankingService.reset();
      this.mockDraftService.resetLeague();
      this.playoffCalculatorService.reset();
      this.matchupService.reset();
      this.playersService.resetOwners();
      this.transactionService.reset();
      this.tradeService.reset();
      console.time('Fetch Sleeper League Data');
      this.addSubscriptions(this.sleeperService.$loadNewLeague(this.selectedLeague).subscribe((x) => {
          this.sleeperService.sleeperTeamDetails.map((team) => {
            this.playersService.generateRoster(team);
          });
          forkJoin([this.powerRankingService.mapPowerRankings(this.sleeperService.sleeperTeamDetails, this.playersService.playerValues),
            this.playoffCalculatorService.generateDivisions(this.selectedLeague, this.sleeperService.sleeperTeamDetails),
            this.matchupService.initMatchUpCharts(this.selectedLeague)]).subscribe(() => {
            this.sleeperService.leagueLoaded = true;
            this.tradeFinderService.selectedTeamUserId = this.sleeperService.sleeperUser?.userData?.user_id;
            console.timeEnd('Fetch Sleeper League Data');
            this.leagueChanged.next(this.selectedLeague);
            this.spinner.hide();
          });
        }
      ));
    }
  }
}
