import {Component, OnInit, ViewChild} from '@angular/core';
import {TradeService} from '../services/trade-tool.service.ts.service';
import {TradePackage} from '../model/tradePackage';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {FormControl} from "@angular/forms";
import {ReplaySubject} from "rxjs";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-trade-center',
  templateUrl: './trade-center.component.html',
  styleUrls: ['./trade-center.component.css']
})
export class TradeCenterComponent extends BaseComponent implements OnInit {

  /** list of banks */
  protected banks: string[] = ['test', 'test_two', 'test_three'];

  /** control for the selected bank */
  public bankCtrl: FormControl = new FormControl();

  /** control for the MatSelect filter keyword */
  public bankFilterCtrl: FormControl = new FormControl();

  /** list of banks filtered by search keyword */
  public filteredBanks: ReplaySubject<string[]> = new ReplaySubject<string[]>(1);

  @ViewChild('singleSelect', { static: true }) singleSelect: MatSelect;

  constructor(
    private tradeTool: TradeService,
    private playerService: PlayerService
  ) {
    super();
  }

  ngOnInit(): void {
    this.playerService.loadPlayerValuesForToday();
  }

  test(): void {
    const player1 = [this.playerService.playerValues[1]];
    const player2 = [
      this.playerService.playerValues[50],
      this.playerService.playerValues[76],
      this.playerService.playerValues[80],
      this.playerService.playerValues[70],
      this.playerService.playerValues[102]
    ];
    console.log(player1, player2);
    const trade = new TradePackage(
      player1,
      player2
    );
    this.tradeTool.determineTrade(trade, true);
  }

}
