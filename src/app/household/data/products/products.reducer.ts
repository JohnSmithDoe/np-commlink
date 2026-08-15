import { createReducer, on } from '@ngrx/store';
import {
  PRODUCTS_LIST_ID,
  ProductsState,
} from '../../model/household-list.types';
import {
  hydratedList,
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { HouseholdActions } from '../household.actions';
import { ProductsActions } from './products.actions';

export const initialState: ProductsState = {
  id: PRODUCTS_LIST_ID,
  items: [],
};

// prettier-ignore
export const productsReducer = createReducer(
  initialState,
  on(ProductsActions.addItem,(state, { item }): ProductsState => addListItem(state, item)),
  on(ProductsActions.removeItem,(state, { item }): ProductsState => removeListItem(state, item)),
  on(ProductsActions.updateItem,(state, { item }): ProductsState => updateListItem(state, item)),
  on(ProductsActions.updateSearch,(state, { searchQuery }): ProductsState => updateListSearch(state, searchQuery)),
  on(ProductsActions.updateFilter,(state, { filterBy }): ProductsState => ({ ...state, filterBy, })),
  on(ProductsActions.updateSort, (state, { sortBy, sortDirection }): ProductsState => updateListSort(state, sortBy, sortDirection)),

  on(HouseholdActions.loaded,(_state, { data }): ProductsState => {
    return hydratedList(data?.products ?? _state);
  })
);
