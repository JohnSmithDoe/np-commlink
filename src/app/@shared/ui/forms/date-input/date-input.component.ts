import { DatePipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DatetimeCustomEvent } from '@ionic/angular';
import {
  IonDatetime,
  IonInput,
  IonItem,
  IonModal,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss'],
  imports: [
    DatePipe,
    IonDatetime,
    IonInput,
    IonItem,
    IonModal,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateInputComponent {
  label = input<string>();
  disabled = input(false, { transform: booleanAttribute });
  value = input<string | null>();
  updateValue = output<string | undefined>();

  updateInputValue(ev: DatetimeCustomEvent) {
    const value =
      typeof ev.detail.value === 'string' ? ev.detail.value : undefined;
    this.updateValue.emit(value);
  }
}
