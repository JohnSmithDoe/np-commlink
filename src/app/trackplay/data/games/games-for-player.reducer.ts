import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { GamesView } from '../../model/trackplay.types';
import { initialGamesForPlayerView } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { GamesForPlayerActions } from './games-for-player.actions';

// prettier-ignore
export const gamesForPlayerReducer = createReducer(
  initialGamesForPlayerView,

  on(GamesForPlayerActions.updateSearch, (state, { searchQuery }): GamesView => updateListSearch(state, searchQuery)),
  on(GamesForPlayerActions.updateFilter, (state, { filterBy }): GamesView => ({ ...state, filterBy })),
  on(GamesForPlayerActions.updateSort, (state, { sortBy, sortDirection }): GamesView => updateListSort(state, sortBy, sortDirection)),
  on(GamesForPlayerActions.setShowEnded, (state, { showEndedGames }): GamesView => ({ ...state, showEndedGames })),

  on(TrackplayActions.loaded, (state, { trackplay }): GamesView => hydratedList({ ...initialGamesForPlayerView, ...(trackplay?.gamesForPlayer ?? state) }))
);
