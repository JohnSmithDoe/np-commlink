import { createReducer, on } from '@ngrx/store';
import { IStorageState } from '../../@shared/types';
import {
  addListCategory,
  addListItem,
  addShoppinglistToStorage,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSort,
} from './grocery-list/grocery-list.utils';
import { ApplicationActions } from '../../@shared/data/application.actions';
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
  on(StorageActions.addCategory, (state, { category }) =>  addListCategory(state, category)),
  on(StorageActions.removeCategory, (state, { category }) => removeListCategory(state, category)),
  on(StorageActions.updateCategory, (state, { original, newName }) => updateListCategory(state, original, newName)),

  on(ApplicationActions.loadedSuccessfully,(_state, { datastore }): IStorageState => {
    return {...(datastore.storage ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
