import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigApiConfigService {

  private _getConfigOptionEndpoint = '';

  get getConfigOptionsEndpoint(): string {
    return this._getConfigOptionEndpoint;
  }

  set getConfigOptionsEndpoint(value: string) {
    this._getConfigOptionEndpoint = value;
  }
}
