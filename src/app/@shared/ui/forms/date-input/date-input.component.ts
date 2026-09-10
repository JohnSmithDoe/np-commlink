/* ─── why ─────────────────────────────────────────────────────────
 * The value is `''` when unset, never `null`: a form field spells an absent
 * date `''` and a stored one `undefined`, and a third spelling reaching only
 * into this component would have every caller translate at its own boundary.
 * So the control binds to `[formField]` directly wherever a date is held.
 * It is a DAY, not an instant: the calendar emits whatever minute the user
 * tapped at, and storing that gave one field two spellings once anything
 * else could write it.
 *
 * `trigger` resolves through `getElementById`, so the id has to be unique per
 * INSTANCE — a fixed one puts two pickers in one dialog on the same element,
 * and the second field silently opens the first field's calendar.
 *
 * `ion-datetime` localises nothing on its own: its three button labels are
 * English string defaults, and its month names follow the BROWSER rather than
 * the app, so a German app on an English phone spells the same date two ways.
 * Both are passed in — `LOCALE_ID` for the calendar, translated keys for the
 * buttons, the same pair every other date in the app already reads.
 *
 * The modal deliberately does NOT keep its contents mounted: a mounted
 * `ion-datetime` loses its month scroll when hidden and never regains it, so
 * every reopen showed the month before the stored one. `keepContentsMounted`
 * buys nothing here — it is required for `ion-datetime-button`, and the
 * trigger is a plain input.
 * ───────────────────────────────────────────────────────────────── */

import { DatePipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  LOCALE_ID,
  model,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import {
  IonDatetime,
  IonInput,
  IonItem,
  IonModal,
  DatetimeCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { isoDay } from '../../../util/formatting/date-format.utils';

let instances = 0;

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  imports: [DatePipe, IonDatetime, IonInput, IonItem, IonModal, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateInputComponent implements FormValueControl<string> {
  readonly value = model('');
  readonly label = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly triggerId = `date-input-${instances++}`;
  readonly locale = inject(LOCALE_ID);

  updateInputValue(event: DatetimeCustomEvent) {
    const { value } = event.detail;
    this.value.set(typeof value === 'string' ? isoDay(value) : '');
  }
}
