import {Component, OnInit} from '@angular/core';
import {ConfigService} from './services/init/config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'dynasty-daddy';

  constructor(public configService: ConfigService) {
  }

  ngOnInit(): void {
    this.configService.checkIfMobile();
    console.log('isMobile ' + this.configService.isMobile);
  }
}
