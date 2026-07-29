import { createReducer, on } from '@ngrx/store';
import { IProductsState } from '../../model/grocery-list.types';
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
import { GroceryCategoriesActions } from '../actions/grocery-categories.actions';
import { GroceriesActions } from '../actions/groceries.actions';
import { ProductsActions } from '../actions/products.actions';

export const initialState: IProductsState = {
  id: '_products',
  items: [],
  mode: 'alphabetical',
  categories: [],
};

// prettier-ignore
export const productsReducer = createReducer(
  initialState,
  on(ProductsActions.addItem,(state, { item }): IProductsState => addListItem(state, item)),
  on(ProductsActions.removeItem,(state, { item }): IProductsState => removeListItem(state, item)),
  on(ProductsActions.updateItem,(state, { item }): IProductsState => updateListItem(state, item)),
  on(ProductsActions.updateSearch,(state, { searchQuery }): IProductsState => updateListSearch(state, searchQuery)),
  on(ProductsActions.updateFilter,(state, { filterBy }): IProductsState => ({ ...state, filterBy, mode: 'alphabetical', })),
  on(ProductsActions.updateMode, (state, { mode }): IProductsState => updateListMode(state, mode)),
  on(ProductsActions.updateSort, (state, { sortBy, sortDir }): IProductsState => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(GroceryCategoriesActions.add, (state, { category }): IProductsState => addListCategoryObject(state, category)),
  on(GroceryCategoriesActions.remove, (state, { id }): IProductsState => removeListCategory(state, id)),
  on(GroceryCategoriesActions.rename, (state, { id, name }): IProductsState => updateListCategory(state, id, name)),

  on(GroceriesActions.loaded,(_state, { data }): IProductsState => {
    return {...(data?.products ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
