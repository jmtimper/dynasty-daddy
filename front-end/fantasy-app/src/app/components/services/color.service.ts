import {Injectable} from '@angular/core';
import Gradient from 'javascript-color-gradient';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  // teamColors = {
  //   KCC: ['#E31837', '#FFB81C'],
  //   BUF: ['#00338D', '#C60C30'],
  //   LAC: ['#0080C6', '#FFC20E', '#FFFFFF'],
  //   CAR: ['#0085CA', '#101820', '#BFC0BF'],
  //   ARI: ['#97233F', '#000000', '#FFB612'],
  //   MIN: ['#4F2683', '#FFC62F'],
  //   IND: ['#002C5F', '#A2AAAD'],
  //     NYG: ['#0B2265', '#A71930', '#A5ACAF'],
  //     DAL: ['#041E42', '#869397'],
  //     BAL: ['#241773', '#000000', '#9E7C0C'],
  //     TEN: ['#0C2340', '#4B92DB', '#C8102E'],
  //     CIN: ['#FB4F14', '#000000'],
  //     SEA: ['#002244', ]
  // };

  /**
   * returns array of hexs in a gradient between two colors
   * @param length number of colors
   * @param color1 color at min
   * @param color2 color at max
   */
  getColorGradientArray(length: number, color1: string, color2: string): [] {
    const colorGradient = new Gradient();
    colorGradient.setMidpoint(length);
    colorGradient.setGradient(color1, color2);
    return colorGradient.getArray();
  }

  /**
   * gets point color for data point
   * @param isTeam is player on team
   */
  getPointBackgroundColor(highlightFreeAgent: boolean, highlightYourTeam: boolean, isTeam: boolean, isFreeAgent: boolean): string {
    return isTeam && highlightYourTeam ? '#17becf' : (highlightFreeAgent && isFreeAgent ? '#ff4f4f' : '#a6a6a6');
  }

  /**
   * get point border color for data point
   * @param isTeam is player on team
   */
  getPointBorderColor(highlightFreeAgent: boolean, highlightYourTeam: boolean, isTeam: boolean, isFreeAgent: boolean): string {
    return isTeam && highlightYourTeam ? '#a0e6f1' : (highlightFreeAgent && isFreeAgent ? '#faa1a1' : '#ffffff');
  }
}
