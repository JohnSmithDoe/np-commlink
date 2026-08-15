import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  addListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { GamesState } from '../../model/trackplay.types';
import { initialGamesState } from '../../util/trackplay.factory';
import {
  ensureTrailingBlankRound,
  setRoundValue,
} from '../../util/trackplay.scoring';
import { TrackplayActions } from '../trackplay.actions';
import { GamesActions } from './games.actions';

// prettier-ignore
export const gamesReducer = createReducer(
  initialGamesState,

  on(GamesActions.addItem, (state, { item }): GamesState => addListItem(state, item)),
  on(GamesActions.updateItem, (state, { item }): GamesState => updateListItem(state, item)),
  on(GamesActions.updateSearch, (state, { searchQuery }): GamesState => updateListSearch(state, searchQuery)),
  on(GamesActions.updateFilter, (state, { filterBy }): GamesState => ({ ...state, filterBy })),
  on(GamesActions.updateSort, (state, { sortBy, sortDirection }): GamesState => updateListSort(state, sortBy, sortDirection)),
  on(GamesActions.setShowEnded, (state, { showEndedGames }): GamesState => ({ ...state, showEndedGames })),

  on(GamesActions.enterGamePage, (state, { gameId, roundId }): GamesState =>
    ensureTrailingBlankRound(state, gameId, roundId)),
  on(GamesActions.setRoundValue, (state, { gameId, roundId, playerId, value, at, nextRoundId }): GamesState =>
    setRoundValue(state, gameId, roundId, playerId, value, at, nextRoundId)),

  on(TrackplayActions.loaded, (state, { trackplay }): GamesState => hydratedList({ ...initialGamesState, ...(trackplay?.games ?? state) }))
);
