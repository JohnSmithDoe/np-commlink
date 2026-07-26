import { Pipe, PipeTransform } from '@angular/core';

/**
 * A tile's slot address, `0x01`-style, from its position on the grid. Purely
 * decorative: the deck is reorderable, so the address follows the slot rather
 * than the program — the top tile always reads `0x01`.
 */
@Pipe({ name: 'hex' })
export class HexPipe implements PipeTransform {
  transform(index: number): string {
    return `0x${(index + 1).toString(16).toUpperCase().padStart(2, '0')}`;
  }
}
