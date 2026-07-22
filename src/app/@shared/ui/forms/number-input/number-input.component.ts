import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonInput, IonItem, InputCustomEvent } from '@ionic/angular/standalone';
import { parseNumberInput } from '../../../util/app.utils';

@Component({
  selector: 'app-number-input',
  templateUrl: './number-input.component.html',
  styleUrls: ['./number-input.component.scss'],
  imports: [IonItem, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberInputComponent {
  label = input<string>();
  disabled = input(false, { transform: booleanAttribute });
  value = input<string | number | null>();
  updateValue = output<number>();

  updateInputValue(event: InputCustomEvent) {
    this.updateValue.emit(parseNumberInput(event));
  }
}
