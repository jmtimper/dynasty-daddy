import {Component, OnInit} from '@angular/core';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {KTCPlayer, KTCPlayerDataPoint} from '../../model/KTCPlayer';
import {KTCApiService} from '../../services/api/ktc-api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SleeperService} from '../../services/sleeper.service';
import {PlayerComparisonService} from '../services/player-comparison.service';
import {ConfigService} from '../../services/init/config.service';
import {PlayerInsights} from '../model/playerInsights';

@Component({
  selector: 'app-player-details',
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.css']
})
export class PlayerDetailsComponent extends BaseComponent implements OnInit {

  /** did players load */
  playersLoaded: boolean;

  /** selected player */
  selectedPlayer: KTCPlayer;

  /** selected player insights */
  selectedPlayerInsights: PlayerInsights;

  /** historical player value data */
  historicalTradeValue: KTCPlayerDataPoint[];

  constructor(public playerService: PlayerService,
              private ktcApiService: KTCApiService,
              private route: ActivatedRoute,
              public sleeperService: SleeperService,
              private router: Router,
              private playerComparisonService: PlayerComparisonService,
              public configService: ConfigService) {
    super();
  }

  ngOnInit(): void {
    const nameId = this.route.snapshot.paramMap.get('playerNameId');
    this.playersLoaded = (this.playerService.playerValues.length > 0);
    if (this.playersLoaded) {
      this.selectedPlayer = this.playerService.getPlayerByNameId(nameId);
      this.selectedPlayerInsights = this.playerService.getPlayerInsights(this.selectedPlayer,
        this.sleeperService?.selectedLeague?.isSuperflex);
    }
    this.playerService.loadPlayerValuesForToday();
    this.addSubscriptions(this.playerService.$currentPlayerValuesLoaded.subscribe(() => {
        this.playersLoaded = true;
        this.selectedPlayer = this.playerService.getPlayerByNameId(nameId);
      }),
      this.ktcApiService.getHistoricalPlayerValueById(nameId).subscribe((data) => {
          this.historicalTradeValue = data;
        }
      ));
  }

  /**
   * get last 5 week average for player fantasy points
   */
  getLast5WeekAverage(): number | string {
    let last5Weeks = 0;
    for (let i = 1; i < 6; i++) {
      const weekStats = this.playerService.pastSeasonWeeklyStats[i];
      if (weekStats) {
        last5Weeks += weekStats[this.selectedPlayer.sleeper_id]?.pts_half_ppr || 0;
      }
    }
    return Math.round(last5Weeks / 5 * 100) / 100 || '---';
  }

  /**
   * check if all player stats are generated from sleeper
   * TODO update with rxjs
   */
  isPlayerStatsGenerated(): boolean {
    return this.playerService.pastSeasonWeeklyStats[2] &&
      this.playerService.pastSeasonWeeklyStats[1] &&
      this.playerService.pastSeasonWeeklyStats[3] &&
      this.playerService.pastSeasonWeeklyStats[4] &&
      this.playerService.pastSeasonWeeklyStats[5] &&
      this.playerService.pastSeasonWeeklyStats[6] &&
      this.playerService.pastSeasonWeeklyStats[7] &&
      this.playerService.pastSeasonWeeklyStats[8] &&
      this.playerService.pastSeasonWeeklyStats[9] &&
      this.playerService.pastSeasonWeeklyStats[10] &&
      this.playerService.pastSeasonWeeklyStats[11] &&
      this.playerService.pastSeasonWeeklyStats[12] &&
      this.playerService.pastSeasonWeeklyStats[13] &&
      this.playerService.pastSeasonWeeklyStats[14] &&
      this.playerService.pastSeasonWeeklyStats[15] &&
      this.playerService.pastSeasonWeeklyStats[16] &&
      this.playerService.pastSeasonWeeklyStats[17] &&
      this.playerService.pastSeasonWeeklyStats[18] &&
      this.playerService.pastSeasonWeeklyProjections[1] &&
      this.playerService.pastSeasonWeeklyProjections[2] &&
      this.playerService.pastSeasonWeeklyProjections[3] &&
      this.playerService.pastSeasonWeeklyProjections[4] &&
      this.playerService.pastSeasonWeeklyProjections[5] &&
      this.playerService.pastSeasonWeeklyProjections[6] &&
      this.playerService.pastSeasonWeeklyProjections[7] &&
      this.playerService.pastSeasonWeeklyProjections[8] &&
      this.playerService.pastSeasonWeeklyProjections[9] &&
      this.playerService.pastSeasonWeeklyProjections[10] &&
      this.playerService.pastSeasonWeeklyProjections[11] &&
      this.playerService.pastSeasonWeeklyProjections[12] &&
      this.playerService.pastSeasonWeeklyProjections[13] &&
      this.playerService.pastSeasonWeeklyProjections[14] &&
      this.playerService.pastSeasonWeeklyProjections[15] &&
      this.playerService.pastSeasonWeeklyProjections[16] &&
      this.playerService.pastSeasonWeeklyProjections[17] &&
      this.playerService.pastSeasonWeeklyProjections[18];
  }

  /**
   * open up player comparison with selected player
   * @param selectedPlayer player data
   */
  openPlayerComparison(selectedPlayer: KTCPlayer): void {
      this.playerComparisonService.addPlayerToCharts(selectedPlayer);
      this.router.navigateByUrl('players/comparison');
  }
}
