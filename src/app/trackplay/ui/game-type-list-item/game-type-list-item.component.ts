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
import { IGameType } from '../../model/trackplay.types';
import { BaseSwipeRow } from '../swipe-row/base-swipe-row';

/**
 * DUMB game-type row — a {@link BaseSwipeRow} whose delete side is gated by the
 * inherited `canDelete` (the built-in 'default' type is undeletable); tap the
 * body to select. Mirrors the legacy `game-type-list` renderer.
 */
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
  readonly gameType = input.required<IGameType>();

  readonly selectType = output<void>();

  constructor() {
    super();
    addIcons({ dice, trash, create });
  }
}
