import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import {
  ItemListSortDirection,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';
import { Player, PLAYERS_LIST_ID } from '../../model/trackplay.types';
import { createPlayer } from '../../util/trackplay.factory';
import { selectPlayersList } from '../trackplay.selector';
import { PlayersActions } from './players.actions';
import {
  selectPlayerItems,
  selectPlayersListItems,
  selectPlayersSearchResult,
  selectPlayerStats,
  selectRoutePlayer,
  selectStatsForRoutePlayer,
} from './players.selector';

@Injectable({ providedIn: 'root' })
export class PlayersFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectPlayersList);
  readonly allItems = this.#store.selectSignal(selectPlayerItems);
  readonly items = this.#store.selectSignal(selectPlayersListItems);
  readonly searchResult = this.#store.selectSignal(selectPlayersSearchResult);
  readonly stats = this.#store.selectSignal(selectPlayerStats);

  readonly routePlayer = this.#store.selectSignal(selectRoutePlayer);
  readonly routePlayerStats = this.#store.selectSignal(
    selectStatsForRoutePlayer
  );

  showCreateDialog(): void {
    this.#dialogs.open({
      item: createPlayer(this.state().searchQuery ?? ''),
      listId: PLAYERS_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Player): void {
    this.#dialogs.open({ item, listId: PLAYERS_LIST_ID, editMode: 'update' });
  }

  saveItem(player: Player): void {
    this.#store.dispatch(PlayersActions.addOrUpdateItem(player));
  }

  search(searchQuery?: string): void {
    this.#store.dispatch(PlayersActions.updateSearch(searchQuery));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(PlayersActions.addItemFromSearch());
  }

  setSortMode(
    sortBy: ItemListSortType,
    direction: ItemListSortDirection | 'toggle' = 'toggle'
  ): void {
    this.#store.dispatch(PlayersActions.updateSort(sortBy, direction));
  }

  removeItem(player: Player): void {
    this.#store.dispatch(PlayersActions.removeItem(player));
  }
}
