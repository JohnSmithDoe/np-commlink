/* ─── why ─────────────────────────────────────────────────────────
 * `ion-button`, not `ion-chip`: a chip renders a bare shadow host with no
 * role, so it takes no focus and answers no key — the same reason
 * `category-filter-bar` gives. A chip is the shape here, never the element.
 *
 * `pick` resolves the date on the CLICK rather than reading a precomputed
 * table, so "today" cannot go stale in a dialog left open across midnight.
 * The highlight recomputes off `value` alone, which is the only thing that
 * moves it in practice.
 *
 * Clear is DISABLED when there is nothing to clear, not hidden: clearing is
 * what empties the value, so a button that unmounts on its own click drops
 * the focus it was holding onto the body.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Marker } from '../../../model/app.types';
import { isoDay } from '../../../util/formatting/date-format.utils';
import {
  DATE_SHORTCUT_IDS,
  DateShortcutId,
  dateForShortcut,
} from '../../../util/formatting/date-shortcuts.utils';

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
  imports: [IonButton, IonIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateShortcutsComponent {
  readonly value = input('');
  readonly picked = output<string>();

  constructor() {
    addIcons({ closeOutline });
  }

  protected readonly ids = DATE_SHORTCUT_IDS;
  protected readonly labels = SHORTCUT_LABELS;

  protected readonly activeId = computed<DateShortcutId | undefined>(() => {
    const current = this.value();
    if (!current) return;
    const day = isoDay(current);
    return this.ids.find((id) => dateForShortcut(id) === day);
  });

  protected pick(id: DateShortcutId): void {
    this.picked.emit(dateForShortcut(id));
  }

  protected clear(): void {
    this.picked.emit('');
  }
}
