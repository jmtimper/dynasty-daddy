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
  public filteredPlayers: ReplaySubject<KTCPlayer[]> = new ReplaySubject<KTCPlayer[]>(1);

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  public tradePackage: TradePackage;

  public team1PlayerList: KTCPlayer[] = [];

  public team2PlayerList: KTCPlayer[] = [];

  @ViewChild('singleSelect', {static: true}) singleSelect: MatSelect;

  @ViewChild('singleSelect2', {static: true}) singleSelect2: MatSelect;

  constructor(
    private tradeTool: TradeService,
    private playerService: PlayerService
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

  initializeTradeCalculator(): void {
    // set initial selection
    this.playerCtrl.setValue(this.playerService.playerValues[10]);

    this.players = this.playerService.playerValues.slice();

    // load the initial player list
    this.filteredPlayers.next(this.players.slice());

    // listen for search field value changes
    this.playerFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterPlayers();
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
    this.filteredPlayers
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredPlayers are loaded initially
        // and after the mat-option elements are available
        this.singleSelect.compareWith = (a: KTCPlayer, b: KTCPlayer) => a && b && a.name_id === b.name_id;
      });
  }

  protected filterPlayers(): any {
    if (!this.players) {
      return;
    }
    // get the search keyword
    let search = this.playerFilterCtrl.value;
    if (!search) {
      this.filteredPlayers.next(this.players.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the players
    this.filteredPlayers.next(
      this.players.filter(player => player.full_name.toLowerCase().indexOf(search) > -1)
    );
  }


  processTrade(): void {
    if (this.team1PlayerList.length > 0 || this.team2PlayerList.length > 0) {
      const player1 = this.team1PlayerList.slice();
      const player2 = this.team2PlayerList.slice();
      const trade = new TradePackage(
        player1,
        player2
      );
      this.tradePackage = this.tradeTool.determineTrade(trade, true);
    }
  }

  addPlayerToTeam1(player: KTCPlayer): void {
    this.team1PlayerList.push(player);
    this.processTrade();
  }

  addPlayerToTeam2(player: KTCPlayer): void {
    this.team2PlayerList.push(player);
    this.processTrade();
  }

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
}
