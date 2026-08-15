import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { ItemListSortType } from '../../../@shared/model/item-list.types';
import {
  GameType,
  GAME_TYPES_LIST_ID,
  TrackplayId,
} from '../../model/trackplay.types';
import { createGameType } from '../../util/trackplay.factory';
import { selectGameTypesList } from '../trackplay.selector';
import { GameTypesActions } from './game-types.actions';
import {
  selectGameTypeById,
  selectGameTypeItems,
  selectGameTypesListItems,
  selectGameTypesSearchResult,
} from './game-types.selector';

@Injectable({ providedIn: 'root' })
export class GameTypesFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectGameTypesList);
  readonly allItems = this.#store.selectSignal(selectGameTypeItems);
  readonly items = this.#store.selectSignal(selectGameTypesListItems);
  readonly searchResult = this.#store.selectSignal(selectGameTypesSearchResult);

  gameTypeById(id: TrackplayId) {
    return this.#store.selectSignal(selectGameTypeById(id));
  }

  showCreateDialog(): void {
    this.#dialogs.open({
      item: createGameType(this.state().searchQuery ?? '', true),
      listId: GAME_TYPES_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: GameType): void {
    this.#dialogs.open({
      item,
      listId: GAME_TYPES_LIST_ID,
      editMode: 'update',
    });
  }

  saveItem(gameType: GameType): void {
    this.#store.dispatch(GameTypesActions.addOrUpdateItem(gameType));
  }

  search(searchQuery?: string): void {
    this.#store.dispatch(GameTypesActions.updateSearch(searchQuery));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(GameTypesActions.addItemFromSearch());
  }

  setSortMode(sortBy: ItemListSortType): void {
    this.#store.dispatch(GameTypesActions.updateSort(sortBy, 'toggle'));
  }

  removeItem(gameType: GameType): void {
    this.#store.dispatch(GameTypesActions.removeItem(gameType));
  }
}
