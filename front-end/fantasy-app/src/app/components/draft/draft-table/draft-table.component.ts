import {AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {TeamMockDraftPick} from '../../model/mockDraft';
import {MockDraftService} from '../../services/mock-draft.service';
import {SleeperService} from '../../../services/sleeper.service';

@Component({
  selector: 'app-draft-table',
  templateUrl: './draft-table.component.html',
  styleUrls: ['./draft-table.component.css']
})
export class DraftTableComponent implements OnInit, OnChanges, AfterViewInit {

  /**
   * change detection when new group is toggled
   */
  @Input()
  mockDraftConfig: string;

  /**
   * toggle for when data is changed externally
   */
  @Input()
  isReset: boolean;

  /** display columns */
  displayedColumns: string[] = [];

  /** currently selected players */
  selectedPlayers: KTCPlayer[] = [];

  /** page length set to size of league */
  pageLength: number = 12;

  /** mat paginator */
  @ViewChild(MatPaginator) paginator: MatPaginator;

  /** mat datasource */
  dataSource: MatTableDataSource<TeamMockDraftPick> = new MatTableDataSource<TeamMockDraftPick>();

  constructor(public mockDraftService: MockDraftService,
              public sleeperService: SleeperService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initializeMockDraft();
  }

  initializeMockDraft(): void {
    this.displayedColumns = ['pickNumber', 'team', 'owner', 'projectedPlayer'];
    this.pageLength = this.sleeperService.selectedLeague.totalRosters;
    this.dataSource = new MatTableDataSource(this.mockDraftService.teamPicks);
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(): void {
    this.initializeMockDraft();
    if (this.mockDraftService.mockDraftConfig !== 'custom') {
      this.selectedPlayers = this.mockDraftService.valueSelectedPlayers.slice();
    } else {
      this.selectedPlayers = this.mockDraftService.customSelectedPlayers.slice();
    }
  }


  /**
   * updates draft dropdown to show for player value mode
   * @param pick number
   */
  updateDraftSelections(pick: number): void {
    this.selectedPlayers = this.generateNewDraftOrder(
      pick,
      this.mockDraftService.mockDraftConfig === 'player' ? this.mockDraftService.selectablePlayers : this.selectedPlayers.slice(pick)
    );
    if (this.mockDraftService.mockDraftConfig === 'player') {
      this.mockDraftService.valueSelectedPlayers = this.selectedPlayers.slice();
    } else {
      this.mockDraftService.customSelectedPlayers = this.selectedPlayers.slice();
    }
  }

  /**
   * returns a list of players by draft criteria
   * @param pick modified pick number
   * @param selectedDraft selected players
   */
  private generateNewDraftOrder(pick: number, selectedDraft: KTCPlayer[]): KTCPlayer[] {
    const staticPicks = this.selectedPlayers.slice(0, pick);
    const newDropDown = [];
    for (const player of selectedDraft) {
      if (!staticPicks.some(picked => picked?.name_id === player?.name_id)) {
        newDropDown.push(player);
      } else if (this.mockDraftService.mockDraftConfig === 'custom') {
        newDropDown.push(null);
      }
    }
    return staticPicks.concat(newDropDown);
  }

  /**
   * disable player in custom mode dropdown if already selected
   * @param player player data
   */
  isPlayerAlreadySelected(player: KTCPlayer, players: KTCPlayer[]): boolean {
    return players.some(picked => picked?.name_id === player?.name_id);
  }
}
