import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonItem, IonLabel, IonNote } from '@ionic/angular/standalone';
import { TColor } from '../../../types';

@Component({
  selector: 'app-text-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-item.component.html',
  styleUrls: ['./text-item.component.scss'],
  imports: [IonItem, IonLabel, IonNote],
})
export class TextItemComponent {
  readonly label = input<string | null>();
  readonly color = input<TColor>();
  readonly helper = input<string>();
  readonly time = input<string>();
  readonly note = input<string | null>();

  readonly selectItem = output<void>();

  constructor() {}

  selectCurrent() {
    this.selectItem.emit();
  }
}
