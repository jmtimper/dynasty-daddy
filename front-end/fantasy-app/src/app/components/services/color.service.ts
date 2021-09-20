import {Injectable} from '@angular/core';
import Gradient from 'javascript-color-gradient';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

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

  getTeamColor(team: string): string {
    return '#0000FF';
  }
}
