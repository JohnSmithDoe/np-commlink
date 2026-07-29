import { DatePipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
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

/**
 * A clearable date as a Signal Forms control, so a dialog binds
 * `[formField]="form.<date>"` and the "a cleared box must not persist the string
 * 'Invalid Date'" rule lives in the schema (`requireParseableDate`) instead of
 * being hand-written per dialog. The model is named `value` because that name
 * *is* the framework contract — `[formField]` writes through it.
 *
 * Cleared and never-set are one state (`null`): `ion-datetime` reports a cleared
 * calendar as a non-string and a range selection as an array, and both map to
 * `null` rather than letting `['a','b']` through as a date.
 */
@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  imports: [DatePipe, IonDatetime, IonInput, IonItem, IonModal, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateInputComponent implements FormValueControl<string | null> {
  readonly value = model<string | null>(null);
  readonly label = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  updateInputValue(event: DatetimeCustomEvent) {
    const { value } = event.detail;
    this.value.set(typeof value === 'string' ? value : null);
  }
}
