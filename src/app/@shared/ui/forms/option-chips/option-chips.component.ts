/* ─── why ─────────────────────────────────────────────────────────
 * `ion-button`, not `ion-chip`, for the reason `date-shortcuts` gives: a
 * chip renders a bare shadow host with no role, takes no focus and answers
 * no key. A chip is the shape here, never the element.
 *
 * Labels arrive translated rather than as keys. The row is shared and the
 * wording is not — an anchor reads "Fällig / Erledigt" to a task and would
 * read as something else to whatever grows the next one.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

export interface ChipOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-option-chips',
  templateUrl: './option-chips.component.html',
  styleUrl: './option-chips.component.scss',
  imports: [IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionChipsComponent<T> {
  readonly options = input.required<readonly ChipOption<T>[]>();
  readonly value = input<T>();
  readonly label = input<string>();
  readonly picked = output<T>();

  readonly #chosen = computed(() => JSON.stringify(this.value()));

  protected isOn(option: ChipOption<T>): boolean {
    return JSON.stringify(option.value) === this.#chosen();
  }
}
