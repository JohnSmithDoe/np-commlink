/* ─── why ─────────────────────────────────────────────────────────
 * The one row of tapped choices; every picker in @shared renders it.
 * `ion-button`, not `ion-chip`: a chip is a bare shadow host with no role,
 * takes no focus and answers no key. A chip is the shape, never the element.
 *
 * Identity is the caller's `key`, never the value: equality on an object
 * value depends on how it was built, and the failure is no chip looking
 * selected. Labels arrive translated — the row is shared, the wording not.
 *
 * Clear is disabled when nothing is selected, not hidden: a control that
 * unmounts on its own click drops the focus it was holding.
 * ───────────────────────────────────────────────────────────────── */
import {
  booleanAttribute,
  Component,
  computed,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

export interface ChipOption<T> {
  key: string;
  value: T;
  label: string;
  a11yLabel?: string;
}

@Component({
  selector: 'app-option-chips',
  templateUrl: './option-chips.component.html',
  styleUrl: './option-chips.component.scss',
  imports: [IonButton, IonIcon],
})
export class OptionChipsComponent<T> {
  readonly #selectedKeys = computed(() => {
    const selected = this.selected();
    return new Set(typeof selected === 'string' ? [selected] : selected);
  });

  readonly options = input.required<readonly ChipOption<T>[]>();
  readonly selected = input<string | readonly string[] | undefined>();
  readonly label = input<string>();
  readonly groupLabel = input<string>();
  readonly clearLabel = input<string>();
  readonly clearDisabled = input<boolean>();
  readonly stretch = input(false, { transform: booleanAttribute });
  readonly columns = input(undefined, { transform: numberAttribute });
  readonly picked = output<T>();
  readonly cleared = output<void>();

  protected readonly clearOff = computed(
    () => this.clearDisabled() ?? this.#selectedKeys().size === 0
  );

  constructor() {
    addIcons({ closeOutline });
  }

  protected isOn(option: ChipOption<T>): boolean {
    return this.#selectedKeys().has(option.key);
  }
}
