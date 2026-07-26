import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { WordclockComponent } from '../wordclock/wordclock.component';
import { TSettings } from '../../util/wordclock.utils';

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

  // Minutes 1–4 past the nearest 5 are shown as dots in the four corners.
  readonly wordclockConfig: TSettings = {
    targetDate: '',
    showCorners: true,
    deZwanzigNach: false,
    deZwanzigVor: false,
    deDreiviertel: false,
  };
}
