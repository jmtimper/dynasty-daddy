import {Injectable} from '@angular/core';
import {KTCPlayer, KTCPlayerDataPoint} from '../../model/KTCPlayer';
import {forkJoin, Observable, of, Subject} from 'rxjs';
import {PlayerComparison} from '../model/playerComparison';
import {ChartDataSets} from 'chart.js';
import {Label} from 'ng2-charts';
import {KTCApiService} from '../../services/api/ktc-api.service';
import {NgxSpinnerService} from 'ngx-spinner';
import {PlayerService} from '../../services/player.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerComparisonService {

  /** selected players to add to table */
  selectedPlayers: PlayerComparison[] = [];

  /** group2 selected player for group comparisons */
  group2SelectedPlayers: PlayerComparison[] = [];

  /** line chart data */
  public lineChartData: ChartDataSets[] = [];

  /** line chart labels */
  public lineChartLabels: Label[] = [];

  /** is league superflex, defaults to true */
  isSuperFlex = true;

  /** should api request fetch all time data instead of 6 months */
  isAllTime = false;

  /** when a player is added/removed */
  $updatePlayer: Subject<PlayerComparison> = new Subject<PlayerComparison>();

  /** is player mode or group mode */
  isGroupMode = false;

  /** query object with query configuration */
  query = {
    condition: 'and',
    rules: [
      {field: 'position', operator: '=', value: 'QB'},
    ]
  };

  /** query return limit */
  limit: number = 5;

  /** query selected aggregate */
  selectedAggregate: string = 'sf_trade_value';

  /** is query desc or asc */
  isOrderByDesc: boolean = true;

  constructor(
    private ktcApiService: KTCApiService,
    private spinner: NgxSpinnerService,
    private playerService: PlayerService
  ) {
  }

  regeneratePlayerCompData(): Observable<any> {
    const playersToUpdate = [];
    this.selectedPlayers.map(player => {
      playersToUpdate.push(this.playerService.getPlayerByNameId(player.id));
    });
    this.group2SelectedPlayers.map(player => {
      playersToUpdate.push(this.playerService.getPlayerByNameId(player.id));
    });
    this.selectedPlayers = [];
    // create list of players in group 2
    const group2Players = [];
    this.group2SelectedPlayers.map(g2Player => {
      group2Players.push(g2Player.id);
    });
    this.group2SelectedPlayers = [];
    return of(forkJoin(playersToUpdate.map(player => {
      this.ktcApiService.getHistoricalPlayerValueById(player.name_id, this.isAllTime).subscribe((data) => {
        this.addNewPlayer(data, player, group2Players.includes(player.name_id));
        }
      );
    }))).pipe(() => {
      return of(true);
    });
  }

  /**
   * handles adding data to list
   * @param player
   * @private
   * TODO clean up redundant code
   */
  private addNewPlayer(player: KTCPlayerDataPoint[], defaultPlayer: KTCPlayer, isGroup2: boolean = false): void {
    if (this.lineChartData[0]?.data.length === 0) {
      this.lineChartData.splice(0, 1);
    }
    if (!this.isGroupMode) {
      const data = [];
      for (const dataPoint of player) {
        if (this.lineChartLabels.includes(dataPoint.date?.slice(0, 10))) {
          const index = this.lineChartLabels.indexOf(dataPoint.date.slice(0, 10));
          data[index] = this.isSuperFlex ? dataPoint.sf_trade_value : dataPoint.trade_value;
        }
      }
      if (player[0]) { this.lineChartData.push({data, label: player[0].full_name }); }
      this.selectedPlayers.push({name: defaultPlayer.full_name, id: defaultPlayer.name_id, data: player} as PlayerComparison);
      this.$updatePlayer.next({name: defaultPlayer.full_name, id: defaultPlayer.name_id, data: player} as PlayerComparison);
    } else {
      this.lineChartData = [];
      if (isGroup2){
        this.group2SelectedPlayers.push({name: defaultPlayer.full_name, id: defaultPlayer.name_id, data: player} as PlayerComparison);
      } else {
        this.selectedPlayers.push({name: defaultPlayer.full_name, id: defaultPlayer.name_id, data: player} as PlayerComparison);
      }
      this.lineChartData.push({data: this.calculateGroupValue(this.selectedPlayers),
        label: `Group 1 (${this.selectedPlayers.length} Players)`});
      this.lineChartData.push({data: this.calculateGroupValue(this.group2SelectedPlayers),
        label: `Group 2 (${this.group2SelectedPlayers.length} Players)`});
    }

  }

  /**
   * refreshes table
   */
  refreshTable(): void {
    this.lineChartData = [];
    if (!this.isGroupMode) {
      for (const player of this.selectedPlayers) {
        const data = [];
        for (const dataPoint of player.data) {
          if (this.lineChartLabels.includes(dataPoint.date.slice(0, 10))) {
            const index = this.lineChartLabels.indexOf(dataPoint.date.slice(0, 10));
            data[index] = this.isSuperFlex ? dataPoint.sf_trade_value : dataPoint.trade_value;
          }
        }
        // dont update selected player data cause it's the source of truth
        this.lineChartData.push({data, label: player.name});
      }
    } else {
      this.lineChartData.push({data: this.calculateGroupValue(this.selectedPlayers),
        label: `Group 1 (${this.selectedPlayers.length} Players)`});
      this.lineChartData.push({data: this.calculateGroupValue(this.group2SelectedPlayers),
        label: `Group 2 (${this.group2SelectedPlayers.length} Players)`});
    }

    this.$updatePlayer.next();
  }

  /**
   * calculates aggregated player values
   * @param players
   * @private
   */
  private calculateGroupValue(players: PlayerComparison[]): number[] {
    const data = [];
    for (const player of players) {
      for (const dataPoint of player.data) {
        if (this.lineChartLabels.includes(dataPoint.date.slice(0, 10))) {
          const index = this.lineChartLabels.indexOf(dataPoint.date.slice(0, 10));
          if (!data[index]) {
            data[index] = 0;
          }
          data[index] += this.isSuperFlex ? dataPoint.sf_trade_value : dataPoint.trade_value;
        }
      }
    }
    return data;
  }

  /**
   * removed selected player from graph
   * @param player
   */
  onRemove(player: PlayerComparison, isGroup2: boolean = false): void {
    if (this.isGroupMode) {
        if (isGroup2) {
          this.group2SelectedPlayers = this.group2SelectedPlayers.filter(p => {
            return p.id !== player.id;
          });
        } else {
          this.selectedPlayers = this.selectedPlayers.filter(p => {
            return p.id !== player.id;
          });
        }
        this.refreshTable();
    } else {
        this.selectedPlayers = this.selectedPlayers.filter(p => {
          return p.id !== player.id;
        });
        this.lineChartData = this.lineChartData.filter(p => {
          return p.label !== player.name;
        });
        this.$updatePlayer.next();
      }
  }

  /**
   * add player to chart, fetches data from db
   * @param player
   */
  addPlayerToCharts(player: KTCPlayer, isGroup2: boolean = false): void {
    this.ktcApiService.getHistoricalPlayerValueById(player.name_id, this.isAllTime).subscribe((data) => {
        !this.isGroupMode ? this.addNewPlayer(data, player) : this.addNewPlayer(data, player, isGroup2);
      }
    );
  }

  /**
   * handles toggle group mode
   */
  toggleGroupMode(): void {
    if (!this.isGroupMode){
      if (this.selectedPlayers.length === 0) {
        this.selectedPlayers = this.group2SelectedPlayers.slice();
      }
    }
    this.refreshTable();
  }
}
