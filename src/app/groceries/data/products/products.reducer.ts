import { createReducer, on } from '@ngrx/store';
import { IProductsState } from '../../model/grocery-list.types';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { GroceriesActions } from '../groceries/groceries.actions';
import { ProductsActions } from './products.actions';

export const initialState: IProductsState = {
  id: '_products',
  items: [],
};

// prettier-ignore
export const productsReducer = createReducer(
  initialState,
  on(ProductsActions.addItem,(state, { item }): IProductsState => addListItem(state, item)),
  on(ProductsActions.removeItem,(state, { item }): IProductsState => removeListItem(state, item)),
  on(ProductsActions.updateItem,(state, { item }): IProductsState => updateListItem(state, item)),
  on(ProductsActions.updateSearch,(state, { searchQuery }): IProductsState => updateListSearch(state, searchQuery)),
  on(ProductsActions.updateFilter,(state, { filterBy }): IProductsState => ({ ...state, filterBy, })),
  on(ProductsActions.updateSort, (state, { sortBy, sortDirection }): IProductsState => ({ ...state, sort: updateListSort(sortBy, sortDirection, state.sort?.sortDirection),})),

  on(GroceriesActions.loaded,(_state, { data }): IProductsState => {
    return {...(data?.products ?? _state), searchQuery:undefined,filterBy: undefined};
  })
);
