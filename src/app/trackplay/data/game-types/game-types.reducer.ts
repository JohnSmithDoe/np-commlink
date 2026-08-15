import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  addListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { GameTypesState } from '../../model/trackplay.types';
import {
  DEFAULT_GAME_TYPES,
  initialGameTypesState,
} from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { GameTypesActions } from './game-types.actions';

// prettier-ignore
export const gameTypesReducer = createReducer(
  initialGameTypesState,

  on(GameTypesActions.addItem, (state, { item }): GameTypesState => addListItem(state, item)),
  on(GameTypesActions.updateItem, (state, { item }): GameTypesState => updateListItem(state, item)),
  on(GameTypesActions.updateSearch, (state, { searchQuery }): GameTypesState => updateListSearch(state, searchQuery)),
  on(GameTypesActions.updateSort, (state, { sortBy, sortDirection }): GameTypesState => updateListSort(state, sortBy, sortDirection)),

  on(TrackplayActions.loaded, (state, { trackplay }): GameTypesState => {
    const loaded = trackplay?.gameTypes ?? state;
    return {
      ...hydratedList({ ...initialGameTypesState, ...loaded }),
      items: loaded.items?.length ? loaded.items : [...DEFAULT_GAME_TYPES],
    };
  })
);
