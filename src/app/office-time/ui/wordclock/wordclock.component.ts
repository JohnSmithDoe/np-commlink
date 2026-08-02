import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wordclock.component.html',
  styleUrls: ['./wordclock.component.scss'],
  imports: [],
})
export class WordclockComponent {
  readonly config = input<WordclockSettings>();
  protected readonly rows = GRID_ROWS;

  readonly #now = toSignal(
    interval(TICK_MS).pipe(
      startWith(0),
      map(() => dayjs())
    ),
    { requireSync: true }
  );

  readonly #face = computed(() => computeFace(this.#now(), this.config()));
  protected readonly mins = computed(() => this.#face().corners);
  readonly #activeWords = computed(() => this.#face().activeWords);

  isActive(
    row: string[],
    col: string,
    colIndex: number,
    rowIndex: number
  ): boolean {
    return isWordActive(this.#activeWords(), row, col, colIndex, rowIndex);
  }
}
