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
import { Game } from '../../model/trackplay.types';
import { BaseSwipeRow } from '../swipe-row/base-swipe-row';

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
  readonly game = input.required<Game>();
  readonly typeName = input('');

  readonly selectGame = output<void>();

  protected readonly disabled = computed(
    () => this.game().players.length === 0
  );

  constructor() {
    super();
    addIcons({ playCircle, trash, create });
  }
}
