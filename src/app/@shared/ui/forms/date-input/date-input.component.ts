import { DatePipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
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
  @Input() label?: string;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() value?: string | null;
  @Output() updateValue = new EventEmitter<string>();

  constructor() {}

  updateInputValue(ev: DatetimeCustomEvent) {
    const value =
      typeof ev.detail.value === 'string' ? ev.detail.value : undefined;
    this.updateValue.emit(value);
  }
}
