import { createReducer, on } from '@ngrx/store';
import {
  IGame,
  IPlayer,
  ITrackplayConfig,
  ITrackplayState,
  TID,
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

export const initialState: ITrackplayState = {
  players: {},
  games: {},
  gameTypes: { ...DEFAULT_GAME_TYPES },
  rounds: {},
  config: initialTrackplayConfig,
  lastDeleted: null,
};

// The reducer's own shape helpers — a write into one of the three keyed maps.
// They stay here rather than in `util/` because they carry no rule: each is one
// spread, and the reducer's handler table is their only reader.
const upsertPlayer = (
  state: ITrackplayState,
  player: IPlayer
): ITrackplayState => ({
  ...state,
  players: { ...state.players, [player.id]: player },
});

const upsertGame = (state: ITrackplayState, game: IGame): ITrackplayState => ({
  ...state,
  games: { ...state.games, [game.id]: game },
});

// Four handlers were the same three lines around a one-field change: look the
// game up, bail if it is gone, upsert it with the field replaced.
const patchGame = (
  state: ITrackplayState,
  gameId: TID,
  patch: Partial<IGame>
): ITrackplayState => {
  const game = state.games[gameId];
  return game ? upsertGame(state, { ...game, ...patch }) : state;
};

// …and three more were the same merge into a different config key.
const patchListConfig = (
  state: ITrackplayState,
  key: keyof ITrackplayConfig,
  config: Partial<ITrackplayConfig[typeof key]>
): ITrackplayState => ({
  ...state,
  config: { ...state.config, [key]: { ...state.config[key], ...config } },
});

// prettier-ignore
export const trackplayReducer = createReducer(
  initialState,

  // ── Page entry ─────────────────────────────────────────────────────────────
  on(TrackplayActions.enterGamePage, (state, { gameId }): ITrackplayState => ensureTrailingBlankRound(state, gameId)),

  // ── Players ──────────────────────────────────────────────────────────────
  on(TrackplayActions.createPlayer, (state, { name }): ITrackplayState => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return state;
    return upsertPlayer(state, createPlayer(trimmed));
  }),
  on(TrackplayActions.renamePlayer, (state, { playerId, name }): ITrackplayState => {
    const player = state.players[playerId];
    if (!player) return state;
    return upsertPlayer(state, { ...player, name: name.trim() });
  }),
  on(TrackplayActions.deletePlayer, (state, { player }): ITrackplayState => ({
    ...deletePlayerCascade(state, player),
    lastDeleted: snapshotFor(state, player.name),
  })),

  // ── Games ──────────────────────────────────────────────────────────────
  on(TrackplayActions.createGame, (state, { game }): ITrackplayState => upsertGame(state, game)),
  on(TrackplayActions.renameGame, (state, { gameId, name }): ITrackplayState => patchGame(state, gameId, { name: name.trim() })),
  on(TrackplayActions.changeGameType, (state, { gameId, typeId }): ITrackplayState => patchGame(state, gameId, { type: typeId })),
  on(TrackplayActions.setGamePlayers, (state, { gameId, players }): ITrackplayState => patchGame(state, gameId, { players })),
  // Not `patchGame`: this one derives its patch from the current value, so it
  // needs the game in hand rather than a literal to merge.
  on(TrackplayActions.toggleGameEnded, (state, { gameId }): ITrackplayState => {
    const game = state.games[gameId];
    return game ? upsertGame(state, { ...game, ended: !game.ended }) : state;
  }),
  on(TrackplayActions.deleteGame, (state, { game }): ITrackplayState => ({
    ...deleteGameCascade(state, game),
    lastDeleted: snapshotFor(state, game.name),
  })),

  // ── Game types ───────────────────────────────────────────────────────────
  on(TrackplayActions.createGameType, (state, { name, winHigh }): ITrackplayState => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return state;
    const type = createGameType(trimmed, winHigh);
    return { ...state, gameTypes: { ...state.gameTypes, [type.id]: type } };
  }),
  on(TrackplayActions.updateGameType, (state, { gameType }): ITrackplayState => ({
    ...state,
    gameTypes: { ...state.gameTypes, [gameType.id]: gameType },
  })),
  on(TrackplayActions.deleteGameType, (state, { gameType }): ITrackplayState => {
    // Returning `state` itself, not a copy: the undo toast fires on a *new*
    // `lastDeleted` reference, so a refused delete must leave the stash
    // reference-identical or it offers to restore an earlier deletion.
    if (gameType.id === DEFAULT_GAME_TYPE_ID) return state;
    return {
      ...deleteGameTypeCascade(state, gameType),
      lastDeleted: snapshotFor(state, gameType.name),
    };
  }),

  // ── Rounds / scoring ───────────────────────────────────────────────────────
  on(TrackplayActions.setRoundValue, (state, { gameId, roundId, playerId, value, now }): ITrackplayState =>
    setRoundValue(state, gameId, roundId, playerId, value, now)
  ),

  // ── Per-list config ──────────────────────────────────────────────────────
  on(TrackplayActions.updateGamesConfig, (state, { config }): ITrackplayState => patchListConfig(state, 'games', config)),
  on(TrackplayActions.updateGamesForPlayerConfig, (state, { config }): ITrackplayState => patchListConfig(state, 'gamesForPlayer', config)),
  on(TrackplayActions.updatePlayersConfig, (state, { config }): ITrackplayState => patchListConfig(state, 'players', config)),

  // ── Undo ─────────────────────────────────────────────────────────────────
  on(TrackplayActions.restoreLastDeleted, (state): ITrackplayState => {
    if (!state.lastDeleted) return state;
    return { ...state, ...state.lastDeleted.snapshot, lastDeleted: null };
  }),

  // ── Hydration ──────────────────────────────────────────────────────────────
  // Seed the 3 default game types when the loaded slice has none. Undo state
  // never survives a reload.
  on(TrackplayActions.loaded, (_state, { trackplay }): ITrackplayState => {
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
