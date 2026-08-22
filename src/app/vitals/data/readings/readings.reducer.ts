import { createReducer, on } from '@ngrx/store';
import {
  addListItem,
  hydratedList,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { ReadingsState } from '../../model/vitals.types';
import { initialReadingsState } from '../../util/vitals.factory';
import { VitalsActions } from '../vitals.actions';
import { ReadingsActions } from './readings.actions';

// prettier-ignore
export const readingsReducer = createReducer(
  initialReadingsState,

  on(ReadingsActions.addItem, (state, { item }): ReadingsState => addListItem(state, item)),
  on(ReadingsActions.updateItem, (state, { item }): ReadingsState => updateListItem(state, item)),
  on(ReadingsActions.removeItem, (state, { item }): ReadingsState => removeListItem(state, item)),
  on(ReadingsActions.updateSearch, (state, { searchQuery }): ReadingsState => updateListSearch(state, searchQuery)),
  on(ReadingsActions.updateSort, (state, { sortBy, sortDirection }): ReadingsState => updateListSort(state, sortBy, sortDirection)),

  on(VitalsActions.loaded, (state, { vitals }): ReadingsState => hydratedList({ ...initialReadingsState, ...(vitals?.readings ?? state) }))
);
