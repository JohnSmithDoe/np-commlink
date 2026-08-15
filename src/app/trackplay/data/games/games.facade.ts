import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { CategoryId } from '../../../@shared/model/category.types';
import {
  ItemListSortDirection,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';
import { Game, GAMES_LIST_ID, TrackplayId } from '../../model/trackplay.types';
import { createGame } from '../../util/trackplay.factory';
import { selectGamesList } from '../trackplay.selector';
import { GamesActions } from './games.actions';
import {
  selectGameById,
  selectGameItems,
  selectGamesListItems,
  selectGamesSearchResult,
} from './games.selector';

@Injectable({ providedIn: 'root' })
export class GamesFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectGamesList);
  readonly allItems = this.#store.selectSignal(selectGameItems);
  readonly items = this.#store.selectSignal(selectGamesListItems);
  readonly searchResult = this.#store.selectSignal(selectGamesSearchResult);

  gameById(id: TrackplayId) {
    return this.#store.selectSignal(selectGameById(id));
  }

  showCreateDialog(playerIds: TrackplayId[] = []): void {
    const { searchQuery, filterBy } = this.state();
    this.#dialogs.open({
      item: createGame(searchQuery ?? '', filterBy, playerIds),
      listId: GAMES_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Game): void {
    this.#dialogs.open({ item, listId: GAMES_LIST_ID, editMode: 'update' });
  }

  saveItem(game: Game): void {
    this.#store.dispatch(GamesActions.addOrUpdateItem(game));
  }

  removeItem(game: Game): void {
    this.#store.dispatch(GamesActions.removeItem(game));
  }

  search(searchQuery?: string): void {
    this.#store.dispatch(GamesActions.updateSearch(searchQuery));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(GamesActions.addItemFromSearch());
  }

  selectCategory(filterBy?: CategoryId): void {
    this.#store.dispatch(GamesActions.updateFilter(filterBy));
  }

  setSortMode(
    sortBy: ItemListSortType,
    direction: ItemListSortDirection | 'toggle' = 'toggle'
  ): void {
    this.#store.dispatch(GamesActions.updateSort(sortBy, direction));
  }

  setShowEnded(showEndedGames: boolean): void {
    this.#store.dispatch(GamesActions.setShowEnded(showEndedGames));
  }

  toggleEnded(game: Game): void {
    this.#store.dispatch(
      GamesActions.updateItem({ ...game, ended: !game.ended })
    );
  }
}
