import { createReducer, on } from '@ngrx/store';
import {
  IGame,
  IGameType,
  IPlayer,
  IRound,
  ITrackplayDeleted,
  ITrackplayState,
  TID,
} from '../../model/trackplay.types';
import { TrackplayActions } from '../actions/trackplay.actions';
import {
  createGame,
  createGameType,
  createPlayer,
  createRound,
  DEFAULT_GAME_TYPE_ID,
  DEFAULT_GAME_TYPES,
  initialTrackplayConfig,
} from '../../util/trackplay.factory';

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
  // `config` is deliberately absent: it is list-view settings, not deleted
  // data, and the settings popover is one tap away during the 8s toast — so
  // including it meant "undo delete" silently reverted a sort or filter too.
  snapshot: {
    players: state.players,
    games: state.games,
    gameTypes: state.gameTypes,
    rounds: state.rounds,
  },
});

// ── cascade deletes (mirror legacy data.service) ─────────────────────────────

// Games and rounds have to move in lockstep through a cascade, because a game
// owns its round ids — so the steps below rewrite one mutable pair.
type GamesAndRounds = {
  games: Record<TID, IGame>;
  rounds: Record<TID, IRound>;
};

const dropPlayerScoresFromRounds = (
  { games, rounds }: GamesAndRounds,
  game: IGame,
  playerId: TID
): void => {
  for (const roundId of game.rounds) {
    const round = rounds[roundId];
    if (!round) continue;
    const values = { ...round.values };
    delete values[playerId];
    rounds[roundId] = { ...round, values };
  }
  games[game.id] = {
    ...game,
    players: game.players.filter((id) => id !== playerId),
  };
};

const discardEndedEmptyGame = (
  { games, rounds }: GamesAndRounds,
  game: IGame
): void => {
  for (const roundId of game.rounds) delete rounds[roundId];
  delete games[game.id];
};

const emptyLiveGame = (
  { games, rounds }: GamesAndRounds,
  game: IGame
): void => {
  for (const roundId of game.rounds) delete rounds[roundId];
  games[game.id] = { ...game, players: [], rounds: [] };
};

// Losing your last player kills an already-ended game (nothing left to show) but
// only empties a live one, so it stays open for new players.
const detachPlayerFromGame = (
  target: GamesAndRounds,
  game: IGame,
  playerId: TID
): void => {
  const remaining = game.players.filter((id) => id !== playerId);
  if (remaining.length > 0) dropPlayerScoresFromRounds(target, game, playerId);
  else if (game.ended) discardEndedEmptyGame(target, game);
  else emptyLiveGame(target, game);
};

const deletePlayerCascade = (
  state: ITrackplayState,
  player: IPlayer
): ITrackplayState => {
  const players = { ...state.players };
  delete players[player.id];
  const target: GamesAndRounds = {
    games: { ...state.games },
    rounds: { ...state.rounds },
  };
  for (const game of Object.values(state.games)) {
    if (!game.players.includes(player.id)) continue;
    detachPlayerFromGame(target, game, player.id);
  }
  return { ...state, players, ...target };
};

const deleteGameCascade = (
  state: ITrackplayState,
  game: IGame
): ITrackplayState => {
  const games = { ...state.games };
  delete games[game.id];
  const rounds = { ...state.rounds };
  for (const roundId of game.rounds) delete rounds[roundId];
  return { ...state, games, rounds };
};

const reassignGamesToDefaultType = (
  games: Record<TID, IGame>,
  typeId: TID
): Record<TID, IGame> =>
  Object.fromEntries(
    Object.entries(games).map(([id, game]) => [
      id,
      game.type === typeId ? { ...game, type: DEFAULT_GAME_TYPE_ID } : game,
    ])
  );

// Both game lists can be filtered by type; a deleted type must not stay selected
// in either, or the list silently shows nothing.
const clearDeletedTypeFromFilters = (
  config: ITrackplayState['config'],
  typeId: TID
): ITrackplayState['config'] => {
  let next = config;
  for (const key of ['games', 'gamesForPlayer'] as const) {
    if (next[key].typeId !== typeId) continue;
    next = { ...next, [key]: { ...next[key], typeId: '' } };
  }
  return next;
};

const deleteGameTypeCascade = (
  state: ITrackplayState,
  type: IGameType
): ITrackplayState => {
  if (type.id === DEFAULT_GAME_TYPE_ID) return state; // default is undeletable
  const gameTypes = { ...state.gameTypes };
  delete gameTypes[type.id];
  return {
    ...state,
    gameTypes,
    games: reassignGamesToDefaultType(state.games, type.id),
    config: clearDeletedTypeFromFilters(state.config, type.id),
  };
};

// ── scoring helpers ──────────────────────────────────────────────────────────
const isRoundBlank = (round?: IRound): boolean =>
  !!round && Object.values(round.values).every((v) => !v);

const appendBlankRound = (
  state: ITrackplayState,
  game: IGame
): ITrackplayState => {
  const blank = createRound(game.rounds.length, game.players);
  return {
    ...state,
    rounds: { ...state.rounds, [blank.id]: blank },
    games: {
      ...state.games,
      [game.id]: { ...game, rounds: [...game.rounds, blank.id] },
    },
  };
};

// Guarantee the trailing blank round the scoring grid always shows.
const ensureTrailingBlankRound = (
  state: ITrackplayState,
  gameId: TID
): ITrackplayState => {
  const game = state.games[gameId];
  if (!game || game.ended) return state;
  const lastRoundId = game.rounds.at(-1);
  const lastRound = lastRoundId ? state.rounds[lastRoundId] : undefined;
  if (game.rounds.length > 0 && isRoundBlank(lastRound)) return state;
  return appendBlankRound(state, game);
};

const withRoundValue = (
  state: ITrackplayState,
  round: IRound,
  playerId: TID,
  value: number
): ITrackplayState => ({
  ...state,
  rounds: {
    ...state.rounds,
    [round.id]: { ...round, values: { ...round.values, [playerId]: value } },
  },
});

// Scoring the trailing round means the game continues, so a fresh blank row has
// to appear below it. A zero is not a score — it is the blank's own value.
const shouldAppendBlankRound = (
  game: IGame,
  roundId: TID,
  value: number
): boolean => game.rounds.at(-1) === roundId && value !== 0;

const touchGameAndPlayers = (
  state: ITrackplayState,
  gameId: TID,
  now: number
): ITrackplayState => {
  const game = state.games[gameId];
  const players = { ...state.players };
  for (const playerId of game.players) {
    const player = players[playerId];
    if (player) players[playerId] = { ...player, lastPlayed: now };
  }
  return {
    ...state,
    games: { ...state.games, [gameId]: { ...game, updated: now } },
    players,
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
  // Every cell blur dispatches, changed or not. Without this the unchanged case
  // still bumped the game's `updated` and every participant's `lastPlayed`, and
  // re-persisted the whole slice.
  if (round.values[playerId] === value) return state;
  const scored = withRoundValue(state, round, playerId, value);
  const grown = shouldAppendBlankRound(game, roundId, value)
    ? appendBlankRound(scored, game)
    : scored;
  return touchGameAndPlayers(grown, gameId, Date.now());
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
    if (trimmed.length === 0) return state;
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
