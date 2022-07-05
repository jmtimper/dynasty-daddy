// @ts-ignore
import LogRocket from 'logrocket';
import {Component, OnInit} from '@angular/core';
import {ConfigService} from './services/init/config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'fantasy-app';

  constructor(public configService: ConfigService) {
  }

  ngOnInit(): void {

    if (!window.location.origin.includes('localhost')) {
      console.log('initialize LogRocket');
      LogRocket.init('m8wwpp/dynasty-daddy', {
        console: {
          shouldAggregateConsoleErrors: true
        },
        release: 'production'
      });
    }

    this.configService.checkIfMobile();
    console.log('isMobile ' + this.configService.isMobile);
  }
}
