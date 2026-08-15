import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { PlayersFacade } from '../../data';
import { Player, PLAYERS_LIST_ID } from '../../model/trackplay.types';
import { createPlayer } from '../../util/trackplay.factory';

@Component({
  selector: 'app-edit-player-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemEditModalComponent],
  templateUrl: './edit-player-dialog.component.html',
})
export class EditPlayerDialogComponent extends BaseEditItemDialog<Player> {
  readonly #players = inject(PlayersFacade);

  protected readonly listId: ItemListId = PLAYERS_LIST_ID;
  readonly siblings = this.#players.allItems;

  protected blank(): Player {
    return createPlayer('');
  }

  protected save(item: Player): void {
    this.#players.saveItem(item);
  }
}
