import { createReducer, on } from '@ngrx/store';
import { IShoppingState } from '../../model/grocery-list.types';
import {
  addListCategoryObject,
  addListItem,
  removeListCategory,
  removeListItem,
  removeListItems,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/list/list.utils';
import { GroceryCategoriesActions } from '../actions/grocery-categories.actions';
import { GroceriesActions } from '../actions/groceries.actions';
import { ShoppingActions } from '../actions/shopping.actions';

export const initialState: IShoppingState = {
  id: '_shopping',
  items: [],
  mode: 'alphabetical',
  categories: [],
  showActionSheet: false,
};

// prettier-ignore
export const shoppingReducer = createReducer(
  initialState,
  on(ShoppingActions.addItem,(state, { item }): IShoppingState => addListItem(state, item)),
  on(ShoppingActions.removeItem,(state, { item }): IShoppingState => removeListItem(state, item)),
  on(ShoppingActions.removeItems,(state, { items }): IShoppingState => removeListItems(state, items)),
  on(ShoppingActions.updateItem,(state, { item }): IShoppingState => updateListItem(state, item)),
  on(ShoppingActions.updateSearch,(state, { searchQuery }): IShoppingState => updateListSearch(state, searchQuery)),
  on(ShoppingActions.updateFilter,(state, { filterBy }): IShoppingState => ({ ...state, filterBy, mode: 'alphabetical', })),
  on(ShoppingActions.updateMode, (state, { mode }): IShoppingState => updateListMode(state, mode)),
  on(ShoppingActions.updateSort, (state, { sortBy, sortDir }): IShoppingState => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(ShoppingActions.showActionSheet, (state):IShoppingState =>  ({...state, showActionSheet: true})),
  on(ShoppingActions.hideActionSheet, (state):IShoppingState =>  ({...state, showActionSheet: false})),
  on(GroceryCategoriesActions.add, (state, { category }): IShoppingState => addListCategoryObject(state, category)),
  on(GroceryCategoriesActions.remove, (state, { id }): IShoppingState => removeListCategory(state, id)),
  on(GroceryCategoriesActions.rename, (state, { id, name }): IShoppingState => updateListCategory(state, id, name)),

  on(GroceriesActions.loaded,(_state, { data }): IShoppingState => {
    return {...(data?.shopping ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined, showActionSheet: false};
  }),
);
