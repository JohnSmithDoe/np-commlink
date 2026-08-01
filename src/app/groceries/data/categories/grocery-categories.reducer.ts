import { createReducer, on } from '@ngrx/store';
import { GROCERY_CATEGORIES_LIST_ID } from '../../model/grocery-list.types';
import { ICategoryList } from '../../../@shared/model/category.types';
import { addToCatalog } from '../../../@shared/util/categories/category-list.utils';
import {
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { GroceryCategoriesActions } from './grocery-categories.actions';
import { GroceriesActions } from '../groceries/groceries.actions';

const initialState: ICategoryList = {
  id: GROCERY_CATEGORIES_LIST_ID,
  items: [],
};

/**
 * The one grocery catalog — where three copies used to sit inside the three list
 * reducers.
 *
 * Deliberately NOT the whole catalog surface: delete and rename also have to fix
 * the references products/shopping/storage hold, and a rename only touches them
 * when it MERGES. Deciding that here would mean inferring after the fact whether a
 * merge happened, so both live in `groceriesReducer`, which can see the catalog
 * and the three lists at once and gets `mergedInto` told to it.
 */
// prettier-ignore
export const groceryCategoriesReducer = createReducer(
  initialState,
  on(GroceryCategoriesActions.addItem, (state, { item }): ICategoryList => addToCatalog(state, item)),
  on(GroceryCategoriesActions.updateSearch, (state, { searchQuery }): ICategoryList => updateListSearch(state, searchQuery)),
  on(GroceryCategoriesActions.updateSort, (state, { sortBy, sortDirection }): ICategoryList => ({ ...state, sort: updateListSort(sortBy, sortDirection, state.sort?.sortDirection) })),

  on(GroceriesActions.loaded, (state, { data }): ICategoryList => ({
    ...(data?.categories ?? state),
    searchQuery: undefined,
    filterBy: undefined,
  }))
);
