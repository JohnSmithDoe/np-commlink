import { createReducer, on } from '@ngrx/store';
import { IShoppingState } from '../../model/grocery-list.types';
import {
  addListItem,
  removeListItem,
  removeListItems,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { GroceriesActions } from '../groceries/groceries.actions';
import { ShoppingActions } from './shopping.actions';

export const initialState: IShoppingState = {
  id: '_shopping',
  items: [],
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
  on(ShoppingActions.updateFilter,(state, { filterBy }): IShoppingState => ({ ...state, filterBy, })),
  on(ShoppingActions.updateSort, (state, { sortBy, sortDirection }): IShoppingState => ({ ...state, sort: updateListSort(sortBy, sortDirection, state.sort?.sortDirection),})),
  on(ShoppingActions.showActionSheet, (state):IShoppingState =>  ({...state, showActionSheet: true})),
  on(ShoppingActions.hideActionSheet, (state):IShoppingState =>  ({...state, showActionSheet: false})),

  on(GroceriesActions.loaded,(_state, { data }): IShoppingState => {
    return {...(data?.shopping ?? _state), searchQuery:undefined,filterBy: undefined, showActionSheet: false};
  }),
);
