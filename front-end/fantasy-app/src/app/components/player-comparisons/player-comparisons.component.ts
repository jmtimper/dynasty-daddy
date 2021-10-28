import {Component, OnInit} from '@angular/core';
import {KTCApiService} from '../../services/api/ktc-api.service';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {MatDialog} from '@angular/material/dialog';
import {AddPlayerComparisonModalComponent} from '../modals/add-player-comparison-modal/add-player-comparison-modal.component';
import {PlayerComparisonService} from '../services/player-comparison.service';
import {SleeperService} from '../../services/sleeper.service';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import {ConfigService} from '../../services/init/config.service';

@Component({
  selector: 'app-player-comparisons',
  templateUrl: './player-comparisons.component.html',
  styleUrls: ['./player-comparisons.component.css']
})
export class PlayerComparisonsComponent extends BaseComponent implements OnInit {

  constructor(private ktcApiService: KTCApiService,
              private playerService: PlayerService,
              private sleeperService: SleeperService,
              private dialog: MatDialog,
              public playerComparisonService: PlayerComparisonService,
              public configService: ConfigService) {
    super();
  }

  ngOnInit(): void {
    if (this.sleeperService.leagueLoaded) {
      this.playerComparisonService.isSuperFlex = this.sleeperService.selectedLeague.isSuperflex;
    }
    this.playerService.loadPlayerValuesForToday();
    this.addSubscriptions(this.playerService.$currentPlayerValuesLoaded.subscribe(() => {
      if (this.playerComparisonService.lineChartData.length === 1
        && this.playerComparisonService.selectedPlayers[0] === undefined) {
        this.resetPlayerCompPlayers();
      }
    }));
    if (this.playerComparisonService.selectedPlayers.length === 0 && this.playerService.playerValues.length > 0) {
      this.resetPlayerCompPlayers();
    }
  }

  /**
   * selects random player to add to list
   * @param stars if true choose top 50 valuable player
   * @private
   * returns player number
   */
  private getRandomPlayer(stars: boolean = false): number {
    return Math.floor(Math.random() * (stars ? 50 : this.playerService.playerValues.length - 1)) + 1;
  }

  /**
   * adds random player to list
   */
  addRandomPlayer(): void {
    this.playerComparisonService.addPlayerToCharts(this.playerService.playerValues[this.getRandomPlayer()]);
    if (this.playerComparisonService.isGroupMode) {
      this.playerComparisonService.addPlayerToCharts(this.playerService.playerValues[this.getRandomPlayer()], true);
    }
  }

  /**
   * launches add new player modal
   * @param isGroup2 is group mode enabled
   */
  addNewPlayerModal(isGroup2: boolean = false): void {
    this.dialog.open(AddPlayerComparisonModalComponent, {
      height: '700px',
      width: '800px',
      data: {
        isGroup2,
      }
    });
  }

  /**
   * reorder players from drag and drop
   * @param event
   */
  drop(event: any): void {
    if (event.previousIndex !== event.currentIndex && !this.playerComparisonService.isGroupMode) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.playerComparisonService.refreshTable();
    }
  }

  /**
   * resets data in play comp table
   */
  resetPlayerComp(): void {
    this.playerComparisonService.selectedPlayers = [];
    this.playerComparisonService.group2SelectedPlayers = [];
    this.playerComparisonService.refreshTable();
    this.resetPlayerCompPlayers();
  }

  /**
   * helper function to reset players in player comparison table
   * @private
   */
  private resetPlayerCompPlayers(): void {
    const playerNum = this.getRandomPlayer(true);
    this.playerComparisonService.addPlayerToCharts(this.playerService.playerValues[playerNum]);
    this.playerComparisonService.addPlayerToCharts(this.playerService.playerValues[playerNum + 1]);
  }
}
