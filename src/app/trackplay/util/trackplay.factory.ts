/* ─── why ─────────────────────────────────────────────────────────
 * `createRound` takes its `id` rather than minting one, because it is the
 * only factory a REDUCER still reaches, and whether to append depends on
 * state so the decision cannot move to dispatch time. A reducer that mints
 * is not a function of `(state, action)`: replay lands different state and
 * the persisted log stops describing the store it produced. Required, not
 * defaulted — a default would let the impurity back in silently.
 *
 * The other three are called from a facade and dispatch a finished entity,
 * so they can spread `createBaseItem`.
 * ───────────────────────────────────────────────────────────────── */

import { createBaseItem } from '../../@shared/util/app.factory';
import {
  Game,
  GamesState,
  GamesView,
  GameType,
  GameTypesState,
  GAME_TYPES_LIST_ID,
  GAMES_LIST_ID,
  Player,
  PlayersState,
  PLAYERS_LIST_ID,
  PlayerStats,
  Round,
  TrackplayId,
} from '../model/trackplay.types';

export const NO_PLAYER_STATS: PlayerStats = {
  play: 0,
  win: 0,
  loss: 0,
  open: 0,
};

export const DEFAULT_GAME_TYPE_ID: TrackplayId = 'default';

export function createPlayer(name: string): Player {
  return createBaseItem(name);
}

export function createGameType(name: string, winHigh: boolean): GameType {
  return { ...createBaseItem(name), winHigh };
}

export function createGame(
  name: string,
  typeId: TrackplayId = DEFAULT_GAME_TYPE_ID,
  playerIds: TrackplayId[] = []
): Game {
  const base = createBaseItem(name, typeId || DEFAULT_GAME_TYPE_ID);
  return {
    ...base,
    updatedAt: base.createdAt,
    playerIds,
    rounds: [],
    ended: false,
  };
}

export function createRound(id: TrackplayId): Round {
  return { id, values: {} };
}

export const DEFAULT_GAME_TYPES: readonly GameType[] = [
  { id: DEFAULT_GAME_TYPE_ID, name: 'Standard', winHigh: true },
  { id: 'rommee', name: 'Rommé', winHigh: false },
  { id: 'skat', name: 'Skat', winHigh: true },
];

export const initialPlayersState: PlayersState = {
  id: PLAYERS_LIST_ID,
  items: [],
  sort: { sortBy: 'name', sortDirection: 'asc' },
};

export const initialGamesState: GamesState = {
  id: GAMES_LIST_ID,
  items: [],
  sort: { sortBy: 'updatedAt', sortDirection: 'desc' },
  showEndedGames: true,
};

export const initialGamesForPlayerView: GamesView = {
  sort: { sortBy: 'updatedAt', sortDirection: 'desc' },
  showEndedGames: false,
};

export const initialGameTypesState: GameTypesState = {
  id: GAME_TYPES_LIST_ID,
  items: [...DEFAULT_GAME_TYPES],
};
