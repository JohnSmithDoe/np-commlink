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
  IonList,
  IonText,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, person, trash } from 'ionicons/icons';
import { TIonDragEvent } from '../../../@shared/model/app.types';
import { IPlayer, IPlayerStats } from '../../model/trackplay.types';
import { revealedSideFromDrag } from '../../../@shared/util/app.utils';

/**
 * DUMB player row. Swipe start / tap option to delete, swipe end to edit, tap
 * body to open. Renders the derived win/loss/open + total-play stats passed in
 * — it never computes or stores them. Mirrors the legacy `player-list` renderer.
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
    TranslateModule,
    DatePipe,
  ],
})
export class TrackplayPlayerListItemComponent {
  readonly player = input.required<IPlayer>();
  readonly stats = input.required<IPlayerStats>();
  readonly ionList = input.required<IonList>();

  readonly selectPlayer = output<void>();
  readonly editPlayer = output<void>();
  readonly deletePlayer = output<void>();

  constructor() {
    addIcons({ person, trash, create });
  }

  deleteOrEditOnSwipe(event: TIonDragEvent): void {
    switch (revealedSideFromDrag(event)) {
      case 'start': {
        void this.emitDelete();
        break;
      }
      case 'end': {
        void this.emitEdit();
        break;
      }
    }
  }

  async emitDelete(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.deletePlayer.emit();
  }

  async emitEdit(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.editPlayer.emit();
  }
}
