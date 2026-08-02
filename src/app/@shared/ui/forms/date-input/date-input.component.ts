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
