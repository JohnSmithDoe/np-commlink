/* ─── why ─────────────────────────────────────────────────────────
 * The throw is already decided when it arrives — `rollPool` is pure and
 * ran before the first frame — so what happens here is presentation of a
 * known outcome, never a source of it. The scramble is therefore a
 * deterministic function of a tick counter rather than a second random
 * source, which keeps a spec able to assert what the tray settles on.
 *
 * `throwId` and not `roll` drives the effect: two throws can produce the
 * same numbers, and that still has to look like a throw.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DieFaces, PoolRoll } from '../../model/dice.types';
import { rollBreakdown } from '../../util/dice.utils';
import { DieGlyphComponent } from '../die-glyph/die-glyph.component';

type TrayDie = { faces: DieFaces; value: number; settle: string };

const SCRAMBLE_MS = 70;
const TUMBLE_MS = 900;
const SETTLE_STEP_MS = 55;

const scrambleValue = (index: number, tick: number, faces: DieFaces): number =>
  ((index * 7 + tick * 13) % faces) + 1;

const prefersStill = (): boolean =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

@Component({
  selector: 'app-trackplay-dice-tray',
  templateUrl: './dice-tray.component.html',
  styleUrls: ['./dice-tray.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DieGlyphComponent],
})
export class DiceTrayComponent {
  readonly roll = input<PoolRoll | null>(null);
  readonly throwId = input(0);

  readonly #tick = signal(0);
  readonly #revealed = signal(true);

  readonly revealed = this.#revealed.asReadonly();

  readonly dice = computed<TrayDie[]>(() => {
    const roll = this.roll();
    if (!roll) return [];
    const revealed = this.#revealed();
    const tick = this.#tick();
    return roll.dice.map((die, index) => ({
      faces: die.faces,
      value: revealed ? die.value : scrambleValue(index, tick, die.faces),
      settle: `${index * SETTLE_STEP_MS}ms`,
    }));
  });

  readonly breakdown = computed<string>(() => {
    const roll = this.roll();
    return roll ? rollBreakdown(roll) : '';
  });

  constructor() {
    effect((onCleanup) => {
      this.throwId();
      if (!untracked(this.roll) || prefersStill()) return;

      this.#revealed.set(false);
      const scrambling = setInterval(
        () => this.#tick.update((tick) => tick + 1),
        SCRAMBLE_MS
      );
      const settling = setTimeout(() => this.#revealed.set(true), TUMBLE_MS);

      onCleanup(() => {
        clearInterval(scrambling);
        clearTimeout(settling);
        this.#revealed.set(true);
      });
    });
  }
}
