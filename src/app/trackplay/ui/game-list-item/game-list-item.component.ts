import { DatePipe } from '@angular/common';
import {
  booleanAttribute,
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
import { create, playCircle, trash } from 'ionicons/icons';
import { IGame, TIonDragEvent } from '../../../@shared/types';
import { checkItemOptionsOnDrag } from '../../../@shared/util/app.utils';

/**
 * DUMB game row for the games list. Renders a sliding item: swipe the start
 * side (or tap the option) to delete, the end side to edit, tap the body to
 * open. Mirrors the legacy npTrackplay `game-list` renderer in the modern,
 * shadowrun-styled idiom. Holds no store — inputs in, outputs out.
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
    TranslateModule,
    DatePipe,
  ],
})
export class TrackplayGameListItemComponent {
  readonly game = input.required<IGame>();
  readonly typeName = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ionList = input.required<IonList>();

  readonly selectGame = output<void>();
  readonly editGame = output<void>();
  readonly deleteGame = output<void>();

  constructor() {
    addIcons({ playCircle, trash, create });
  }

  // Start side (negative amount) deletes; end side (positive) edits. Mirrors the
  // legacy deleteOnDrag sign math via the shared drag helper.
  handleDrag(ev: TIonDragEvent): void {
    switch (checkItemOptionsOnDrag(ev)) {
      case 'start':
        void this.emitDelete();
        break;
      case 'end':
        void this.emitEdit();
        break;
    }
  }

  async emitDelete(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.deleteGame.emit();
  }

  async emitEdit(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.editGame.emit();
  }
}
