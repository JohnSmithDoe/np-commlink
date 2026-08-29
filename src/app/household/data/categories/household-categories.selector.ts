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
import { idsTaggedWith } from '../../../@shared/util/categories/category-list.utils';
import { HouseholdState } from '../../model/household.types';
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

const taggableItems = (state: HouseholdState) => [
  ...state.products.items,
  ...state.shopping.items,
  ...state.storage.items,
];

export const selectHouseholdCountByCategory = createSelector(
  selectHouseholdState,
  (state): Map<CategoryId, number> => itemCountByCategory(taggableItems(state))
);

export const selectHouseholdTaggedByCategory = createSelector(
  selectHouseholdState,
  (state) =>
    (categoryId: CategoryId): string[] =>
      idsTaggedWith(taggableItems(state), categoryId)
);
