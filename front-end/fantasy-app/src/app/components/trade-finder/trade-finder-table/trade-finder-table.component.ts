import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {PlayerService} from '../../../services/player.service';
import {MatTableDataSource} from '@angular/material/table';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {TradeFinderService} from '../../services/trade-finder.service';

@Component({
  selector: 'app-trade-finder-table',
  templateUrl: './trade-finder-table.component.html',
  styleUrls: ['./trade-finder-table.component.css']
})
export class TradeFinderTableComponent implements OnInit, OnChanges {

  @Input()
  assets: KTCPlayer[];

  // columns to display in table
  columnsToDisplay = ['select', 'playerName', 'value'];

  // datasource for mat table
  dataSource: MatTableDataSource<KTCPlayer> = new MatTableDataSource<KTCPlayer>();

  constructor(public playerService: PlayerService,
              private tradeFinderService: TradeFinderService) {
  }

  ngOnInit(): void {
    this.dataSource.data = this.assets;
  }

  ngOnChanges(): void {
    this.dataSource.data = this.assets;
  }

  /**
   * handle check box action
   * @param event checkbox event
   * @param asset player to add/remove
   * @param index index of player
   */
  addAssetToTrade(event: any, asset: KTCPlayer, index: number): void {
    if (event.checked) {
      this.tradeFinderService.selectedPlayers.push(asset);
    } else {
      const removeIndex = this.tradeFinderService.selectedPlayers.map(item => item.name_id).indexOf(asset.name_id);
      if (removeIndex >= 0) {
        this.tradeFinderService.selectedPlayers.splice(removeIndex, 1);
      }
    }
  }
}
