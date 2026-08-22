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
  imports: [IonItem, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberInputComponent {
  readonly label = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = input<string | number | null>();
  readonly updateValue = output<number>();

  updateInputValue(event: InputCustomEvent) {
    this.updateValue.emit(parseNumberInput(event));
  }
}
