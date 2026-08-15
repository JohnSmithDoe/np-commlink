import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  addListItem,
  updateListItem,
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

  on(PlayersActions.addItem, (state, { item }): PlayersState => addListItem(state, item)),
  on(PlayersActions.updateItem, (state, { item }): PlayersState => updateListItem(state, item)),
  on(PlayersActions.updateSearch, (state, { searchQuery }): PlayersState => updateListSearch(state, searchQuery)),
  on(PlayersActions.updateFilter, (state, { filterBy }): PlayersState => ({ ...state, filterBy })),
  on(PlayersActions.updateSort, (state, { sortBy, sortDirection }): PlayersState => updateListSort(state, sortBy, sortDirection)),

  on(TrackplayActions.loaded, (state, { trackplay }): PlayersState => hydratedList({ ...initialPlayersState, ...(trackplay?.players ?? state) }))
);
