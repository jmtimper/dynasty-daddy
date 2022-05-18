import {Component, OnInit} from '@angular/core';
import {NgxSpinnerService} from 'ngx-spinner';
import {BaseComponent} from '../base-component.abstract';
import {SleeperApiService} from '../../services/api/sleeper/sleeper-api.service';
import {SleeperLeagueData} from '../../model/SleeperUser';
import {SleeperService} from '../../services/sleeper.service';
import {PowerRankingsService} from '../services/power-rankings.service';
import {PlayerService} from '../../services/player.service';
import {ConfigService} from '../../services/init/config.service';
import {LeagueSwitchService} from '../services/league-switch.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent extends BaseComponent implements OnInit {

  usernameInput: string = '';

  leagueIdInput: string = '';

  selectedYear: string;

  supportedYears: string[] = [];

  loginMethod: string = 'sleeper_username';

  DEMO_ID: string = '553670046391185408';

  constructor(private sleeperApiService: SleeperApiService,
              public sleeperService: SleeperService,
              private powerRankingService: PowerRankingsService,
              private playersService: PlayerService,
              public configService: ConfigService,
              public leagueSwitchService: LeagueSwitchService) {
    super();
  }

  ngOnInit(): void {
    this.supportedYears = this.generateYears();
    if (!this.sleeperService.selectedYear) {
      this.selectedYear = this.supportedYears[1];
    } else {
      this.selectedYear = this.sleeperService.selectedYear;
    }
    this.usernameInput = this.sleeperService.sleeperUser?.userData?.username || '';
    this.leagueSwitchService.selectedLeague = this.sleeperService.selectedLeague || null;
    this.playersService.loadPlayerValuesForToday();
  }

  /**
   * loads sleeper data for user
   */
  fetchSleeperInfo(): void {
    this.sleeperService.loadNewUser(this.usernameInput, this.selectedYear);
    this.sleeperService.selectedYear = this.selectedYear;
    this.sleeperService.resetLeague();
  }

  /**
   * generate selectable years
   * TODO dynamic checking of available years for user??
   */
  generateYears(): string[] {
    const years = [];
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    const currentYear = currentDate.getFullYear() + 1;
    for (let i = 0; i < 16; i++) {
      years.push((currentYear - i).toString());
    }
    return years;
  }

  /**
   * handles logging in for demo
   */
  loginWithDemo(): void {
    this.sleeperService.sleeperUser = null;
    this.loginWithLeagueId(this.DEMO_ID);
  }

  /**
   * handles logging in with league id
   * @param demoId string of demo league id
   */
  loginWithLeagueId(demoId?: string): void {
    this.sleeperApiService.getSleeperLeagueByLeagueId(demoId || this.leagueIdInput).subscribe(leagueData => {
      this.leagueSwitchService.loadLeague(leagueData);
    });
  }

  /**
   * log in with a previous year league id
   */
  loginWithPrevSeason(): void {
    this.loginWithLeagueId(this.sleeperService.selectedLeague.prevLeagueId);
  }
}
