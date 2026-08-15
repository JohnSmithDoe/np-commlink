/* ─── why ─────────────────────────────────────────────────────────
 * `selectRoutePlayerId` reads `:id` off the router rather than off an
 * `ActivatedRoute` snapshot in the page, because the player page's facade
 * is what needs it and a facade has no route. It is the same seam
 * `HouseholdListPageFacade` uses for its list id — and it makes the two
 * player-scoped views memoized selectors instead of factories a component
 * re-creates on every read.
 * ───────────────────────────────────────────────────────────────── */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectRouteParams as selectRouteParameters } from '../../@shared/data/router/router.selector';
import {
  GamesState,
  GamesView,
  GameTypesState,
  PlayersState,
  TrackplayDeleted,
  TrackplayId,
  TrackplayState,
} from '../model/trackplay.types';

export const TRACKPLAY_STATE_KEY = 'trackplay';

const selectTrackplayState =
  createFeatureSelector<TrackplayState>(TRACKPLAY_STATE_KEY);

export const selectTrackplayPersisted = createSelector(
  selectTrackplayState,
  (state): TrackplayState => ({ ...state, lastDeleted: null })
);

export const selectLastDeleted = createSelector(
  selectTrackplayState,
  (state): TrackplayDeleted | null => state.lastDeleted
);

export const selectPlayersList = createSelector(
  selectTrackplayState,
  (state): PlayersState => state.players
);

export const selectGamesList = createSelector(
  selectTrackplayState,
  (state): GamesState => state.games
);

export const selectGameTypesList = createSelector(
  selectTrackplayState,
  (state): GameTypesState => state.gameTypes
);

export const selectGamesForPlayerView = createSelector(
  selectTrackplayState,
  (state): GamesView => state.gamesForPlayer
);

export const selectRoutePlayerId = createSelector(
  selectRouteParameters,
  (parameters): TrackplayId | undefined =>
    (parameters as Record<string, string> | undefined)?.['id']
);
