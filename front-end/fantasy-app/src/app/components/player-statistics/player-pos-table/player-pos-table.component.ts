import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {SleeperService} from '../../../services/sleeper.service';
import {ConfigService} from '../../../services/init/config.service';
import {PlayerService} from '../../../services/player.service';
import {PlayerComparisonService} from '../../services/player-comparison.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-player-pos-table',
  templateUrl: './player-pos-table.component.html',
  styleUrls: ['./player-pos-table.component.css']
})
export class PlayerPosTableComponent implements OnInit {

  /** all players */
  @Input()
  players: KTCPlayer[];

  /** mat paginator */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  /** mat sort */
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  /** filtered list of players for searching */
  filteredPlayers: KTCPlayer[];

  /** position group filters, [qb, rb, wr/te] */
  posGroup: {value: string, displayName: string}[] = [{value: 'qb', displayName: 'Quarterbacks'},
    {value: 'rb', displayName: 'Running Backs'}, {value: 'wr/te', displayName: 'Wide Receivers & Tight Ends'}];

  /** columns to display */
  displayedColumns: string[] = [];

  /** general box score cols */
  generalBoxScore = ['full_name', 'points'];

  /** passing box score */
  passingBoxScore = ['pass_att', 'pass_cmp', 'cmp_pct', 'pass_yd', 'pass_td', 'pass_int', 'pass_rz_att'];

  /** rushing box score */
  rushingBoxScore = ['rush_att', 'rush_yd', 'rush_ypa', 'rush_td'];

  /** sack box score */
  sackBoxScore = ['pass_sack'];

  /** turnover box score */
  turnoverBoxScore = ['fum_lost'];

  /** receiving Box score */
  receivingBoxScore = ['rec', 'rec_tgt', 'rec_yd', 'rec_ypr', 'rec_td', 'rec_rz_tgt'];

  /** is superflex or normal value */
  isSuperFlex: boolean;

  /** mat table datasource */
  dataSource: MatTableDataSource<KTCPlayer> = new MatTableDataSource<KTCPlayer>();

  /** show free agents, only show if league is loaded */
  showFreeAgents: boolean = false;

  /** selected position from dropdown */
  selectedPosition: string = 'qb';

  /** search value from search box */
  searchVal: string;

  constructor(public sleeperService: SleeperService,
              public configService: ConfigService,
              public playerService: PlayerService,
              private playerComparisonService: PlayerComparisonService,
              public router: Router
  ) { }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource(this.filteredPlayers);
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'points':
          return this.playerService.playerStats[item.sleeper_id]?.pts_half_ppr;
        case 'sf_trade_value':
          return this.playerService.playerValueAnalysis[item.name_id].sf_trade_value;
        case 'trade_value':
          return this.playerService.playerValueAnalysis[item.name_id].trade_value;
        case 'full_name':
          return item.full_name;
        default:
          return this.selectedPosition.includes(item.position.toLowerCase())
            ? this.playerService.playerStats[item.sleeper_id]?.[property] : 0;
      }
    };
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.updatePlayerFilters();
  }


  /**
   * update player filters, function is called when option is selected
   */
  updatePlayerFilters(): void {
    this.filteredPlayers = this.players.slice(0);
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
    this.paginator.pageIndex = 0;
    this.setDisplayColumns();
    this.dataSource.data = this.filteredPlayers;
  }

  /**
   * route ot player comparison page
   * @param element player to add to comparison
   */
  openPlayerComparison(element: KTCPlayer): void {
    this.playerComparisonService.addPlayerToCharts(element);
    this.router.navigateByUrl('players/comparison');
  }

  /**
   * handles when position categories are changed
   * @param event from select
   */
  updatePositionTable(event: any): void {
    this.selectedPosition = event.value;
    this.updatePlayerFilters();
  }

  /**
   * set display column order based on player position
   * @private
   */
  private setDisplayColumns(): void {
    this.displayedColumns = [];
    switch (this.selectedPosition) {
      case 'qb':
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.passingBoxScore,
          this.sackBoxScore,
          this.turnoverBoxScore,
          ['actions']
        );
        break;
      case 'rb':
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.rushingBoxScore,
          this.receivingBoxScore,
          this.turnoverBoxScore,
          ['actions']
        );
        break;
      case 'wr/te':
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.receivingBoxScore,
          this.turnoverBoxScore,
          ['actions']
        );
        break;
      default:
        this.displayedColumns = this.displayedColumns.concat(
          this.generalBoxScore,
          this.receivingBoxScore,
          this.turnoverBoxScore
        );
    }
  }
}
