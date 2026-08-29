/* ─── why ─────────────────────────────────────────────────────────
 * The player-scoped views read `:id` through `@shared`'s
 * `selectRouteEntityId` rather than off an `ActivatedRoute` snapshot in the
 * page, because the player page's facade is what needs it and a facade has
 * no route. It is the same seam `HouseholdListPageFacade` uses for its list
 * id — and it makes those views memoized selectors instead of factories a
 * component re-creates on every read.
 * ───────────────────────────────────────────────────────────────── */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  GamesState,
  GamesView,
  GameTypesState,
  PlayersState,
  TrackplayState,
} from '../model/trackplay.types';

export const TRACKPLAY_STATE_KEY = 'trackplay';

const selectTrackplayState =
  createFeatureSelector<TrackplayState>(TRACKPLAY_STATE_KEY);

export const selectTrackplayPersisted = selectTrackplayState;

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
