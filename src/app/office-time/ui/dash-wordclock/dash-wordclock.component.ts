import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { WordclockComponent } from '../wordclock/wordclock.component';
import { WordclockSettings } from '../../util/wordclock.utils';

@Component({
  selector: 'app-dash-wordclock',
  templateUrl: './dash-wordclock.component.html',
  styleUrls: ['./dash-wordclock.component.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    WordclockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashWordclockComponent {
  readonly title = input<string | undefined>();

  readonly wordclockConfig: WordclockSettings = {
    showCorners: true,
    deZwanzigNach: false,
    deZwanzigVor: false,
    deDreiviertel: false,
  };
}
