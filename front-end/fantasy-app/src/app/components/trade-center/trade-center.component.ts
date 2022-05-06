import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TradeService} from '../services/trade-tool.service.ts.service';
import {TradePackage} from '../model/tradePackage';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {FormControl} from '@angular/forms';
import {ReplaySubject, Subject} from 'rxjs';
import {MatSelect} from '@angular/material/select';
import {KTCPlayer} from '../../model/KTCPlayer';
import {take, takeUntil} from 'rxjs/operators';
import {ConfigService} from '../../services/init/config.service';
import {SleeperService} from '../../services/sleeper.service';
import {PowerRankingsService} from '../services/power-rankings.service';
import {TeamPowerRanking} from '../model/powerRankings';
import {PlayerComparisonService} from '../services/player-comparison.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-trade-center',
  templateUrl: './trade-center.component.html',
  styleUrls: ['./trade-center.component.css']
})
export class TradeCenterComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {

  /** list of players */
  protected players: KTCPlayer[] = [];

  /** control for the selected player */
  public playerCtrl: FormControl = new FormControl();

  /** control for the MatSelect filter keyword */
  public playerFilterCtrl: FormControl = new FormControl();

  /** list of players filtered by search keyword */
  public filteredTeam1Players: ReplaySubject<KTCPlayer[]> = new ReplaySubject<KTCPlayer[]>(1);

  /** control for the selected player */
  public player2Ctrl: FormControl = new FormControl();

  /** control for the MatSelect filter keyword */
  public player2FilterCtrl: FormControl = new FormControl();

  /** list of players filtered by search keyword */
  public filteredTeam2Players: ReplaySubject<KTCPlayer[]> = new ReplaySubject<KTCPlayer[]>(1);

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  /** list of players from trade */
  public team1PlayerList: KTCPlayer[] = [];

  /** list of player for team 2 */
  public team2PlayerList: KTCPlayer[] = [];

  /** is super flex toggle for trade package */
  public isSuperFlex: boolean;

  /** hide/show the advance trade calculator settings */
  public toggleAdvancedSettings: boolean = false;

  /** acceptance variant number */
  public acceptanceVariance: number;

  /** player rankings object for team 1 */
  public team1Rankings: TeamPowerRanking;

  /** player rankings object for team 2 */
  public team2Rankings: TeamPowerRanking;

  /** manually selected team 1 user id */
  public selectedTeam1: string = null;

  /** manually selected team 2 user id */
  public selectedTeam2: string = null;

  @ViewChild('singleSelect', {static: true}) singleSelect: MatSelect;

  @ViewChild('singleSelect2', {static: true}) singleSelect2: MatSelect;

  constructor(
    public tradeTool: TradeService,
    public playerService: PlayerService,
    public configService: ConfigService,
    public sleeperService: SleeperService,
    public powerRankingsService: PowerRankingsService,
    public playerComparisonService: PlayerComparisonService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    if (this.playerService.playerValues.length === 0) {
      this.playerService.loadPlayerValuesForToday();
    } else {
      this.initializeTradeCalculator();
    }
    this.addSubscriptions(this.playerService.$currentPlayerValuesLoaded.subscribe(() => {
      this.initializeTradeCalculator();
    }));
  }

  /**
   * initialization code for trade calculator
   */
  initializeTradeCalculator(): void {
    this.team1PlayerList = this.tradeTool.tradePackage?.team1Assets || [];
    this.team2PlayerList = this.tradeTool.tradePackage?.team2Assets || [];
    // weird issue with setting || true for is superflex
    if (this.tradeTool.tradePackage) {
      this.isSuperFlex = this.tradeTool.tradePackage?.isSuperFlex;
    } else {
      this.isSuperFlex = this.sleeperService.selectedLeague?.isSuperflex || true;
    }
    this.acceptanceVariance = this.tradeTool.tradePackage?.acceptanceVariance || 5;

    // set initial selection
    this.playerCtrl.setValue(this.playerService.playerValues[10]);
    this.player2Ctrl.setValue(this.playerService.playerValues[10]);

    this.players = this.playerService.playerValues.slice();

    // if logged in set initial user id to team 2 user id
    if (this.sleeperService.selectedLeague &&
      this.sleeperService.sleeperUser &&
      this.team1PlayerList.length === 0 &&
      this.team2PlayerList.length === 0) {
      this.selectedTeam2 = this.sleeperService.sleeperUser?.userData?.user_id;
      this.team2Rankings = this.powerRankingsService.findTeamFromRankingsByUserId(this.selectedTeam2);
    }

    // generate new trade object (this is to catch if a league member logged in mid trade)
    this.processTrade();
    // load the initial player list
    this.filteredTeam1Players.next(this.tradeTool.filterPlayersList(this.tradeTool.tradePackage?.team1UserId).slice(0, 10));
    this.filteredTeam2Players.next(this.tradeTool.filterPlayersList(this.tradeTool.tradePackage?.team2UserId).slice(0, 10));

    // listen for search field value changes
    this.playerFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterTeamPlayers(this.playerFilterCtrl, this.tradeTool.tradePackage?.team1UserId, this.filteredTeam1Players);
      });

    this.player2FilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterTeamPlayers(this.player2FilterCtrl, this.tradeTool.tradePackage?.team2UserId, this.filteredTeam2Players);
      });
  }

  ngAfterViewInit(): void {
    this.setInitialValue();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  /**
   * Sets the initial value after the filteredPlayers are loaded initially
   */
  protected setInitialValue(): any {
    this.initializeSubscriptions(this.singleSelect, this.filteredTeam1Players);
    this.initializeSubscriptions(this.singleSelect2, this.filteredTeam2Players);
  }

  /**
   * initialize selection filter subscriptions for mat search dropdowns
   * @param selectObject Mat select
   * @param filterSubscription replay subject
   * @private
   */
  private initializeSubscriptions(selectObject: MatSelect, filterSubscription: ReplaySubject<KTCPlayer[]>): void {
    filterSubscription
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        selectObject.compareWith = (a: KTCPlayer, b: KTCPlayer) => a && b && a.name_id === b.name_id;
      });
  }

  /**
   * filter players for selected dropdown
   * @protected
   */
  protected filterTeamPlayers(filterCtrl: FormControl, userId: string, filterSubscription: ReplaySubject<KTCPlayer[]>): any {
    if (!this.players) {
      return;
    }
    // get the search keyword
    let search = filterCtrl.value;
    if (!search) {
      filterSubscription.next(this.tradeTool.filterPlayersList(userId).slice(0, 10));
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the players
    filterSubscription.next(
      this.tradeTool.filterPlayersList(userId)
        .filter(player => ((player.full_name.toLowerCase().indexOf(search) > -1
          || player.owner?.ownerName.toLowerCase().indexOf(search) > -1
          || player.position.toLowerCase().indexOf(search) > -1))).slice(0, 10));
  }

  /**
   * process trade and updated trade package
   */
  processTrade(): void {
    const player1 = this.team1PlayerList.slice();
    const player2 = this.team2PlayerList.slice();
    const trade = new TradePackage(
      player1,
      player2,
      this.acceptanceVariance
    );
    if (this.sleeperService.selectedLeague) {
      trade.team1UserId = this.selectedTeam1 || this.tradeTool.tradePackage?.team1UserId;
      trade.team2UserId = this.selectedTeam2 || this.tradeTool.tradePackage?.team2UserId;
      // set player if null
      if (!trade.team1UserId && player1.length === 1) {
        trade.team1UserId = player1[0]?.owner?.userId || null;
      }
      if (!trade.team2UserId && player2.length === 1) {
        trade.team2UserId = player2[0]?.owner?.userId || null;
      }
      if (player1.length === 0 && this.selectedTeam1 !== this.team1Rankings?.team?.owner.userId) {
        trade.team1UserId = null;
        this.team1Rankings = null;
      }
      if (player2.length === 0 && this.selectedTeam2 !== this.team2Rankings?.team?.owner.userId) {
        trade.team2UserId = null;
        this.team2Rankings = null;
      }
    }
    this.tradeTool.tradePackage = this.tradeTool.determineTrade(trade, this.isSuperFlex);
    this.refreshDisplay();
  }

  /**
   * refreshes the power rankings and search filters when updating a trade
   * @private
   */
  private refreshDisplay(): void {
    // set team needs value
    if (this.tradeTool.tradePackage?.team1UserId && !this.team1Rankings) {
      this.team1Rankings = this.powerRankingsService.findTeamFromRankingsByUserId(this.tradeTool.tradePackage.team1UserId);
    }
    if (this.tradeTool.tradePackage?.team2UserId && !this.team2Rankings) {
      this.team2Rankings = this.powerRankingsService.findTeamFromRankingsByUserId(this.tradeTool.tradePackage.team2UserId);
    }
    this.filterTeamPlayers(this.playerFilterCtrl, this.tradeTool.tradePackage?.team1UserId, this.filteredTeam1Players);
    this.filterTeamPlayers(this.player2FilterCtrl, this.tradeTool.tradePackage?.team2UserId, this.filteredTeam2Players);
  }

  /**
   * add player to team 2 list
   * @param player selected player
   */
  addPlayerToTeam1(player: KTCPlayer): void {
    if (player) {
      this.team1PlayerList.push(player);
      this.processTrade();
    }
  }

  /**
   * add player to team 2 list
   * @param player selected player
   */
  addPlayerToTeam2(player: KTCPlayer): void {
    if (player) {
      this.team2PlayerList.push(player);
      this.processTrade();
    }
  }

  /**
   * remove player from team 1 list by index
   * @param index
   */
  removePlayerFromTeam1(index: number): void {
    this.team1PlayerList.splice(index, 1);
    this.processTrade();
  }

  /**
   * remove player from team 2 list by index
   * @param index number
   */
  removePlayerFromTeam2(index: number): void {
    this.team2PlayerList.splice(index, 1);
    this.processTrade();
  }

  /**
   * get which side of trade is favored
   */
  getWhichSideIsFavored(): number {
    // close enough to be a fair trade
    if (!this.tradeTool.tradePackage || this.tradeTool.tradePackage.valueToEvenTrade < this.tradeTool.tradePackage.acceptanceBufferAmount) {
      return 0;
    }
    const team1 = this.tradeTool.getTradeValueBySide(1);
    const team2 = this.tradeTool.getTradeValueBySide(2);
    if (team1 > team2) {
      return 1;
    } else {
      return 2;
    }
  }

  /**
   * return trade background color
   */
  getTradeBackgroundColor(): object {
    if (this.tradeTool.tradePackage?.valueAdjustmentSide &&
      this.tradeTool.tradePackage?.valueToEvenTrade
      > this.tradeTool.tradePackage?.acceptanceBufferAmount) {
      return {'background-color': 'darkred'};
    } else {
      return {'background-color': '#434342'};
    }
  }

  /**
   * clear trade table objects
   */
  clearTradeTable(): void {
    this.team1PlayerList = [];
    this.team2PlayerList = [];
    this.team2Rankings = null;
    this.team1Rankings = null;
    this.tradeTool.tradePackage = null;
    this.filterTeamPlayers(this.playerFilterCtrl, this.tradeTool.tradePackage?.team1UserId, this.filteredTeam1Players);
    this.filterTeamPlayers(this.player2FilterCtrl, this.tradeTool.tradePackage?.team2UserId, this.filteredTeam2Players);
  }

  /**
   * add players to trade to even out trade.
   */
  evenOutTrade(): void {
    // prevent an infinite loop
    let index = 0;
    while (this.tradeTool.tradePackage?.valueToEvenTrade > this.tradeTool.tradePackage?.acceptanceBufferAmount || index > 10) {
      this.getWhichSideIsFavored() === 1 ?
        this.addPlayerToTeam2(
          this.tradeTool.findBestPlayerForValue(
            this.tradeTool.tradePackage.valueToEvenTrade * 1.01,
            this.isSuperFlex,
            this.tradeTool.tradePackage.team2UserId,
            1
          )[0]
        )
        :
        this.addPlayerToTeam1(
          this.tradeTool.findBestPlayerForValue(
            this.tradeTool.tradePackage.valueToEvenTrade * 1.01,
            this.isSuperFlex,
            this.tradeTool.tradePackage.team1UserId,
            1
          )[0]
        );
      index++;
    }
  }

  /**
   * selection made for team 2 filter
   */
  selectionMadeTeam1(): void {
    this.team1Rankings = this.powerRankingsService.findTeamFromRankingsByUserId(this.selectedTeam1);
    this.team1PlayerList = [];
    this.processTrade();
  }

  /**
   * selection made for team 2 filter
   */
  selectionMadeTeam2(): void {
    this.team2Rankings = this.powerRankingsService.findTeamFromRankingsByUserId(this.selectedTeam2);
    this.team2PlayerList = [];
    this.processTrade();
  }

  openPlayerComparisonPage(): void {
    this.playerComparisonService.selectedPlayers = [];
    this.playerComparisonService.group2SelectedPlayers = [];
    this.playerComparisonService.isGroupMode = true;
    this.team1PlayerList.map(player => {
      this.playerComparisonService.addPlayerToCharts(player, false);
    });
    this.team2PlayerList.map(player => {
      this.playerComparisonService.addPlayerToCharts(player, true);
    });
    this.router.navigateByUrl('players/comparison');
  }

}
