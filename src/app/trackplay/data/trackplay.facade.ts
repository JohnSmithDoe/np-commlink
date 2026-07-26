import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  IGame,
  IGameConfig,
  IGameType,
  IPlayer,
  TID,
} from '../model/trackplay.types';
import { TrackplayActions } from './actions/trackplay.actions';
import {
  selectGameById,
  selectGameList,
  selectGames,
  selectGamesForPlayer,
  selectGameTypeList,
  selectGameTypes,
  selectPlayerById,
  selectPlayerList,
  selectPlayers,
  selectPlayerStats,
  selectResultByGame,
  selectRoundsByGame,
  selectScoresByGame,
  selectStatsForPlayer,
  selectTrackplayConfig,
  selectWinnerByGame,
} from './selectors/trackplay.selector';

/**
 * The `trackplay` (TRACKPLAY) domain facade — the single NgRx surface for every
 * trackplay component (games/players/player/game-types lists, the scoring grid,
 * and the game/player/type edit dialogs + settings popover). Injects `Store` so
 * the components never do. Route-scoped reads (a game's rounds, a player's
 * stats) are factory methods returning a signal, since they depend on a runtime
 * id.
 */
@Injectable({ providedIn: 'root' })
export class TrackplayFacade {
  readonly #store = inject(Store);

  readonly players = this.#store.selectSignal(selectPlayers);
  readonly games = this.#store.selectSignal(selectGames);
  readonly gameTypes = this.#store.selectSignal(selectGameTypes);
  readonly config = this.#store.selectSignal(selectTrackplayConfig);
  readonly gameList = this.#store.selectSignal(selectGameList);
  readonly playerList = this.#store.selectSignal(selectPlayerList);
  readonly gameTypeList = this.#store.selectSignal(selectGameTypeList);
  readonly playerStats = this.#store.selectSignal(selectPlayerStats);

  // Route-parameterised reads (called once from a component field initializer).
  gameById(id: TID) {
    return this.#store.selectSignal(selectGameById(id));
  }
  playerById(id: TID) {
    return this.#store.selectSignal(selectPlayerById(id));
  }
  roundsByGame(id: TID) {
    return this.#store.selectSignal(selectRoundsByGame(id));
  }
  scoresByGame(id: TID) {
    return this.#store.selectSignal(selectScoresByGame(id));
  }
  resultByGame(id: TID) {
    return this.#store.selectSignal(selectResultByGame(id));
  }
  winnerByGame(id: TID) {
    return this.#store.selectSignal(selectWinnerByGame(id));
  }
  gamesForPlayer(id: TID) {
    return this.#store.selectSignal(selectGamesForPlayer(id));
  }
  statsForPlayer(id: TID) {
    return this.#store.selectSignal(selectStatsForPlayer(id));
  }

  // ── Page entry ───────────────────────────────────────────────────────────
  enterGamePage(gameId: TID): void {
    this.#store.dispatch(TrackplayActions.enterGamePage(gameId));
  }

  // ── Players ──────────────────────────────────────────────────────────────
  createPlayer(name: string): void {
    this.#store.dispatch(TrackplayActions.createPlayer(name));
  }
  renamePlayer(playerId: TID, name: string): void {
    this.#store.dispatch(TrackplayActions.renamePlayer(playerId, name));
  }
  deletePlayer(player: IPlayer): void {
    this.#store.dispatch(TrackplayActions.deletePlayer(player));
  }

  // ── Games ────────────────────────────────────────────────────────────────
  createGame(name: string, players: TID[]): void {
    this.#store.dispatch(TrackplayActions.createGame(name, players));
  }
  renameGame(gameId: TID, name: string): void {
    this.#store.dispatch(TrackplayActions.renameGame(gameId, name));
  }
  changeGameType(gameId: TID, typeId: TID): void {
    this.#store.dispatch(TrackplayActions.changeGameType(gameId, typeId));
  }
  setGamePlayers(gameId: TID, players: TID[]): void {
    this.#store.dispatch(TrackplayActions.setGamePlayers(gameId, players));
  }
  toggleGameEnded(gameId: TID): void {
    this.#store.dispatch(TrackplayActions.toggleGameEnded(gameId));
  }
  deleteGame(game: IGame): void {
    this.#store.dispatch(TrackplayActions.deleteGame(game));
  }

  // ── Game types ───────────────────────────────────────────────────────────
  createGameType(name: string, winHigh: boolean): void {
    this.#store.dispatch(TrackplayActions.createGameType(name, winHigh));
  }
  updateGameType(gameType: IGameType): void {
    this.#store.dispatch(TrackplayActions.updateGameType(gameType));
  }
  deleteGameType(gameType: IGameType): void {
    this.#store.dispatch(TrackplayActions.deleteGameType(gameType));
  }

  // ── Rounds / scoring ─────────────────────────────────────────────────────
  setRoundValue(gameId: TID, roundId: TID, playerId: TID, value: number): void {
    this.#store.dispatch(
      TrackplayActions.setRoundValue(gameId, roundId, playerId, value)
    );
  }

  // ── Per-list sort/filter config ──────────────────────────────────────────
  updateGamesConfig(config: Partial<IGameConfig>): void {
    this.#store.dispatch(TrackplayActions.updateGamesConfig(config));
  }
  updateGamesForPlayerConfig(config: Partial<IGameConfig>): void {
    this.#store.dispatch(TrackplayActions.updateGamesForPlayerConfig(config));
  }
  updatePlayersConfig(config: {
    sort?: 'name' | 'date' | 'last';
    dir?: 'asc' | 'desc';
    filter?: string;
  }): void {
    this.#store.dispatch(TrackplayActions.updatePlayersConfig(config));
  }
}
