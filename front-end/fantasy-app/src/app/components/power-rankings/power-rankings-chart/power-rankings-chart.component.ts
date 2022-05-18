import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective, Label} from 'ng2-charts';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {PowerRankingsService} from '../../services/power-rankings.service';
import {SleeperService} from '../../../services/sleeper.service';
import {ConfigService} from '../../../services/init/config.service';
import 'chartjs-plugin-colorschemes/src/plugins/plugin.colorschemes';
import {Classic10} from 'chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau';
import {TeamPowerRanking} from '../../model/powerRankings';

@Component({
  selector: 'app-power-rankings-chart',
  templateUrl: './power-rankings-chart.component.html',
  styleUrls: ['./power-rankings-chart.component.css']
})
export class PowerRankingsChartComponent implements OnInit, OnChanges {

  @ViewChild(BaseChartDirective, {static: true}) chart: BaseChartDirective;

  @Input()
  powerRankings: TeamPowerRanking[];

  selectedFilter = 'starter';

  /**
   * ng2-chart options
   */
  public lineChartOptions: (ChartOptions & { annotation?: any }) = {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      intersect: false,
      mode: 'index'
    },
    title: {
      text: 'Overall Team Value'
    },
    scales: {
      xAxes: [{
        display: true,
        stacked: true,
        gridLines: {
          display: true
        },
        scaleLabel: {
          display: this.configService.isMobile ? false : true,
          labelString: 'Team',
          fontColor: '#d3d3d3'
        }
      }],
      yAxes: [{
        display: true,
        stacked: true,
        gridLines: {
          display: true
        },
        scaleLabel: {
          display: true,
          labelString: 'Value',
          fontColor: '#d3d3d3'
        }
      }]
    },
    legend: {
      position: this.configService.isMobile ? 'bottom' : 'left',
      labels: {
        fontColor: '#d3d3d3'
      },
      reverse: true,
    },
    plugins: {
      colorschemes: {
        scheme: Classic10,
        override: true
      }
    }
  };
  public lineChartLegend = true;
  public lineChartType = 'bar';
  public lineChartPlugins = [];
  data: ChartDataSets[] = [];
  dataLabels: Label[] = [];

  constructor(private powerRankingService: PowerRankingsService,
              private sleeperService: SleeperService,
              public configService: ConfigService) {
  }

  ngOnInit(): void {
    this.refreshChart();
  }

  ngOnChanges(): void {
    this.refreshChart();
  }

  /**
   * refreshes chart labels, order and data
   */
  refreshChart(): void {
    this.dataLabels = [];
    for (const team of this.powerRankingService.powerRankings) {
      this.dataLabels.push(team.team.owner?.ownerName);
    }
    this.refreshChartData();
  }

  /**
   * refreshes table with team rankings
   * @private
   */
  private refreshChartData(): void {
    const positionGroups = ['QB', 'RB', 'WR', 'TE'];
    positionGroups.map((pos, index) => {
      const temp = [];
      for (const team of this.powerRankingService.powerRankings) {
        const rosterInd = this.dataLabels.indexOf(team.team.owner?.ownerName);
        temp[rosterInd] = this.sleeperService.selectedLeague.isSuperflex ? team.roster[index].sfTradeValue : team.roster[index].tradeValue;
        this.data[index] = {data: temp, label: pos, hoverBackgroundColor: []};
      }
    });
    const tempPicks = [];
    for (const team of this.powerRankingService.powerRankings) {
      const index = this.dataLabels.indexOf(team.team.owner?.ownerName);
      tempPicks[index] = this.sleeperService.selectedLeague.isSuperflex ? team.picks.sfTradeValue : team.picks.tradeValue;
      this.data[4] = {data: tempPicks, label: 'Draft Capital', hoverBackgroundColor: []};
    }
  }
}
