import { createReducer, on } from '@ngrx/store';
import { IStorageState } from '../model';
import {
  addListCategoryObject,
  addListItem,
  addShoppinglistToStorage,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSort,
} from './grocery-list/grocery-list.utils';
import { GroceryCategoriesActions } from './grocery-list/grocery-categories.actions';
import { GroceriesActions } from './groceries.actions';
import { StorageActions } from './storage.actions';

export const initialState: IStorageState = {
  title: 'Storage',
  id: '_storage',
  items: [],
  mode: 'alphabetical',
  categories: [],
};

// prettier-ignore
export const storageReducer = createReducer(
  initialState,
  on(StorageActions.addItem,(state, { item }) => addListItem(state, item)),
  on(StorageActions.removeItem,(state, { item }) => removeListItem(state, item)),
  on(StorageActions.updateItem,(state, { item }) => updateListItem(state, item)),
  on(StorageActions.updateSearch,(state, { searchQuery }): IStorageState => searchQuery === state.searchQuery ? state : { ...state, searchQuery }),
  on(StorageActions.updateFilter,(state, { filterBy }): IStorageState => ({ ...state, filterBy, mode: 'alphabetical', })),
  on(StorageActions.updateMode, (state, { mode }) => updateListMode(state, mode)),
  on(StorageActions.updateSort, (state, { sortBy, sortDir }) => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(StorageActions.addShoppingList, (state, { items }) => addShoppinglistToStorage(state, items)),
  on(GroceryCategoriesActions.add, (state, { category }) => addListCategoryObject(state, category)),
  on(GroceryCategoriesActions.remove, (state, { id }) => removeListCategory(state, id)),
  on(GroceryCategoriesActions.rename, (state, { id, name }) => updateListCategory(state, id, name)),

  on(GroceriesActions.loaded,(_state, { data }): IStorageState => {
    return {...(data.storage ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
