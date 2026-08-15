import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { GameTypesFacade } from '../../data';
import { GameType, GAME_TYPES_LIST_ID } from '../../model/trackplay.types';
import { createGameType } from '../../util/trackplay.factory';

@Component({
  selector: 'app-edit-game-type-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-game-type-dialog.component.html',
  styleUrls: ['./edit-game-type-dialog.component.scss'],
  imports: [
    FormField,
    IonItem,
    IonLabel,
    IonToggle,
    TranslatePipe,
    ItemEditModalComponent,
  ],
})
export class EditGameTypeDialogComponent extends BaseEditItemDialog<GameType> {
  readonly #gameTypes = inject(GameTypesFacade);

  protected readonly listId: ItemListId = GAME_TYPES_LIST_ID;
  readonly siblings = this.#gameTypes.allItems;

  protected blank(): GameType {
    return createGameType('', true);
  }

  protected save(item: GameType): void {
    this.#gameTypes.saveItem(item);
  }
}
