import { createReducer, on } from '@ngrx/store';
import { IProductsState } from '../model';
import {
  addListCategoryObject,
  addListItem,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSort,
} from './grocery-list/grocery-list.utils';
import { GroceryCategoriesActions } from './grocery-list/grocery-categories.actions';
import { GroceriesActions } from './groceries.actions';
import { ProductsActions } from './products.actions';

export const initialState: IProductsState = {
  title: 'Product Items',
  id: '_products',
  items: [],
  mode: 'alphabetical',
  categories: [],
};

function updateSearch(
  state: IProductsState,
  searchQuery?: string
): IProductsState {
  searchQuery = searchQuery?.trim();
  if (searchQuery === state.searchQuery) return state;
  return { ...state, searchQuery };
}

// prettier-ignore
export const productsReducer = createReducer(
  initialState,
  on(ProductsActions.addItem,(state, { item }) => addListItem(state, item)),
  on(ProductsActions.removeItem,(state, { item }) => removeListItem(state, item)),
  on(ProductsActions.updateItem,(state, { item }) => updateListItem(state, item)),
  on(ProductsActions.updateSearch,(state, { searchQuery }): IProductsState => updateSearch(state, searchQuery)),
  on(ProductsActions.updateFilter,(state, { filterBy }): IProductsState => ({ ...state, filterBy, mode: 'alphabetical', })),
  on(ProductsActions.updateMode, (state, { mode }) => updateListMode(state, mode)),
  on(ProductsActions.updateSort, (state, { sortBy, sortDir }) => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(GroceryCategoriesActions.add, (state, { category }) => addListCategoryObject(state, category)),
  on(GroceryCategoriesActions.remove, (state, { id }) => removeListCategory(state, id)),
  on(GroceryCategoriesActions.rename, (state, { id, name }) => updateListCategory(state, id, name)),

  on(GroceriesActions.loaded,(_state, { data }): IProductsState => {
    return {...(data.products ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
