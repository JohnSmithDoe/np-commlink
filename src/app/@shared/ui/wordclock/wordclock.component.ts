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
  TSettings,
} from '../../util/wordclock/wordclock.utils';

// The letter grid split into per-row character arrays — derived once from the
// module-level GRID, not per component instance.
const GRID_ROWS = GRID.map((row) => [...row]);

/**
 * Sprachvarianten für den deutschsprachigen Raum
    ZWANZIG NACH ... ZEHN VOR HALB
    ZWANZIG VOR ... ZEHN NACH HALB
    VIERTEL VOR ... DREIVIERTEL

    Die Ecken zeigen die Minuten an

 * The pure clock logic (letter grid, `computeFace`, `isWordActive`) lives in
 * `./wordclock.utils` and is unit-tested there; this component just wires the
 * ticking wall clock and current config into signals.
 */
@Component({
  selector: 'app-wordclock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wordclock.component.html',
  styleUrls: ['./wordclock.component.scss'],
  imports: [],
})
export class WordclockComponent {
  readonly config = input<TSettings>();
  protected readonly rows = GRID_ROWS;

  // Wall-clock time re-emitted every TICK_MS (rxjs) and lifted into a signal.
  // The subscription is torn down with the component via the injection context,
  // so there's no ngOnDestroy to unsubscribe.
  readonly #now = toSignal(
    interval(TICK_MS).pipe(
      startWith(0),
      map(() => dayjs())
    ),
    { requireSync: true }
  );

  // Derived clock face: recomputes whenever the time ticks or config changes,
  // which marks this OnPush view dirty on its own — no manual markForCheck.
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
