import {Injectable} from '@angular/core';
import {EndpointsService} from '../endpoints.service';
import {DeviceDetectorService} from 'ngx-device-detector';
import {ConfigOption} from '../../model/ConfigOption';
import {ConfigApiService} from '../api/config/config-api.service';
import {BaseComponent} from '../../components/base-component.abstract';

/**
 * dictionary of constant config value keys
 */
export const ConfigKeyDictionary = {
  SHOW_HOME_DIALOG: 'show_home_dialog',
  HOME_DIALOG_HEADER: 'home_dialog_header',
  HOME_DIALOG_BODY: 'home_dialog_body'
} as const;

@Injectable({
  providedIn: 'root'
})
export class ConfigService extends BaseComponent {

  private _isMobile: boolean = false;

  /** config options list for application */
  configOptions: ConfigOption[] = [];

  constructor(private endpointsService: EndpointsService,
              private deviceDetectorService: DeviceDetectorService,
              private configApiService: ConfigApiService
  ) {
    super();
  }

  get isMobile(): boolean {
    return this._isMobile;
  }

  checkIfMobile = () =>
    this._isMobile = this.deviceDetectorService.isMobile()

  applyConfigs(): void {
    // assign endpoints
    this.endpointsService.assignEndpoints();
    // load config options
    this.addSubscriptions(this.configApiService.fetchAllConfigOptions().subscribe((options) => {
        this.configOptions = options;
      }
    ));
  }

  /**
   * fetch config option from config key.
   * @param key config key to look up
   */
  getConfigOptionByKey = (key: string): ConfigOption =>
    this.configOptions.find((option) => option.configKey === key)
}
