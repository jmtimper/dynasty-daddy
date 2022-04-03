import {Component, OnInit} from '@angular/core';
import {TradeService} from '../services/trade-tool.service.ts.service';
import {TradePackage} from '../model/tradePackage';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from "../base-component.abstract";

@Component({
  selector: 'app-trade-center',
  templateUrl: './trade-center.component.html',
  styleUrls: ['./trade-center.component.css']
})
export class TradeCenterComponent extends BaseComponent implements OnInit {

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
    const player2 = [this.playerService.playerValues[50]];
    console.log(player1, player2);
    const trade = new TradePackage(
      player1,
      player2
    );
    this.tradeTool.determineTrade(trade, true);
  }

}
