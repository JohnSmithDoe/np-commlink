import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'hex' })
export class HexPipe implements PipeTransform {
  transform(index: number): string {
    return `0x${(index + 1).toString(16).toUpperCase().padStart(2, '0')}`;
  }
}
