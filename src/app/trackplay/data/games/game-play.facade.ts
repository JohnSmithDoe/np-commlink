import { inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { TrackplayId } from '../../model/trackplay.types';
import { PlayersFacade } from '../players/players.facade';
import { GamesActions } from './games.actions';
import {
  selectGameById,
  selectLeadersByGame,
  selectRankingByGame,
  selectRoundsByGame,
  selectScoresByGame,
} from './games.selector';

@Service()
export class GamePlayFacade {
  readonly #store = inject(Store);

  readonly #players = inject(PlayersFacade);

  gameById(id: TrackplayId) {
    return this.#store.selectSignal(selectGameById(id));
  }
  roundsByGame(id: TrackplayId) {
    return this.#store.selectSignal(selectRoundsByGame(id));
  }
  scoresByGame(id: TrackplayId) {
    return this.#store.selectSignal(selectScoresByGame(id));
  }
  rankingByGame(id: TrackplayId) {
    return this.#store.selectSignal(selectRankingByGame(id));
  }
  nameOf(id: TrackplayId): string {
    return this.#players.nameOf(id);
  }
  leadersByGame(id: TrackplayId) {
    return this.#store.selectSignal(selectLeadersByGame(id));
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
