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
import { Player, PlayerStats } from '../../model/trackplay.types';
import { BaseSwipeRow } from '../swipe-row/base-swipe-row';

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
  readonly player = input.required<Player>();
  readonly stats = input.required<PlayerStats>();

  readonly selectPlayer = output<void>();

  constructor() {
    super();
    addIcons({ person, trash, create });
  }
}
