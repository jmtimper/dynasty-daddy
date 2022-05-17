import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TeamPowerRanking} from '../../model/powerRankings';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {KTCPlayer} from '../../../model/KTCPlayer';
import {SleeperService} from '../../../services/sleeper.service';
import {ConfigService} from '../../../services/init/config.service';
import {PlayerService} from '../../../services/player.service';
import {Clipboard} from '@angular/cdk/clipboard';

// details animation
export const detailExpand = trigger('detailExpand',
  [
    state('collapsed, void', style({height: '0px'})),
    state('expanded', style({height: '*'})),
    transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);

@Component({
  selector: 'app-power-rankings-table',
  templateUrl: './power-rankings-table.component.html',
  styleUrls: ['./power-rankings-table.component.css'],
  animations: [detailExpand],
})
export class PowerRankingsTableComponent implements OnInit, OnChanges {

  // team power rankings generated from service
  @Input()
  powerRankings: TeamPowerRanking[];

  // is league superflex, input
  @Input()
  isSuperFlex: boolean;

  // datasource for mat table
  dataSource: MatTableDataSource<TeamPowerRanking> = new MatTableDataSource<TeamPowerRanking>();

  // columns to display in table
  columnsToDisplay = ['team', 'owner', 'overallRank', 'starterRank', 'qbRank', 'rbRank', 'wrRank', 'teRank', 'draftRank'];

  // list of expanded details for teams.
  expandedElement: any[] = [];

  // determines if team is top 3rd or bottom 3rd of league
  alertThreshold: number;

  // mat sort element
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  // search name
  searchVal: string = '';

  // used to keep track of the displayed teams in table
  displayedRankingsSize: number;

  constructor(public sleeperService: SleeperService,
              public configService: ConfigService,
              public playerService: PlayerService,
              private clipboard: Clipboard) {
  }

  ngOnInit(): void {
    this.alertThreshold = this.powerRankings.length / 3;
    this.createNewTableDataSource(this.powerRankings);
  }

  ngOnChanges(): void {
    this.dataSource.data = this.powerRankings;
  }

  /**
   * checks if list is expanded or not
   * @param element team power ranking
   * returns true of expanded
   */
  checkExpanded(element: TeamPowerRanking): boolean {
    let flag = false;
    this.expandedElement.forEach(e => {
      if (e === element) {
        flag = true;
      }
    });
    return flag;
  }

  /**
   * handles when row is clicked
   * @param element team row that was clicked
   */
  pushPopElement(element: TeamPowerRanking): void {
    const index = this.expandedElement.indexOf(element);
    if (index === -1) {
      this.expandedElement.push(element);
    } else {
      this.expandedElement.splice(index, 1);
    }
  }

  /**
   * expands all power rankings details
   */
  expandCollapseAll(): void {
    this.dataSource.data = this.powerRankings;
    if (this.expandedElement.length !== this.powerRankings.length) {
      this.expandedElement = this.powerRankings.slice();
    } else {
      this.expandedElement = [];
    }
  }

  /**
   * is player one of the teams starters?
   * @param team team power ranking
   * @param player player to check
   * returns true if player is starter on team
   */
  isStarter(team: TeamPowerRanking, player: KTCPlayer): boolean {
    return team.starters.includes(player);
  }

  /**
   * is player injured
   * @param player player to check
   * returns true if player is injured
   */
  isInjured(player: KTCPlayer): boolean {
    const injuries = ['PUP', 'IR', 'Sus', 'COV'];
    return injuries.includes(player.injury_status);
  }

  /**
   * copies starters to clipboard
   * @param rosterId team id
   */
  copyStartersFromTeam(team: TeamPowerRanking): void {
    const starterStrings = 'Team\n' +
      `QB: ${this.getListOfPlayerNames('qb', team.starters)}\n` +
      `RB: ${this.getListOfPlayerNames('rb', team.starters)}\n` +
      `WR: ${this.getListOfPlayerNames('wr', team.starters)}\n` +
      `TE: ${this.getListOfPlayerNames('te', team.starters)} `;
    this.clipboard.copy(starterStrings);
  }

  /**
   * copies whole team to clipboard
   * @param rosterId team id
   */
  copyWholeFromTeam(team: TeamPowerRanking): void {
    const allPlayersRoster = 'Team\n' +
      `QB: ${this.getListOfPlayerNames('qb', team.roster[0].players)}\n` +
      `RB: ${this.getListOfPlayerNames('rb', team.roster[1].players)}\n` +
      `WR: ${this.getListOfPlayerNames('wr', team.roster[2].players)}\n` +
      `TE: ${this.getListOfPlayerNames('te', team.roster[3].players)} `;
    this.clipboard.copy(allPlayersRoster);
  }


  /**
   * get list of players by position
   * @param pos string
   * @param players list of players
   * @private
   */
  private getListOfPlayerNames(pos: string, players: KTCPlayer[]): string {
    const filteredPlayers = [];
    players.map(player => {
      if (player.position.toLowerCase() === pos.toLowerCase()) {
        filteredPlayers.push(player.full_name);
      }
    });
    return filteredPlayers.toString();
  }

  /**
   * expand all rows for searching
   */
  searchFilterPowerRankings(): void {
    const allTeams = this.powerRankings.slice();
    const filteredRows: TeamPowerRanking[] = [];
    allTeams.map(team => {
        // if match add to list bool
        let addToTable = false;
        // loop thru team rosters and match names
        team.roster.map(roster =>
          roster.players.map(player => {
            if (player.full_name.toLowerCase().includes(this.searchVal.toLowerCase())) {
              addToTable = true;
            }
          })
        );
        // do owner and team name match
        if (
          team.team.owner.ownerName.toLowerCase().includes(this.searchVal.toLowerCase())
          || team.team.owner.teamName.toLowerCase().includes(this.searchVal.toLowerCase())
        ) {
          addToTable = true;
        }
        // add team to filtered list
        if (addToTable) {
          filteredRows.push(team);
        }
      }
    );
    // update table with filtered results
    this.createNewTableDataSource(filteredRows);
    this.expandedElement = filteredRows;
  }

  /**
   * helper function to generate new table based on input field
   * needed to have sorting across searches and default view
   * @param powerRankings
   * @private
   */
  private createNewTableDataSource(powerRankings: TeamPowerRanking[]): void {
    this.displayedRankingsSize = powerRankings.length;
    this.dataSource = new MatTableDataSource<TeamPowerRanking>(powerRankings);

    // sorting algorithm
    this.dataSource.sortingDataAccessor = (item, property) => {
      if (property === 'team') {
        return item.team.owner?.teamName;
      } else if (property === 'owner') {
        return item.team.owner?.ownerName;
      } else if (property === 'qbRank') {
        return item.roster[0].rank;
      } else if (property === 'rbRank') {
        return item.roster[1].rank;
      } else if (property === 'wrRank') {
        return item.roster[2].rank;
      } else if (property === 'teRank') {
        return item.roster[3].rank;
      } else if (property === 'draftRank') {
        return item.picks.rank;
      } else {
        return item[property];
      }
    };
    this.dataSource.sort = this.sort;
  }

  /**
   * returns toggle button text based on state of page
   */
  getToggleButtonText(): string {
    if (this.searchVal.length > 0 && this.expandedElement.length !== this.powerRankings.length) {
      return 'Show All';
    } else if (this.expandedElement.length === this.powerRankings.length) {
      return 'Collapse All';
    } else {
      return 'Expand All';
    }
  }

  /**
   * reset search filter and table
   */
  resetSearchFilter(): void {
    this.searchVal = '';
    this.createNewTableDataSource(this.powerRankings);
  }
}
