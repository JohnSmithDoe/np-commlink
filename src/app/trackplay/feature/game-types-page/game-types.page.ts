import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, dice } from 'ionicons/icons';
import { GameType } from '../../model/trackplay.types';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { TRACKPLAY_EDIT_SWIPE_ACTION } from '../../ui/swipe-actions';
import { GameTypesFacade, GameTypesPageFacade } from '../../data';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';
import { EditGameTypeDialogComponent } from '../edit-game-type-dialog/edit-game-type-dialog.component';

@Component({
  selector: 'app-page-trackplay-game-types',
  templateUrl: './game-types.page.html',
  styleUrls: ['./game-types.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    EditGameTypeDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GameTypesPageFacade }],
})
export class TrackplayGameTypesPage {
  readonly editSwipeAction = TRACKPLAY_EDIT_SWIPE_ACTION;

  readonly #gameTypes = inject(GameTypesFacade);

  readonly defaultTypeId = DEFAULT_GAME_TYPE_ID;

  constructor() {
    addIcons({ create, dice });
  }

  openEdit(type: GameType): void {
    this.#gameTypes.showEditDialog(type);
  }

  deleteType(type: GameType): void {
    this.#gameTypes.removeItem(type);
  }
}
