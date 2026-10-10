import { createReducer, on } from '@ngrx/store';
import {
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { PlayersState } from '../../model/trackplay.types';
import { initialPlayersState } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { PlayersActions } from './players.actions';

// prettier-ignore
export const playersReducer = createReducer(
  initialPlayersState,

  on(PlayersActions.updateSearch, (state, { searchQuery }): PlayersState => updateListSearch(state, searchQuery)),
  on(PlayersActions.updateSort, (state, { sortBy, sortDirection }): PlayersState => updateListSort(state, sortBy, sortDirection)),

  on(TrackplayActions.loaded, (state, { trackplay }): PlayersState => trackplay ? { ...initialPlayersState, sort: trackplay.players?.sort ?? initialPlayersState.sort } : state)
);
