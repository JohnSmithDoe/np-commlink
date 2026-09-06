import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
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

  setShowEnded(showEndedGames: boolean): void {
    this.#store.dispatch(GamesForPlayerActions.setShowEnded(showEndedGames));
  }
}
