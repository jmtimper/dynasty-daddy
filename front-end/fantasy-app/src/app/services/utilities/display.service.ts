import {Injectable} from '@angular/core';
import {TeamRankingTier} from '../../components/model/powerRankings';

@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  constructor() {
  }

  public truncate(str, n): string {
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
  }

  /**
   * Get tier string from number
   * @param tier string
   */
  getTierFromNumber(tier: number): string {
    return TeamRankingTier[tier].replace(/_/g, ' ');
  }
}
