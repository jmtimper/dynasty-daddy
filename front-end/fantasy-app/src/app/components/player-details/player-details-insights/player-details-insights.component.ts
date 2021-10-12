import {Component, Input, OnInit} from '@angular/core';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {PlayerService} from '../../../services/player.service';
import {SleeperService} from '../../../services/sleeper.service';
import {PlayerInsights} from '../../model/playerInsights';

@Component({
  selector: 'app-player-details-insights',
  templateUrl: './player-details-insights.component.html',
  styleUrls: ['./player-details-insights.component.css']
})
export class PlayerDetailsInsightsComponent implements OnInit {

  /** selected player info */
  @Input()
  selectedPlayer: KTCPlayer;

  /** selected player insights */
  @Input()
  selectedPlayerInsights: PlayerInsights;

  /** list of adjacent players overall */
  overallAdjPlayers: KTCPlayer[];

  /** list of adjacent players based on position */
  positionAdjPlayers: KTCPlayer[];

  /** display columns */
  displayedColumns: string[] = ['rank', 'name', 'value'];

  constructor(public playerService: PlayerService, public sleeperService: SleeperService) {
  }

  ngOnInit(): void {
    this.overallAdjPlayers = this.playerService.getAdjacentPlayersByNameId(
      this.selectedPlayer.name_id,  '', this.sleeperService.selectedLeague?.isSuperflex);
    this.positionAdjPlayers = this.playerService.getAdjacentPlayersByNameId(
      this.selectedPlayer.name_id, this.selectedPlayer.position, this.sleeperService.selectedLeague?.isSuperflex);
  }

}
