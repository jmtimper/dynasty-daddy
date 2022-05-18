import {Component, OnInit} from '@angular/core';
import {SleeperService} from '../../services/sleeper.service';
import {BaseComponent} from '../base-component.abstract';
import {ConfigService} from '../../services/init/config.service';
import {LeagueSwitchService} from '../services/league-switch.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent extends BaseComponent implements OnInit {


  constructor(public sleeperService: SleeperService,
              public configService: ConfigService,
              public leagueSwitchService: LeagueSwitchService) {
    super();
  }

  ngOnInit(): void {
  }
}
