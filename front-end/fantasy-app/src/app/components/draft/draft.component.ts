import {Component, OnInit} from '@angular/core';
import {SleeperService} from '../../services/sleeper.service';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {MockDraftService} from '../services/mock-draft.service';
import {LeagueSwitchService} from '../services/league-switch.service';
import {delay} from 'rxjs/operators';

@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.css']
})
export class DraftComponent extends BaseComponent implements OnInit {

  /** rerender table when refreshed */
  resetTrigger: boolean = true;

  constructor(public sleeperService: SleeperService,
              private playersService: PlayerService,
              private leagueSwitchService: LeagueSwitchService,
              public mockDraftService: MockDraftService) {
    super();
  }

  ngOnInit(): void {
    if (this.sleeperService.selectedLeague && this.playersService.playerValues.length !== 0) {
      this.initServices();
    } else {
      this.playersService.loadPlayerValuesForToday();
    }
    this.addSubscriptions(this.playersService.$currentPlayerValuesLoaded.subscribe(() => {
        if (this.sleeperService.sleeperTeamDetails) {
          this.initServices();
        }
      }),
      this.leagueSwitchService.leagueChanged.pipe(delay(1000)).subscribe(() => {
          this.initServices();
        }
      )
    );
  }

  /**
   * initializes mock draft service
   * @private
   */
  private initServices(): void {
    this.mockDraftService.generateDraft(
      this.playersService.playerValues,
      this.sleeperService.selectedLeague.isSuperflex,
      this.sleeperService.upcomingDrafts[0]?.playerType
    );
    this.mockDraftService.mapDraftObjects(this.sleeperService.sleeperTeamDetails);
    if (this.mockDraftService.teamPicks.length > 0) {
      this.mockDraftService.selectedDraft = 'upcoming';
    } else {
      this.mockDraftService.selectedDraft = this.sleeperService.completedDrafts[0] || null;
    }
    this.mockDraftService.leagueLoaded = true;
  }

  /**
   * wraps mock draft service call to reset
   */
  resetMockDraft(): void {
    this.mockDraftService.resetDraftList();
    this.resetTrigger = !this.resetTrigger;
  }

}
