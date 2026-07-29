import { createReducer, on } from '@ngrx/store';
import { IStorageState } from '../../model/grocery-list.types';
import {
  addListCategoryObject,
  addListItem,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/list/list.utils';
import { addShoppinglistToStorage } from '../../util/grocery-list.utils';
import { GroceryCategoriesActions } from '../actions/grocery-categories.actions';
import { GroceriesActions } from '../actions/groceries.actions';
import { StorageActions } from '../actions/storage.actions';

export const initialState: IStorageState = {
  id: '_storage',
  items: [],
  mode: 'alphabetical',
  categories: [],
};

// prettier-ignore
export const storageReducer = createReducer(
  initialState,
  on(StorageActions.addItem,(state, { item }): IStorageState => addListItem(state, item)),
  on(StorageActions.removeItem,(state, { item }): IStorageState => removeListItem(state, item)),
  on(StorageActions.updateItem,(state, { item }): IStorageState => updateListItem(state, item)),
  on(StorageActions.updateSearch,(state, { searchQuery }): IStorageState => updateListSearch(state, searchQuery)),
  on(StorageActions.updateFilter,(state, { filterBy }): IStorageState => ({ ...state, filterBy, mode: 'alphabetical', })),
  on(StorageActions.updateMode, (state, { mode }): IStorageState => updateListMode(state, mode)),
  on(StorageActions.updateSort, (state, { sortBy, sortDir }): IStorageState => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(StorageActions.addShoppingList, (state, { items }): IStorageState => addShoppinglistToStorage(state, items)),
  on(GroceryCategoriesActions.add, (state, { category }): IStorageState => addListCategoryObject(state, category)),
  on(GroceryCategoriesActions.remove, (state, { id }): IStorageState => removeListCategory(state, id)),
  on(GroceryCategoriesActions.rename, (state, { id, name }): IStorageState => updateListCategory(state, id, name)),

  on(GroceriesActions.loaded,(_state, { data }): IStorageState => {
    return {...(data?.storage ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
