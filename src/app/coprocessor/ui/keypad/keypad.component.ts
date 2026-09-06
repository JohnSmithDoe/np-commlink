import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { CalcKey } from '../../model/calc.types';

@Component({
  selector: 'app-keypad',
  templateUrl: './keypad.component.html',
  styleUrl: './keypad.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, TranslatePipe],
})
export class KeypadComponent {
  readonly keys = input.required<readonly CalcKey[]>();

  readonly pressed = output<CalcKey>();
}
