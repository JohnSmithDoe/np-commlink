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
} from '../../../@shared/util/item-lists/list.selector';
import { categoryIdOf } from '../../util/cash-category.utils';
import { selectAllTransactions, selectCashState } from '../cash.selector';

export const selectCashCategoryList = createSelector(
  selectCashState,
  (state): CategoryList => state.categories
);

export const selectCashCategories = createSelector(
  selectCashCategoryList,
  (catalog): Category[] => catalog.items
);

export const selectCashCategoriesSearchResult = createSelector(
  selectCashCategoryList,
  (catalog): SearchResult<Category> | undefined =>
    filterListBySearchQuery(catalog)
);

export const selectCashCategoriesListItems = createSelector(
  selectCashCategoryList,
  selectCashCategoriesSearchResult,
  (catalog, result): Category[] => filterAndSortItemList(catalog, result)
);

export const selectCashCountByCategory = createSelector(
  selectAllTransactions,
  (transactions): Map<CategoryId, number> => {
    const countById = new Map<CategoryId, number>();
    for (const txn of transactions) {
      const categoryId = categoryIdOf(txn);
      if (txn.matchedTxnId || !categoryId) continue;
      countById.set(categoryId, (countById.get(categoryId) ?? 0) + 1);
    }
    return countById;
  }
);
