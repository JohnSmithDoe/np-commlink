import { createReducer, on } from '@ngrx/store';
import { IStorageState } from '../../model/grocery-list.types';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { addShoppinglistToStorage } from '../../util/grocery-list.utils';
import { GroceriesActions } from '../groceries/groceries.actions';
import { StorageActions } from './storage.actions';

export const initialState: IStorageState = {
  id: '_storage',
  items: [],
};

// prettier-ignore
export const storageReducer = createReducer(
  initialState,
  on(StorageActions.addItem,(state, { item }): IStorageState => addListItem(state, item)),
  on(StorageActions.removeItem,(state, { item }): IStorageState => removeListItem(state, item)),
  on(StorageActions.updateItem,(state, { item }): IStorageState => updateListItem(state, item)),
  on(StorageActions.updateSearch,(state, { searchQuery }): IStorageState => updateListSearch(state, searchQuery)),
  on(StorageActions.updateFilter,(state, { filterBy }): IStorageState => ({ ...state, filterBy, })),
  on(StorageActions.updateSort, (state, { sortBy, sortDirection }): IStorageState => ({ ...state, sort: updateListSort(sortBy, sortDirection, state.sort?.sortDirection),})),
  on(StorageActions.addShoppingList, (state, { items }): IStorageState => addShoppinglistToStorage(state, items)),

  on(GroceriesActions.loaded,(_state, { data }): IStorageState => {
    return {...(data?.storage ?? _state), searchQuery:undefined,filterBy: undefined};
  })
);
