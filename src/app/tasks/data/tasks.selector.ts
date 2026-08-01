import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ITaskItem, ITasksState, TTasksList } from '../model/task.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  itemCountByCategory,
} from '../../@shared/util/item-lists/list.selector';
import {
  ICategory,
  ICategoryList,
  TCategoryId,
} from '../../@shared/model/category.types';
import { ISearchResult } from '../../@shared/model/item-list.types';

export const TASKS_STATE_KEY = 'tasks';

export const selectTasksState =
  createFeatureSelector<ITasksState>(TASKS_STATE_KEY);

// The two lists the slice holds. Every read below narrows to one of them, which
// is what keeps the task page and the catalog page from sharing view state.
export const selectTasksList = createSelector(
  selectTasksState,
  (state): TTasksList => state.list
);
export const selectTaskCategoryList = createSelector(
  selectTasksState,
  (state): ICategoryList => state.categoryList
);

// The catalog's entries, for the item dialog's category picker.
export const selectTasksCategories = createSelector(
  selectTaskCategoryList,
  (catalog): ICategory[] => catalog.items
);

/**
 * Every task the list holds, unfiltered — as opposed to
 * {@link selectTasksListItems}, which is the PAGE's view (its search query and
 * category filter applied). The edit dialog's duplicate-name rule needs the
 * aggregate: a search term left in the box would otherwise shrink the sibling set
 * and let a duplicate save.
 */
export const selectTaskItems = createSelector(
  selectTasksList,
  (list): ITaskItem[] => list.items
);

export const selectTasksListSearchResult = createSelector(
  selectTasksList,
  (list): ISearchResult<ITaskItem> | undefined => filterListBySearchQuery(list)
);

export const selectTasksListItems = createSelector(
  selectTasksList,
  selectTasksListSearchResult,
  (list, result): ITaskItem[] | undefined => filterAndSortItemList(list, result)
);

// ── the catalog page's own list reads, the same shapes as the task list's ──
export const selectTaskCategoriesSearchResult = createSelector(
  selectTaskCategoryList,
  (catalog): ISearchResult<ICategory> | undefined =>
    filterListBySearchQuery(catalog)
);

export const selectTaskCategoriesListItems = createSelector(
  selectTaskCategoryList,
  selectTaskCategoriesSearchResult,
  (catalog, result): ICategory[] | undefined =>
    filterAndSortItemList(catalog, result)
);

// How many tasks each category holds — the one thing a catalog row shows that an
// ordinary list row does not.
export const selectTaskCountByCategory = createSelector(
  selectTaskItems,
  (items): Map<TCategoryId, number> => itemCountByCategory(items)
);

// Count of open tasks for the deck's AGENDA tile. Tasks have no completion
// state (they are deleted when done), so every item in the list is "open".
export const selectOpenTaskCount = createSelector(
  selectTasksList,
  (list) => list?.items.length ?? 0
);
