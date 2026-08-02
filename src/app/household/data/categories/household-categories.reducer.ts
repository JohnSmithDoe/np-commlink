import { createReducer, on } from '@ngrx/store';
import { HOUSEHOLD_CATEGORIES_LIST_ID } from '../../model/household-list.types';
import { CategoryList } from '../../../@shared/model/category.types';
import { addToCatalog } from '../../../@shared/util/categories/category-list.utils';
import {
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { HouseholdCategoriesActions } from './household-categories.actions';
import { HouseholdActions } from '../household.actions';

const initialState: CategoryList = {
  id: HOUSEHOLD_CATEGORIES_LIST_ID,
  items: [],
};

// prettier-ignore
export const householdCategoriesReducer = createReducer(
  initialState,
  on(HouseholdCategoriesActions.addItem, (state, { item }): CategoryList => addToCatalog(state, item)),
  on(HouseholdCategoriesActions.updateSearch, (state, { searchQuery }): CategoryList => updateListSearch(state, searchQuery)),
  on(HouseholdCategoriesActions.updateSort, (state, { sortBy, sortDirection }): CategoryList => ({ ...state, sort: updateListSort(sortBy, sortDirection, state.sort?.sortDirection) })),

  on(HouseholdActions.loaded, (state, { data }): CategoryList => ({
    ...(data?.categories ?? state),
    searchQuery: undefined,
    filterBy: undefined,
  }))
);
