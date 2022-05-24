import {Component, Input, OnInit} from '@angular/core';
import {TradePackage} from '../../model/tradePackage';
import {ConfigService} from '../../../services/init/config.service';
import {PlayerService} from '../../../services/player.service';
import {Router} from '@angular/router';
import {TradeService} from '../../services/trade.service.ts.service';
import {SleeperService} from '../../../services/sleeper.service';
import {SleeperOwnerData} from '../../../model/SleeperLeague';

@Component({
  selector: 'app-trade-finder-card',
  templateUrl: './trade-finder-card.component.html',
  styleUrls: ['./trade-finder-card.component.css']
})
export class TradeFinderCardComponent implements OnInit {

  @Input()
  owner: SleeperOwnerData = null;

  @Input()
  tradePackage: TradePackage;

  constructor(public configService: ConfigService,
              public router: Router,
              public sleeperService: SleeperService,
              private tradeService: TradeService,
              private playerService: PlayerService) {
  }

  ngOnInit(): void {
    this.tradePackage.team2Assets = this.playerService.sortListOfPlayers(this.tradePackage.team2Assets, this.tradePackage.isSuperFlex);
  }

  /**
   * opens trade calculator
   */
  openTradeCalculator(): void {
    this.tradeService.tradePackage = this.tradePackage;
    this.router.navigateByUrl('players/trade');
  }

}
