import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minutesFromSeconds',
  standalone: true,
})
export class MinutesFromSecondsPipe implements PipeTransform {
  transform(value = 0): string {
    const seconds = Math.max(0, Math.floor(value));
    return String(Math.floor(seconds / 60));
  }
}
