import { DatePipe } from '@angular/common';
import {
  computed,
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
import { create, playCircle, trash } from 'ionicons/icons';
import { IGame } from '../../model/trackplay.types';
import { BaseSwipeRow } from '../swipe-row/base-swipe-row';

/**
 * DUMB game row for the games list. A {@link BaseSwipeRow} whose body shows the
 * game's name, type and timestamps; tap it to open. Mirrors the legacy
 * npTrackplay `game-list` renderer in the modern, shadowrun-styled idiom. Holds
 * no store — inputs in, outputs out.
 */
@Component({
  selector: 'app-trackplay-game-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-list-item.component.html',
  styleUrls: ['./game-list-item.component.scss'],
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
export class TrackplayGameListItemComponent extends BaseSwipeRow {
  readonly game = input.required<IGame>();
  readonly typeName = input('');

  readonly selectGame = output<void>();

  // A game with no players cannot be opened — the rule belongs to the row that
  // owns the affordance, not to each of the three lists that render it.
  protected readonly disabled = computed(
    () => this.game().players.length === 0
  );

  constructor() {
    super();
    addIcons({ playCircle, trash, create });
  }
}
