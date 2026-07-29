import { DatePipe } from '@angular/common';
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
  IonText,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, person, trash } from 'ionicons/icons';
import { IPlayer, IPlayerStats } from '../../model/trackplay.types';
import { BaseSwipeRow } from '../swipe-row/base-swipe-row';

/**
 * DUMB player row — a {@link BaseSwipeRow}; tap the body to open. Renders the
 * derived win/loss/open + total-play stats passed in — it never computes or
 * stores them. Mirrors the legacy `player-list` renderer.
 */
@Component({
  selector: 'app-trackplay-player-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-list-item.component.html',
  styleUrls: ['./player-list-item.component.scss'],
  imports: [
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonItem,
    IonIcon,
    IonLabel,
    IonText,
    TranslatePipe,
    DatePipe,
  ],
})
export class TrackplayPlayerListItemComponent extends BaseSwipeRow {
  readonly player = input.required<IPlayer>();
  readonly stats = input.required<IPlayerStats>();

  readonly selectPlayer = output<void>();

  constructor() {
    super();
    addIcons({ person, trash, create });
  }
}
