import { createReducer, on } from '@ngrx/store';
import {
  STORAGE_LIST_ID,
  StorageState,
} from '../../model/household-list.types';
import {
  hydratedList,
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { addShoppinglistToStorage } from '../../util/household-list.utils';
import { HouseholdActions } from '../household.actions';
import { StorageActions } from './storage.actions';

export const initialState: StorageState = {
  id: STORAGE_LIST_ID,
  items: [],
};

// prettier-ignore
export const storageReducer = createReducer(
  initialState,
  on(StorageActions.addItem,(state, { item }): StorageState => addListItem(state, item)),
  on(StorageActions.removeItem,(state, { item }): StorageState => removeListItem(state, item)),
  on(StorageActions.updateItem,(state, { item }): StorageState => updateListItem(state, item)),
  on(StorageActions.updateSearch,(state, { searchQuery }): StorageState => updateListSearch(state, searchQuery)),
  on(StorageActions.updateFilter,(state, { filterBy }): StorageState => ({ ...state, filterBy, })),
  on(StorageActions.updateSort, (state, { sortBy, sortDirection }): StorageState => updateListSort(state, sortBy, sortDirection)),
  on(StorageActions.addShoppingList, (state, { items }): StorageState => addShoppinglistToStorage(state, items)),

  on(HouseholdActions.loaded,(_state, { data }): StorageState => {
    return hydratedList(data?.storage ?? _state);
  })
);
