import { createSelector } from '@ngrx/store';
import {
  Category,
  CategoryId,
  CategoryList,
} from '../../../@shared/model/category.types';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  itemCountByCategory,
} from '../../../@shared/util/item-lists/list.selector';
import { selectHouseholdState } from '../household.selector';

export const selectHouseholdCategoryList = createSelector(
  selectHouseholdState,
  (state): CategoryList => state.categories
);

export const selectHouseholdCategories = createSelector(
  selectHouseholdCategoryList,
  (catalog): Category[] => catalog.items
);

export const selectHouseholdCategoriesSearchResult = createSelector(
  selectHouseholdCategoryList,
  (catalog): SearchResult<Category> | undefined =>
    filterListBySearchQuery(catalog)
);

export const selectHouseholdCategoriesListItems = createSelector(
  selectHouseholdCategoryList,
  selectHouseholdCategoriesSearchResult,
  (catalog, result): Category[] | undefined =>
    filterAndSortItemList(catalog, result)
);

export const selectHouseholdCountByCategory = createSelector(
  selectHouseholdState,
  (state): Map<CategoryId, number> =>
    itemCountByCategory([
      ...state.products.items,
      ...state.shopping.items,
      ...state.storage.items,
    ])
);
