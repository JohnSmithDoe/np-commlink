import { createReducer, on } from '@ngrx/store';
import {
  IGame,
  IGameType,
  IPlayer,
  IRound,
  ITrackplayDeleted,
  ITrackplayState,
  TID,
} from '../../@shared/types';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { TrackplayActions } from './trackplay.actions';
import {
  createGame,
  createGameType,
  createPlayer,
  createRound,
  DEFAULT_GAME_TYPE_ID,
  DEFAULT_GAME_TYPES,
  initialTrackplayConfig,
} from '../util/trackplay.factory';

export const initialState: ITrackplayState = {
  players: {},
  games: {},
  gameTypes: { ...DEFAULT_GAME_TYPES },
  rounds: {},
  config: initialTrackplayConfig,
  lastDeleted: null,
};

// ── snapshot / undo helpers ──────────────────────────────────────────────────
// The reducer never mutates the maps in place (every change forks a new map),
// so capturing the current references is a safe single-level undo snapshot.
const snapshotFor = (
  state: ITrackplayState,
  name: string
): ITrackplayDeleted => ({
  name,
  snapshot: {
    players: state.players,
    games: state.games,
    gameTypes: state.gameTypes,
    rounds: state.rounds,
    config: state.config,
  },
});

// ── cascade deletes (mirror legacy data.service) ─────────────────────────────
const deletePlayerCascade = (
  state: ITrackplayState,
  player: IPlayer
): ITrackplayState => {
  const players = { ...state.players };
  delete players[player.id];
  const games = { ...state.games };
  const rounds = { ...state.rounds };

  for (const gameId of Object.keys(games)) {
    const game = games[gameId];
    if (!game.players.includes(player.id)) continue;
    const remaining = game.players.filter((id) => id !== player.id);
    if (remaining.length !== 0) {
      // still players left → drop this player's value from every round
      for (const rId of game.rounds) {
        const round = rounds[rId];
        if (!round) continue;
        const values = { ...round.values };
        delete values[player.id];
        rounds[rId] = { ...round, values };
      }
      games[gameId] = { ...game, players: remaining };
    } else if (game.ended) {
      // no players left, game already ended → drop game + rounds
      for (const rId of game.rounds) delete rounds[rId];
      delete games[gameId];
    } else {
      // no players left, keep the (empty) game but drop its rounds
      for (const rId of game.rounds) delete rounds[rId];
      games[gameId] = { ...game, players: [], rounds: [] };
    }
  }
  return { ...state, players, games, rounds };
};

const deleteGameCascade = (
  state: ITrackplayState,
  game: IGame
): ITrackplayState => {
  const games = { ...state.games };
  delete games[game.id];
  const rounds = { ...state.rounds };
  for (const rId of game.rounds) delete rounds[rId];
  return { ...state, games, rounds };
};

const deleteGameTypeCascade = (
  state: ITrackplayState,
  type: IGameType
): ITrackplayState => {
  if (type.id === DEFAULT_GAME_TYPE_ID) return state; // default is undeletable
  const gameTypes = { ...state.gameTypes };
  delete gameTypes[type.id];
  const games = { ...state.games };
  for (const gameId of Object.keys(games)) {
    if (games[gameId].type === type.id) {
      games[gameId] = { ...games[gameId], type: DEFAULT_GAME_TYPE_ID };
    }
  }
  let config = state.config;
  if (config.games.typeId === type.id) {
    config = { ...config, games: { ...config.games, typeId: '' } };
  }
  return { ...state, gameTypes, games, config };
};

// ── scoring helpers ──────────────────────────────────────────────────────────
const roundIsBlank = (round?: IRound): boolean =>
  !!round && Object.values(round.values).every((v) => !v);

// Guarantee the trailing blank round the scoring grid always shows.
const ensureTrailingBlankRound = (
  state: ITrackplayState,
  gameId: TID
): ITrackplayState => {
  const game = state.games[gameId];
  if (!game || game.ended) return state;
  const lastRoundId = game.rounds[game.rounds.length - 1];
  const lastRound = lastRoundId ? state.rounds[lastRoundId] : undefined;
  if (game.rounds.length > 0 && roundIsBlank(lastRound)) return state;

  const blank = createRound(game.rounds.length, game.players);
  return {
    ...state,
    rounds: { ...state.rounds, [blank.id]: blank },
    games: {
      ...state.games,
      [gameId]: { ...game, rounds: [...game.rounds, blank.id] },
    },
  };
};

const setRoundValue = (
  state: ITrackplayState,
  gameId: TID,
  roundId: TID,
  playerId: TID,
  value: number
): ITrackplayState => {
  const game = state.games[gameId];
  const round = state.rounds[roundId];
  if (!game || !round) return state;

  const rounds = {
    ...state.rounds,
    [roundId]: { ...round, values: { ...round.values, [playerId]: value } },
  };

  // Entering a non-zero value on the trailing round auto-appends a new blank.
  let gameRounds = game.rounds;
  const isLast = game.rounds[game.rounds.length - 1] === roundId;
  if (isLast && value !== 0) {
    const blank = createRound(game.rounds.length, game.players);
    rounds[blank.id] = blank;
    gameRounds = [...game.rounds, blank.id];
  }

  const now = Date.now();
  const games = {
    ...state.games,
    [gameId]: { ...game, rounds: gameRounds, updated: now },
  };
  const players = { ...state.players };
  for (const pid of game.players) {
    const p = players[pid];
    if (p) players[pid] = { ...p, lastPlayed: now };
  }
  return { ...state, rounds, games, players };
};

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

// prettier-ignore
export const trackplayReducer = createReducer(
  initialState,

  // ── Page entry ─────────────────────────────────────────────────────────────
  on(TrackplayActions.enterGamePage, (state, { gameId }): ITrackplayState => ensureTrailingBlankRound(state, gameId)),

  // ── Players ──────────────────────────────────────────────────────────────
  on(TrackplayActions.createPlayer, (state, { name }): ITrackplayState => {
    const trimmed = name.trim();
    if (!trimmed.length) return state;
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
  on(TrackplayActions.createGame, (state, { name, players }): ITrackplayState =>
    upsertGame(state, createGame(name, DEFAULT_GAME_TYPE_ID, players))
  ),
  on(TrackplayActions.renameGame, (state, { gameId, name }): ITrackplayState => {
    const game = state.games[gameId];
    if (!game) return state;
    return upsertGame(state, { ...game, name: name.trim() });
  }),
  on(TrackplayActions.changeGameType, (state, { gameId, typeId }): ITrackplayState => {
    const game = state.games[gameId];
    if (!game) return state;
    return upsertGame(state, { ...game, type: typeId });
  }),
  on(TrackplayActions.setGamePlayers, (state, { gameId, players }): ITrackplayState => {
    const game = state.games[gameId];
    if (!game) return state;
    return upsertGame(state, { ...game, players });
  }),
  on(TrackplayActions.toggleGameEnded, (state, { gameId }): ITrackplayState => {
    const game = state.games[gameId];
    if (!game) return state;
    return upsertGame(state, { ...game, ended: !game.ended });
  }),
  on(TrackplayActions.deleteGame, (state, { game }): ITrackplayState => ({
    ...deleteGameCascade(state, game),
    lastDeleted: snapshotFor(state, game.name),
  })),

  // ── Game types ───────────────────────────────────────────────────────────
  on(TrackplayActions.createGameType, (state, { name, winHigh }): ITrackplayState => {
    const trimmed = name.trim();
    if (!trimmed.length) return state;
    const type = createGameType(trimmed, winHigh);
    return { ...state, gameTypes: { ...state.gameTypes, [type.id]: type } };
  }),
  on(TrackplayActions.updateGameType, (state, { gameType }): ITrackplayState => ({
    ...state,
    gameTypes: { ...state.gameTypes, [gameType.id]: gameType },
  })),
  on(TrackplayActions.deleteGameType, (state, { gameType }): ITrackplayState => {
    if (gameType.id === DEFAULT_GAME_TYPE_ID) return state;
    return {
      ...deleteGameTypeCascade(state, gameType),
      lastDeleted: snapshotFor(state, gameType.name),
    };
  }),

  // ── Rounds / scoring ───────────────────────────────────────────────────────
  on(TrackplayActions.setRoundValue, (state, { gameId, roundId, playerId, value }): ITrackplayState =>
    setRoundValue(state, gameId, roundId, playerId, value)
  ),

  // ── Per-list config ──────────────────────────────────────────────────────
  on(TrackplayActions.updateGamesConfig, (state, { config }): ITrackplayState => ({
    ...state,
    config: { ...state.config, games: { ...state.config.games, ...config } },
  })),
  on(TrackplayActions.updateGamesForPlayerConfig, (state, { config }): ITrackplayState => ({
    ...state,
    config: {
      ...state.config,
      gamesForPlayer: { ...state.config.gamesForPlayer, ...config },
    },
  })),
  on(TrackplayActions.updatePlayersConfig, (state, { config }): ITrackplayState => ({
    ...state,
    config: { ...state.config, players: { ...state.config.players, ...config } },
  })),

  // ── Undo ─────────────────────────────────────────────────────────────────
  on(TrackplayActions.restoreLastDeleted, (state): ITrackplayState => {
    if (!state.lastDeleted) return state;
    return { ...state, ...state.lastDeleted.snapshot, lastDeleted: null };
  }),

  // ── Hydration ──────────────────────────────────────────────────────────────
  // Seed the 3 default game types when the loaded slice has none. Undo state
  // never survives a reload.
  on(ApplicationActions.loadedSuccessfully, (_state, { datastore }): ITrackplayState => {
    const loaded = datastore.trackplay ?? initialState;
    const gameTypes = Object.keys(loaded.gameTypes ?? {}).length
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
