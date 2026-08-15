/* ─── why ─────────────────────────────────────────────────────────
 * A game's type lives in the inherited `categoryIds`, not a `typeId`,
 * because `GameType` already IS a `Category` structurally — which buys the
 * chip bar, `matcherForFilter`, `?filter=` and the row's category note
 * with no trackplay code at all.
 *
 * What the array cannot say is that there is exactly one, always. That is
 * held by `gameTypeIdOf` and by `deleteGameTypeCascade`, which reassigns
 * to the default rather than leaving a game uncategorised the way the
 * shared cascade would: `winHigh` decides who won, so a game with no type
 * has no result.
 *
 * `showEndedGames` is a field, not a `filterBy` token, because the list
 * filters on two independent axes and `filterBy` is one opaque string.
 * `gamesForPlayer` is a second VIEW over the same games, so it carries
 * config and no items of its own.
 * ───────────────────────────────────────────────────────────────── */

import { Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { ItemList } from '../../@shared/model/item-list.types';

export type TrackplayId = string;

export const PLAYERS_LIST_ID = '_trackplay-players';
export const GAMES_LIST_ID = '_trackplay-games';
export const GAME_TYPES_LIST_ID = '_trackplay-game-types';

export interface Round {
  id: TrackplayId;
  values: Record<TrackplayId, number>;
}

export interface Player extends BaseItem {
  createdAt: Timestamp;
  lastPlayedAt?: Timestamp;
}

export interface GameType extends BaseItem {
  winHigh: boolean;
}

export interface Game extends BaseItem {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  playerIds: TrackplayId[];
  rounds: Round[]; // ordered; position is the round number
  ended: boolean;
}

export type GamesView = Pick<
  ItemList<Game>,
  'searchQuery' | 'sort' | 'filterBy'
> & { showEndedGames: boolean };

export type PlayersState = Readonly<
  ItemList<Player> & { id: typeof PLAYERS_LIST_ID }
>;
export type GamesState = Readonly<
  ItemList<Game> & { id: typeof GAMES_LIST_ID } & GamesView
>;
export type GameTypesState = Readonly<
  ItemList<GameType> & { id: typeof GAME_TYPES_LIST_ID }
>;

export interface PlayerStats {
  play: number;
  win: number;
  loss: number;
  open: number;
}

interface TrackplaySnapshot {
  players: Player[];
  games: Game[];
  gameTypes: GameType[];
}

export interface TrackplayDeleted {
  name: string;
  snapshot: TrackplaySnapshot;
}

export interface TrackplayState {
  players: PlayersState;
  games: GamesState;
  gamesForPlayer: GamesView;
  gameTypes: GameTypesState;
  lastDeleted: TrackplayDeleted | null;
}
