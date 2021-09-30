import {Component, OnInit} from '@angular/core';
import {PlayerService} from '../../services/player.service';
import {BaseComponent} from '../base-component.abstract';
import {KTCPlayer} from '../../model/KTCPlayer';
import {ConfigService} from '../../services/init/config.service';
import {SleeperService} from '../../services/sleeper.service';
import {MatOptionSelectionChange} from '@angular/material/core';

@Component({
    selector: 'app-player-statistics',
    templateUrl: './player-statistics.component.html',
    styleUrls: ['./player-statistics.component.css']
})
export class PlayerStatisticsComponent extends BaseComponent implements OnInit {

    /** are players loaded */
    playersLoaded: boolean = false;

    /** show advanced table settings */
    showAdvancedSettings: boolean = false;

    /** filtered list of players for searching */
    filteredPlayers: KTCPlayer[];

    /** if true change color of your team points */
    highlightYourTeam: boolean = true;

    /** if true change color of free agent points */
    highlightFreeAgents: boolean = false;

    /** position group filters, [qb, rb, wr/te] */
    posGroup: { value: string, displayName: string }[] = [{value: 'qb', displayName: 'Quarterbacks'},
        {value: 'rb', displayName: 'Running Backs'}, {value: 'wr/te', displayName: 'Wide Receivers & Tight Ends'},
        {value: 'wr', displayName: 'Wide Receivers'}, {value: 'te', displayName: 'Tight Ends'}];

    /** selected position from dropdown */
    selectedPosition: string;

    /** search value from search box */
    searchVal: string;

    /** combo input property for chart */
    selectedMetrics: { value: string, displayName: string }[] = [!this.sleeperService.selectedLeague?.isSuperflex ?
        {value: 'sf_trade_value', displayName: 'Trade Value (SuperFlex)'}
        : {value: 'sf_trade_value', displayName: 'Trade Value (SuperFlex)'}, {value: 'pts_half_ppr', displayName: 'Fantasy Points (Half PPR)'}];

    /** binding to x select */
    selectedXMetric: { value: string, displayName: string };

    /** binding to y select */
    selectedYMetric: { value: string, displayName: string };

    /** selectable metrics */
    selectableMetrics: { value: string, displayName: string }[] = [];

    /** passing metrics */
    passingMetrics: { value: string, displayName: string }[] = [
        {value: 'pass_att', displayName: 'Passing Attempts'},
        {value: 'pass_cmp', displayName: 'Passing Completions'},
        {value: 'cmp_pct', displayName: 'Passing Percent'},
        {value: 'pass_yd', displayName: 'Passing Yards'},
        {value: 'pass_td', displayName: 'Passing Touchdowns'},
        {value: 'pass_int', displayName: 'Passing Interceptions'},
        {value: 'pass_rz_att', displayName: 'Passing Redzone Attempts'}
    ];

    /** selectable rushing metrics */
    rushingMetrics: { value: string, displayName: string }[] = [
        {value: 'rush_att', displayName: 'Rushing Attempts'},
        {value: 'rush_yd', displayName: 'Rushing Yards'},
        {value: 'rush_ypa', displayName: 'Rushing Yards Per Attempt'},
        {value: 'rush_td', displayName: 'Rushing Touchdowns'}
    ];

    /** sack metrics */
    sackMetrics: { value: string, displayName: string }[] = [
        {value: 'pass_sack', displayName: 'Times Sacked'}
    ];

    /** turnover Metrics */
    turnoverMetrics: { value: string, displayName: string }[] = [
        {value: 'fum_lost', displayName: 'Fumbles'}
    ];

    /** general metrics */
    generalMetrics: { value: string, displayName: string }[] = [
        {value: 'pts_half_ppr', displayName: 'Fantasy Points (Half PPR)'},
        {value: 'pts_ppr', displayName: 'Fantasy Points (PPR)'},
        {value: 'pts_std', displayName: 'Fantasy Points (Standard)'},
        {value: 'sf_trade_value', displayName: 'Trade Value (SuperFlex)'},
        {value: 'trade_value', displayName: 'Trade Value (Standard)'},
        {value: 'gp', displayName: 'Games Played'},
    ];

    /** receiving Metrics */
    receivingMetrics: { value: string, displayName: string }[] = [
        {value: 'rec', displayName: 'Receptions'},
        {value: 'rec_tgt', displayName: 'Targets'},
        {value: 'rec_yd', displayName: 'Receiving Yards'},
        {value: 'rec_ypr', displayName: 'Receiving Yards Per Rec'},
        {value: 'rec_td', displayName: 'Receiving Touchdowns'},
        {value: 'rec_rz_tgt', displayName: 'Receiving Red Zone Targets'}
    ];

    constructor(public playerService: PlayerService,
                public configService: ConfigService,
                private sleeperService: SleeperService) {
        super();
    }

    ngOnInit(): void {
        this.playersLoaded = (this.playerService.playerValues.length > 0);
        this.selectedPosition = 'qb';
        this.selectedXMetric = this.selectedMetrics[0];
        this.selectedYMetric = this.selectedMetrics[1];
        this.highlightYourTeam = this.sleeperService.sleeperUser ? true : false;
        this.selectableMetrics = this.getSelectableMetrics(this.selectedPosition);
        if (this.playerService) {
            this.updatePlayerFilters();
        }
        this.playerService.loadPlayerValuesForToday();
        this.addSubscriptions(this.playerService.$currentPlayerValuesLoaded.subscribe(() => {
            this.playersLoaded = true;
            this.updatePlayerFilters();
        }));
    }

    /**
     * update player filters, function is called when option is selected
     */
    updatePlayerFilters(): void {
        this.filteredPlayers = this.playerService.playerValues.slice(0);
        this.filteredPlayers = this.filteredPlayers.filter(player => {
            return this.selectedPosition.includes(player.position.toLowerCase());
        });
        if (this.searchVal && this.searchVal.length > 0) {
            this.filteredPlayers = this.filteredPlayers.filter(player => {
                return (player.full_name.toLowerCase().indexOf(this.searchVal.toLowerCase()) >= 0
                    || player.age?.toString().indexOf(this.searchVal) >= 0
                    || ((player.owner?.ownerName.toLowerCase().indexOf(this.searchVal.toLowerCase()) >= 0)
                        && this.sleeperService.selectedLeague));
            });
        }
    }

    /**
     * handles when position categories are changed
     * @param event from select
     */
    updatePositionTable(event: any): void {
        this.selectedMetrics = [this.sleeperService.selectedLeague?.isSuperflex === false ? {value: 'trade_value', displayName: 'Trade Value (Standard)'}
            : {value: 'sf_trade_value', displayName: 'Trade Value (SuperFlex)'}, {value: 'pts_half_ppr', displayName: 'Fantasy Points (Half PPR)'}];
        this.selectedXMetric = this.selectedMetrics[0];
        this.selectedYMetric = this.selectedMetrics[1];
        this.selectedPosition = event.value;
        this.selectableMetrics = this.getSelectableMetrics(this.selectedPosition);
        this.updatePlayerFilters();
    }

    /**
     * returns new list of available metrics for pos group
     * TODO refactor and create utility that return metrics
     * @param pos string
     * @private
     */
    private getSelectableMetrics(pos: string): { value: string, displayName: string }[] {
        const newMetrics = [];
        switch (pos) {
            case 'qb':
                return newMetrics.concat(
                    this.generalMetrics,
                    this.passingMetrics,
                    this.rushingMetrics,
                    this.sackMetrics,
                    this.turnoverMetrics
                );
            case 'rb':
                return newMetrics.concat(
                    this.generalMetrics,
                    this.rushingMetrics,
                    this.turnoverMetrics,
                    this.receivingMetrics
                );            // wr/te
            default:
                return newMetrics.concat(
                    this.generalMetrics,
                    this.receivingMetrics,
                    this.turnoverMetrics
                );
        }
    }

    /**
     * handles updates to x and y chart
     * @param position 0 = x axis, 1 = y axis
     * @param metric new object
     * @param event select event to filter out no user input
     */
    updateSelectedMetrics(position: number, metric: { value: string; displayName: string }, event: MatOptionSelectionChange): void {
        if (event.isUserInput) {
            if (position === 0) {
                this.selectedXMetric = metric;
                this.selectedMetrics = [metric, this.selectedYMetric];
            } else {
                this.selectedYMetric = metric;
                this.selectedMetrics = [this.selectedXMetric, metric];
            }
        }
    }
}
