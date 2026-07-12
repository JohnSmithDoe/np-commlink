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
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, dice, trash } from 'ionicons/icons';
import { IGameType, TIonDragEvent } from '../../../@shared/types';
import { checkItemOptionsOnDrag } from '../../../@shared/util/app.utils';

/**
 * DUMB game-type row. Swipe start / tap option to delete (only when
 * `canDelete` — the built-in 'default' type is undeletable), swipe end to
 * edit, tap body to select. Mirrors the legacy `game-type-list` renderer.
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
    TranslateModule,
  ],
})
export class TrackplayGameTypeListItemComponent {
  readonly gameType = input.required<IGameType>();
  readonly canDelete = input(false, { transform: booleanAttribute });
  readonly ionList = input.required<IonList>();

  readonly selectType = output<void>();
  readonly editType = output<void>();
  readonly deleteType = output<void>();

  constructor() {
    addIcons({ dice, trash, create });
  }

  handleDrag(ev: TIonDragEvent): void {
    switch (checkItemOptionsOnDrag(ev)) {
      case 'start':
        if (this.canDelete()) void this.emitDelete();
        break;
      case 'end':
        void this.emitEdit();
        break;
    }
  }

  async emitDelete(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.deleteType.emit();
  }

  async emitEdit(): Promise<void> {
    await this.ionList().closeSlidingItems();
    this.editType.emit();
  }
}
