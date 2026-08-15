import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CategoryId } from '../../../@shared/model/category.types';
import {
  ItemListSortDirection,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';
import { selectGamesForPlayerView } from '../trackplay.selector';
import { GamesForPlayerActions } from './games-for-player.actions';
import {
  selectGamesForPlayerItems,
  selectGamesForPlayerList,
  selectGamesForPlayerSearchResult,
} from './games.selector';

@Injectable({ providedIn: 'root' })
export class GamesForPlayerFacade {
  readonly #store = inject(Store);

  readonly view = this.#store.selectSignal(selectGamesForPlayerView);
  readonly state = this.#store.selectSignal(selectGamesForPlayerList);
  readonly items = this.#store.selectSignal(selectGamesForPlayerItems);
  readonly searchResult = this.#store.selectSignal(
    selectGamesForPlayerSearchResult
  );

  search(searchQuery?: string): void {
    this.#store.dispatch(GamesForPlayerActions.updateSearch(searchQuery));
  }

  selectCategory(filterBy?: CategoryId): void {
    this.#store.dispatch(GamesForPlayerActions.updateFilter(filterBy));
  }

  setSortMode(
    sortBy: ItemListSortType,
    direction: ItemListSortDirection | 'toggle' = 'toggle'
  ): void {
    this.#store.dispatch(GamesForPlayerActions.updateSort(sortBy, direction));
  }

  setShowEnded(showEndedGames: boolean): void {
    this.#store.dispatch(GamesForPlayerActions.setShowEnded(showEndedGames));
  }
}
