import { Component, OnInit } from '@angular/core';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {KTCPlayer} from '../../model/KTCPlayer';
import {ConfigService} from '../../services/init/config.service';
import {SleeperService} from '../../services/sleeper.service';

@Component({
  selector: 'app-player-statistics',
  templateUrl: './player-statistics.component.html',
  styleUrls: ['./player-statistics.component.css']
})
export class PlayerStatisticsComponent extends BaseComponent implements OnInit {

  /** are players loaded */
  playersLoaded: boolean = false;

  /** filtered list of players for searching */
  filteredPlayers: KTCPlayer[];

  /** position group filters, [qb, rb, wr/te] */
  posGroup: {value: string, displayName: string}[] = [{value: 'qb', displayName: 'Quarterbacks'},
    {value: 'rb', displayName: 'Running Backs'}, {value: 'wr/te', displayName: 'Wide Receivers & Tight Ends'},
    {value: 'wr', displayName: 'Wide Receivers'}, {value: 'te', displayName: 'Tight Ends'}];

  /** selected position from dropdown */
  selectedPosition: string;

  /** search value from search box */
  searchVal: string;

  constructor(public playerService: PlayerService, public configService: ConfigService, private sleeperService: SleeperService) {
    super();
  }

  ngOnInit(): void {
    this.playersLoaded = (this.playerService.playerValues.length > 0);
    this.selectedPosition = 'qb';
    if (this.playerService) {
      this.updatePlayerFilters();
    }
    this.playerService.loadPlayerValuesForToday();
    this.addSubscriptions(this.playerService.$currentPlayerValuesLoaded.subscribe(() => {
      this.playersLoaded = true;
      this.updatePlayerFilters();
    }));
  }

  /**
   * update player filters, function is called when option is selected
   */
  updatePlayerFilters(): void {
    this.filteredPlayers = this.playerService.playerValues.slice(0);
    this.filteredPlayers = this.filteredPlayers.filter(player => {
      return this.selectedPosition.includes(player.position.toLowerCase());
    });
    if (this.searchVal && this.searchVal.length > 0) {
      this.filteredPlayers = this.filteredPlayers.filter(player => {
        return (player.full_name.toLowerCase().indexOf(this.searchVal.toLowerCase()) >= 0
          || player.age?.toString().indexOf(this.searchVal) >= 0
          || ((player.owner?.ownerName.toLowerCase().indexOf(this.searchVal.toLowerCase()) >= 0)
            && this.sleeperService.selectedLeague));
      });
    }
  }

  /**
   * handles when position categories are changed
   * @param event from select
   */
  updatePositionTable(event: any): void {
    this.selectedPosition = event.value;
    this.updatePlayerFilters();
  }
}
