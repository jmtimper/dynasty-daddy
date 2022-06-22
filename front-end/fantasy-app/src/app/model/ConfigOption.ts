/**
 * Config option data model
 */
export class ConfigOption {
  configKey: string;
  configValue: string;

  constructor(configKey: string, configValue: string) {
    this.configKey = configKey;
    this.configValue = configValue;
  }
}
