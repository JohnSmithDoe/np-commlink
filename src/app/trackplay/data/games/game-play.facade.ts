import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TrackplayId } from '../../model/trackplay.types';
import { selectPlayerItems } from '../players/players.selector';
import { GamesActions } from './games.actions';
import {
  selectGameById,
  selectResultByGame,
  selectRoundsByGame,
  selectScoresByGame,
} from './games.selector';

@Injectable({ providedIn: 'root' })
export class GamePlayFacade {
  readonly #store = inject(Store);

  readonly players = this.#store.selectSignal(selectPlayerItems);

  gameById(id: TrackplayId) {
    return this.#store.selectSignal(selectGameById(id));
  }
  roundsByGame(id: TrackplayId) {
    return this.#store.selectSignal(selectRoundsByGame(id));
  }
  scoresByGame(id: TrackplayId) {
    return this.#store.selectSignal(selectScoresByGame(id));
  }
  resultByGame(id: TrackplayId) {
    return this.#store.selectSignal(selectResultByGame(id));
  }

  enterGamePage(gameId: TrackplayId): void {
    this.#store.dispatch(GamesActions.enterGamePage(gameId));
  }

  setRoundValue(
    gameId: TrackplayId,
    roundId: TrackplayId,
    playerId: TrackplayId,
    value: number
  ): void {
    this.#store.dispatch(
      GamesActions.setRoundValue(gameId, roundId, playerId, value)
    );
  }
}
