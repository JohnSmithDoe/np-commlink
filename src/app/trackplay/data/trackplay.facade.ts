import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Game,
  GameConfig,
  GameType,
  Player,
  PlayersConfig,
  TrackplayId,
} from '../model/trackplay.types';
import { createGame as buildGame } from '../util/trackplay.factory';
import { TrackplayActions } from './trackplay.actions';
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
} from './trackplay.selector';

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

  gameById(id: TrackplayId) {
    return this.#store.selectSignal(selectGameById(id));
  }
  playerById(id: TrackplayId) {
    return this.#store.selectSignal(selectPlayerById(id));
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
  gamesForPlayer(id: TrackplayId) {
    return this.#store.selectSignal(selectGamesForPlayer(id));
  }
  statsForPlayer(id: TrackplayId) {
    return this.#store.selectSignal(selectStatsForPlayer(id));
  }

  enterGamePage(gameId: TrackplayId): void {
    this.#store.dispatch(TrackplayActions.enterGamePage(gameId));
  }

  createPlayer(name: string): void {
    this.#store.dispatch(TrackplayActions.createPlayer(name));
  }
  renamePlayer(playerId: TrackplayId, name: string): void {
    this.#store.dispatch(TrackplayActions.renamePlayer(playerId, name));
  }
  deletePlayer(player: Player): void {
    this.#store.dispatch(TrackplayActions.deletePlayer(player));
  }

  createGame(
    name: string,
    typeId: TrackplayId,
    players: TrackplayId[]
  ): TrackplayId {
    const game = buildGame(name, typeId, players);
    this.#store.dispatch(TrackplayActions.createGame(game));
    return game.id;
  }
  renameGame(gameId: TrackplayId, name: string): void {
    this.#store.dispatch(TrackplayActions.renameGame(gameId, name));
  }
  changeGameType(gameId: TrackplayId, typeId: TrackplayId): void {
    this.#store.dispatch(TrackplayActions.changeGameType(gameId, typeId));
  }
  setGamePlayers(gameId: TrackplayId, players: TrackplayId[]): void {
    this.#store.dispatch(TrackplayActions.setGamePlayers(gameId, players));
  }
  toggleGameEnded(gameId: TrackplayId): void {
    this.#store.dispatch(TrackplayActions.toggleGameEnded(gameId));
  }
  deleteGame(game: Game): void {
    this.#store.dispatch(TrackplayActions.deleteGame(game));
  }

  createGameType(name: string, winHigh: boolean): void {
    this.#store.dispatch(TrackplayActions.createGameType(name, winHigh));
  }
  updateGameType(gameType: GameType): void {
    this.#store.dispatch(TrackplayActions.updateGameType(gameType));
  }
  deleteGameType(gameType: GameType): void {
    this.#store.dispatch(TrackplayActions.deleteGameType(gameType));
  }

  setRoundValue(
    gameId: TrackplayId,
    roundId: TrackplayId,
    playerId: TrackplayId,
    value: number
  ): void {
    this.#store.dispatch(
      TrackplayActions.setRoundValue(gameId, roundId, playerId, value)
    );
  }

  updateGamesConfig(config: Partial<GameConfig>): void {
    this.#store.dispatch(TrackplayActions.updateGamesConfig(config));
  }
  updateGamesForPlayerConfig(config: Partial<GameConfig>): void {
    this.#store.dispatch(TrackplayActions.updateGamesForPlayerConfig(config));
  }
  updatePlayersConfig(config: Partial<PlayersConfig>): void {
    this.#store.dispatch(TrackplayActions.updatePlayersConfig(config));
  }
}
