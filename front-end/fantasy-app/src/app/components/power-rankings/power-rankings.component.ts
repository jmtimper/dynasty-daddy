import {Component, OnInit} from '@angular/core';
import {SleeperService} from '../../services/sleeper.service';
import {PowerRankingsService} from '../services/power-rankings.service';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {LeagueSwitchService} from '../services/league-switch.service';
import {delay} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-power-rankings',
  templateUrl: './power-rankings.component.html',
  styleUrls: ['./power-rankings.component.css']
})
export class PowerRankingsComponent extends BaseComponent implements OnInit {

  constructor(public sleeperService: SleeperService,
              public powerRankingService: PowerRankingsService,
              private playersService: PlayerService,
              private route: ActivatedRoute,
              private leagueSwitchService: LeagueSwitchService) {

    super();
  }

  ngOnInit(): void {
    this.mapPowerRankings();
    // TODO potentially improve how this functions
    this.addSubscriptions(this.leagueSwitchService.leagueChanged.pipe(delay(1500)).subscribe(() => {
          this.mapPowerRankings();
        }
      ),
      this.route.queryParams.subscribe(params => {
        this.leagueSwitchService.loadFromQueryParams(params);
      }));
  }

  mapPowerRankings(): void {
    // TODO ugly fix for race condition on adding upcoming draft picks to playoff calculator
    if (this.sleeperService.upcomingDrafts.length !== 0) {
      this.powerRankingService.reset();
      this.powerRankingService.mapPowerRankings(this.sleeperService.sleeperTeamDetails, this.playersService.playerValues);
    }
  }
}
