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

  public acceptanceVariance: number;

  @ViewChild('singleSelect', {static: true}) singleSelect: MatSelect;

  @ViewChild('singleSelect2', {static: true}) singleSelect2: MatSelect;

  constructor(
    public tradeTool: TradeService,
    public playerService: PlayerService,
    public configService: ConfigService,
    public sleeperService: SleeperService
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

    // load the initial player list
    this.filteredTeam1Players.next(this.players.slice(0, 10));
    let playerTeam2Filter = this.players.slice(0, 10);
    if (this.tradeTool.tradePackage && this.tradeTool.tradePackage?.team2UserId) {
      playerTeam2Filter = this.players.filter(it => it.owner?.userId === this.tradeTool.tradePackage?.team2UserId).slice(0, 10);
    }
    this.filteredTeam2Players.next(playerTeam2Filter);

    // listen for search field value changes
    this.playerFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterTeam1Players();
      });

    this.player2FilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterTeam2Players();
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
    this.filteredTeam1Players
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredPlayers are loaded initially
        // and after the mat-option elements are available
        this.singleSelect.compareWith = (a: KTCPlayer, b: KTCPlayer) => a && b && a.name_id === b.name_id;
      });

    this.filteredTeam2Players
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredPlayers are loaded initially
        // and after the mat-option elements are available
        this.singleSelect2.compareWith = (a: KTCPlayer, b: KTCPlayer) => a && b && a.name_id === b.name_id;
      });
  }

  /**
   * filter players for selected dropdown
   * @protected
   */
  protected filterTeam1Players(): any {
    if (!this.players) {
      return;
    }
    // get the search keyword
    let search = this.playerFilterCtrl.value;
    if (!search) {
      this.filteredTeam1Players.next(this.filterPlayersList(this.tradeTool?.tradePackage?.team1UserId).slice(0, 10));
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the players
    this.filteredTeam1Players.next(
      this.filterPlayersList(this.tradeTool?.tradePackage?.team1UserId)
        .filter(player => player.full_name.toLowerCase().indexOf(search) > -1).slice(0, 10));
  }

  /**
   * filter players for selected dropdown
   * TODO abstract this out
   * @protected
   */
  protected filterTeam2Players(): any {
    if (!this.players) {
      return;
    }
    // get the search keyword
    let search = this.player2FilterCtrl.value;
    if (!search) {
      this.filteredTeam2Players.next(this.filterPlayersList(this.tradeTool?.tradePackage?.team2UserId).slice(0, 10));
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the players
    this.filteredTeam2Players.next(
      this.filterPlayersList(this.tradeTool?.tradePackage?.team2UserId)
        .filter(player => player.full_name.toLowerCase().indexOf(search) > -1).slice(0, 10));
  }

  /**
   * Filters list of all players by team.
   * Used for filtering which players show up in searches
   * @param userId string
   * @private
   */
  private filterPlayersList(userId: string = null): KTCPlayer[] {
    if (userId) {
      // filter players by team
      const playerList = this.players.filter(it => it.owner?.userId === userId);
      // get draft capital for team in filter
      const team = this.sleeperService.getTeamByUserId(userId);
      const picks = this.sleeperService.getDraftCapitalToNameId([...team.futureDraftCapital, ...team.draftCapital]);
      picks.map(pick => {
        const pickPlayer = this.playerService.getPlayerByNameId(pick);
        if (pickPlayer) {
          playerList.push(pickPlayer);
        }
      });
      return playerList.sort((a, b) => b.sf_trade_value - a.sf_trade_value);
    } else {
      return this.players;
    }
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
      if (player1.length === 1) {
        trade.team1UserId = player1[0]?.owner?.userId || null;
      }
      if (player2.length === 1) {
        trade.team2UserId = player2[0]?.owner?.userId || null;
      }
      if (player1.length === 0) {
        trade.team1UserId = null;
      }
      if (player2.length === 0) {
        trade.team2UserId = null;
      }
    }
    this.tradeTool.tradePackage = this.tradeTool.determineTrade(trade, this.isSuperFlex);
  }

  /**
   * add player to team 2 list
   * @param player selected player
   */
  addPlayerToTeam1(player: KTCPlayer): void {
    this.team1PlayerList.push(player);
    this.processTrade();
  }

  /**
   * add player to team 2 list
   * @param player selected player
   */
  addPlayerToTeam2(player: KTCPlayer): void {
    this.team2PlayerList.push(player);
    this.processTrade();
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
   * get total amount of trade package by side
   * @param teamNumber 1 or 2
   */
  getTradeValueBySide(teamNumber: number): number {
    if (!this.tradeTool.tradePackage) {
      return 0;
    }
    if (teamNumber === 1) {
      return this.tradeTool.tradePackage?.team1AssetsValue + (
        this.tradeTool.tradePackage?.valueAdjustmentSide === 1
          ? this.tradeTool.tradePackage.valueAdjustment : 0);
    } else {
      return this.tradeTool.tradePackage?.team2AssetsValue + (
        this.tradeTool.tradePackage?.valueAdjustmentSide === 2
          ? this.tradeTool.tradePackage.valueAdjustment : 0);
    }
  }

  /**
   * get which side of trade is favored
   */
  getWhichSideIsFavored(): number {
    // close enough to be a fair trade
    if (!this.tradeTool.tradePackage || this.tradeTool.tradePackage.valueToEvenTrade < this.tradeTool.tradePackage.acceptanceBufferAmount) {
      return 0;
    }
    const team1 = this.getTradeValueBySide(1);
    const team2 = this.getTradeValueBySide(2);
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
    this.tradeTool.tradePackage = null;
  }
}
