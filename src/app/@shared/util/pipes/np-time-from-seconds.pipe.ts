import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'npTimeFromSeconds',
  standalone: true,
})
export class NpTimeFromSecondsPipe implements PipeTransform {
  transform(value?: number): string {
    const seconds = Math.max(0, Math.floor(value ?? 0));
    return `${Math.floor(seconds / 60)}`;
  }
}
