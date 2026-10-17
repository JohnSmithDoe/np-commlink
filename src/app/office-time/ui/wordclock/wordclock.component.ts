import { Component, computed, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import dayjs from 'dayjs';
import { interval, map, startWith } from 'rxjs';
import {
  computeFace,
  GRID,
  isWordActive,
  TICK_MS,
  WordclockSettings,
} from '../../util/wordclock.utils';

const GRID_ROWS = GRID.map((row) => [...row]);

@Component({
  selector: 'app-wordclock',
  templateUrl: './wordclock.component.html',
  styleUrls: ['./wordclock.component.scss'],
  imports: [],
})
export class WordclockComponent {
  readonly #now = toSignal(
    interval(TICK_MS).pipe(
      startWith(0),
      map(() => dayjs())
    ),
    { requireSync: true }
  );

  readonly #face = computed(() => computeFace(this.#now(), this.config()));

  readonly #activeWords = computed(() => this.#face().activeWords);

  readonly config = input<WordclockSettings>();

  protected readonly rows = GRID_ROWS;

  protected readonly mins = computed(() => this.#face().corners);

  isActive(
    row: string[],
    col: string,
    colIndex: number,
    rowIndex: number
  ): boolean {
    return isWordActive(this.#activeWords(), row, col, colIndex, rowIndex);
  }
}
