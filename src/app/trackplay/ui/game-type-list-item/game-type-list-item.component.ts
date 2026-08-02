import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, dice, trash } from 'ionicons/icons';
import { GameType } from '../../model/trackplay.types';
import { BaseSwipeRow } from '../swipe-row/base-swipe-row';

@Component({
  selector: 'app-trackplay-game-type-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-type-list-item.component.html',
  styleUrls: ['./game-type-list-item.component.scss'],
  imports: [
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonItem,
    IonIcon,
    IonLabel,
    TranslatePipe,
  ],
})
export class TrackplayGameTypeListItemComponent extends BaseSwipeRow {
  readonly gameType = input.required<GameType>();

  readonly selectType = output<void>();

  constructor() {
    super();
    addIcons({ dice, trash, create });
  }
}
