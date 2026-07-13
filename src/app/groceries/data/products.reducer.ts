import { createReducer, on } from '@ngrx/store';
import { IProductsState } from '../../@shared/types';
import {
  addListCategory,
  addListItem,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSort,
} from './grocery-list/grocery-list.utils';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { ProductsActions } from './products.actions';

export const initialState: IProductsState = {
  title: 'Global Items',
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
  on(ProductsActions.addCategory, (state, { category }) =>  addListCategory(state, category)),
  on(ProductsActions.removeCategory, (state, { category }) => removeListCategory(state, category)),
  on(ProductsActions.updateCategory, (state, { original, newName }) => updateListCategory(state, original, newName)),

  on(ApplicationActions.loadedSuccessfully,(_state, { datastore }): IProductsState => {
    return {...(datastore.products ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
