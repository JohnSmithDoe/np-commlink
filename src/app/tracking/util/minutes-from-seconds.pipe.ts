import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minutesFromSeconds',
  standalone: true,
})
export class MinutesFromSecondsPipe implements PipeTransform {
  transform(value?: number): string {
    const seconds = Math.max(0, Math.floor(value ?? 0));
    return `${Math.floor(seconds / 60)}`;
  }
}
