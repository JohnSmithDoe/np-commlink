/* ─── why ─────────────────────────────────────────────────────────
 * `pick` resolves the date on the CLICK rather than reading a precomputed
 * table, so "today" cannot go stale in a dialog left open across midnight.
 * The highlight recomputes off `value` alone, which is the only thing that
 * moves it in practice. Clear follows the value, not the highlight: a
 * typed date matches no shortcut and is still there to clear.
 * ───────────────────────────────────────────────────────────────── */
import { Component, computed, inject, input, output } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Marker } from '../../../model/app.types';
import { isoDay } from '../../../util/formatting/date-format.utils';
import {
  DATE_SHORTCUT_IDS,
  DateShortcutId,
  dateForShortcut,
} from '../../../util/formatting/date-shortcuts.utils';
import {
  ChipOption,
  OptionChipsComponent,
} from '../option-chips/option-chips.component';

const SHORTCUT_LABELS: Readonly<Record<DateShortcutId, Marker>> = {
  today: marker('date-picker.shortcut.today'),
  tomorrow: marker('date-picker.shortcut.tomorrow'),
  week: marker('date-picker.shortcut.week'),
  weekend: marker('date-picker.shortcut.weekend'),
  month: marker('date-picker.shortcut.month'),
  year: marker('date-picker.shortcut.year'),
};

@Component({
  selector: 'app-date-shortcuts',
  templateUrl: './date-shortcuts.component.html',
  styleUrl: './date-shortcuts.component.scss',
  imports: [OptionChipsComponent, TranslatePipe],
})
export class DateShortcutsComponent {
  readonly value = input('');
  readonly picked = output<string>();

  readonly #translate = inject(TranslateService);

  protected readonly options: readonly ChipOption<DateShortcutId>[] =
    DATE_SHORTCUT_IDS.map((id) => ({
      key: id,
      value: id,
      label: this.#translate.instant(SHORTCUT_LABELS[id]),
    }));

  protected readonly activeId = computed<DateShortcutId | undefined>(() => {
    const current = this.value();
    if (!current) return;
    const day = isoDay(current);
    return DATE_SHORTCUT_IDS.find((id) => dateForShortcut(id) === day);
  });

  protected pick(id: DateShortcutId): void {
    this.picked.emit(dateForShortcut(id));
  }

  protected clear(): void {
    this.picked.emit('');
  }
}
