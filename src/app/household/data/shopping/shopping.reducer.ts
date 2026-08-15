import { createReducer, on } from '@ngrx/store';
import {
  SHOPPING_LIST_ID,
  ShoppingState,
} from '../../model/household-list.types';
import {
  hydratedList,
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { removeListItems } from '../../util/household-list.utils';
import { HouseholdActions } from '../household.actions';
import { ShoppingActions } from './shopping.actions';

export const initialState: ShoppingState = {
  id: SHOPPING_LIST_ID,
  items: [],
  showActionSheet: false,
};

// prettier-ignore
export const shoppingReducer = createReducer(
  initialState,
  on(ShoppingActions.addItem,(state, { item }): ShoppingState => addListItem(state, item)),
  on(ShoppingActions.removeItem,(state, { item }): ShoppingState => removeListItem(state, item)),
  on(ShoppingActions.removeItems,(state, { items }): ShoppingState => removeListItems(state, items)),
  on(ShoppingActions.updateItem,(state, { item }): ShoppingState => updateListItem(state, item)),
  on(ShoppingActions.updateSearch,(state, { searchQuery }): ShoppingState => updateListSearch(state, searchQuery)),
  on(ShoppingActions.updateFilter,(state, { filterBy }): ShoppingState => ({ ...state, filterBy, })),
  on(ShoppingActions.updateSort, (state, { sortBy, sortDirection }): ShoppingState => updateListSort(state, sortBy, sortDirection)),
  on(ShoppingActions.showActionSheet, (state):ShoppingState =>  ({...state, showActionSheet: true})),
  on(ShoppingActions.hideActionSheet, (state):ShoppingState =>  ({...state, showActionSheet: false})),

  on(HouseholdActions.loaded,(_state, { data }): ShoppingState => {
    return { ...hydratedList(data?.shopping ?? _state), showActionSheet: false };
  }),
);
