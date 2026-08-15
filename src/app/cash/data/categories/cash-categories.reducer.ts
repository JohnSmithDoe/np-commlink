import { createReducer, on } from '@ngrx/store';
import { CategoryList } from '../../../@shared/model/category.types';
import { addToCatalog } from '../../../@shared/util/categories/category-list.utils';
import {
  hydratedList,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { CASH_CATEGORIES_LIST_ID } from '../../model/cash.types';
import { CashActions } from '../cash.actions';
import { CashCategoriesActions } from './cash-categories.actions';

const initialCategoriesState: CategoryList = {
  id: CASH_CATEGORIES_LIST_ID,
  items: [],
};

// prettier-ignore
export const cashCategoriesReducer = createReducer(
  initialCategoriesState,
  on(CashCategoriesActions.addItem, (state, { item }): CategoryList => addToCatalog(state, item)),
  on(CashCategoriesActions.updateSearch, (state, { searchQuery }): CategoryList => updateListSearch(state, searchQuery)),
  on(CashCategoriesActions.updateSort, (state, { sortBy, sortDirection }): CategoryList => updateListSort(state, sortBy, sortDirection)),

  on(CashActions.loaded, (state, { cash }): CategoryList => hydratedList(cash?.categories ?? state))
);
