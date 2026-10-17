/* ─── why ─────────────────────────────────────────────────────────
 * A small bounded number is TAPPED, never typed: the phone keyboard
 * covers the form it is editing, so a text field for six choices costs a
 * keyboard, a dismissal and a re-scroll. The range is the caller's,
 * because only the caller knows what a sane upper bound is — a priority
 * runs out at six, a cadence at twelve.
 *
 * `clearBtn` is opt-in rather than always on: where the value cannot be
 * absent, an X that does nothing is worse than no X.
 * ───────────────────────────────────────────────────────────────── */
import {
  booleanAttribute,
  Component,
  computed,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import {
  ChipOption,
  OptionChipsComponent,
} from '../option-chips/option-chips.component';

@Component({
  selector: 'app-number-select',
  templateUrl: './number-select.component.html',
  imports: [OptionChipsComponent],
})
export class NumberSelectComponent {
  readonly value = input<number | undefined>();
  readonly min = input(1, { transform: numberAttribute });
  readonly max = input(12, { transform: numberAttribute });
  readonly clearBtn = input(false, { transform: booleanAttribute });
  readonly label = input<string>();
  readonly clearLabel = input<string>();

  readonly valueChange = output<number | undefined>();

  protected readonly options = computed<ChipOption<number>[]>(() => {
    const from = this.min();
    const span = Math.max(0, this.max() - from + 1);
    return Array.from({ length: span }, (_, index) => {
      const option = from + index;
      return { key: String(option), value: option, label: String(option) };
    });
  });

  protected readonly selected = computed(() => {
    const value = this.value();
    return value === undefined ? undefined : String(value);
  });
}
