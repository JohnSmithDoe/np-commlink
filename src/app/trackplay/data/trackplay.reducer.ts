import { createReducer, on } from '@ngrx/store';
import {
  Game,
  Player,
  TrackplayConfig,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';
import { TrackplayActions } from './trackplay.actions';
import {
  createGameType,
  createPlayer,
  DEFAULT_GAME_TYPE_ID,
  DEFAULT_GAME_TYPES,
  initialTrackplayConfig,
} from '../util/trackplay.factory';
import {
  deleteGameCascade,
  deleteGameTypeCascade,
  deletePlayerCascade,
  snapshotFor,
} from '../util/trackplay.cascade';
import {
  ensureTrailingBlankRound,
  setRoundValue,
} from '../util/trackplay.scoring';

export const initialState: TrackplayState = {
  players: {},
  games: {},
  gameTypes: { ...DEFAULT_GAME_TYPES },
  rounds: {},
  config: initialTrackplayConfig,
  lastDeleted: null,
};

const upsertPlayer = (
  state: TrackplayState,
  player: Player
): TrackplayState => ({
  ...state,
  players: { ...state.players, [player.id]: player },
});

const upsertGame = (state: TrackplayState, game: Game): TrackplayState => ({
  ...state,
  games: { ...state.games, [game.id]: game },
});

const patchGame = (
  state: TrackplayState,
  gameId: TrackplayId,
  patch: Partial<Game>
): TrackplayState => {
  const game = state.games[gameId];
  return game ? upsertGame(state, { ...game, ...patch }) : state;
};

const patchListConfig = (
  state: TrackplayState,
  key: keyof TrackplayConfig,
  config: Partial<TrackplayConfig[typeof key]>
): TrackplayState => ({
  ...state,
  config: { ...state.config, [key]: { ...state.config[key], ...config } },
});

// prettier-ignore
export const trackplayReducer = createReducer(
  initialState,

  on(TrackplayActions.enterGamePage, (state, { gameId }): TrackplayState => ensureTrailingBlankRound(state, gameId)),

  on(TrackplayActions.createPlayer, (state, { name }): TrackplayState => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return state;
    return upsertPlayer(state, createPlayer(trimmed));
  }),
  on(TrackplayActions.renamePlayer, (state, { playerId, name }): TrackplayState => {
    const player = state.players[playerId];
    if (!player) return state;
    return upsertPlayer(state, { ...player, name: name.trim() });
  }),
  on(TrackplayActions.deletePlayer, (state, { player }): TrackplayState => ({
    ...deletePlayerCascade(state, player),
    lastDeleted: snapshotFor(state, player.name),
  })),

  on(TrackplayActions.createGame, (state, { game }): TrackplayState => upsertGame(state, game)),
  on(TrackplayActions.renameGame, (state, { gameId, name }): TrackplayState => patchGame(state, gameId, { name: name.trim() })),
  on(TrackplayActions.changeGameType, (state, { gameId, typeId }): TrackplayState => patchGame(state, gameId, { type: typeId })),
  on(TrackplayActions.setGamePlayers, (state, { gameId, players }): TrackplayState => patchGame(state, gameId, { players })),
  on(TrackplayActions.toggleGameEnded, (state, { gameId }): TrackplayState => {
    const game = state.games[gameId];
    return game ? upsertGame(state, { ...game, ended: !game.ended }) : state;
  }),
  on(TrackplayActions.deleteGame, (state, { game }): TrackplayState => ({
    ...deleteGameCascade(state, game),
    lastDeleted: snapshotFor(state, game.name),
  })),

  on(TrackplayActions.createGameType, (state, { name, winHigh }): TrackplayState => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return state;
    const type = createGameType(trimmed, winHigh);
    return { ...state, gameTypes: { ...state.gameTypes, [type.id]: type } };
  }),
  on(TrackplayActions.updateGameType, (state, { gameType }): TrackplayState => ({
    ...state,
    gameTypes: { ...state.gameTypes, [gameType.id]: gameType },
  })),
  on(TrackplayActions.deleteGameType, (state, { gameType }): TrackplayState => {
    if (gameType.id === DEFAULT_GAME_TYPE_ID) return state;
    return {
      ...deleteGameTypeCascade(state, gameType),
      lastDeleted: snapshotFor(state, gameType.name),
    };
  }),

  on(TrackplayActions.setRoundValue, (state, { gameId, roundId, playerId, value, now }): TrackplayState =>
    setRoundValue(state, gameId, roundId, playerId, value, now)
  ),

  on(TrackplayActions.updateGamesConfig, (state, { config }): TrackplayState => patchListConfig(state, 'games', config)),
  on(TrackplayActions.updateGamesForPlayerConfig, (state, { config }): TrackplayState => patchListConfig(state, 'gamesForPlayer', config)),
  on(TrackplayActions.updatePlayersConfig, (state, { config }): TrackplayState => patchListConfig(state, 'players', config)),

  on(TrackplayActions.restoreLastDeleted, (state): TrackplayState => {
    if (!state.lastDeleted) return state;
    return { ...state, ...state.lastDeleted.snapshot, lastDeleted: null };
  }),

  on(TrackplayActions.loaded, (_state, { trackplay }): TrackplayState => {
    const loaded = trackplay ?? initialState;
    const gameTypes = Object.keys(loaded.gameTypes ?? {}).length > 0
      ? loaded.gameTypes
      : { ...DEFAULT_GAME_TYPES };
    return {
      ...initialState,
      ...loaded,
      gameTypes,
      config: loaded.config ?? initialTrackplayConfig,
      lastDeleted: null,
    };
  })
);
