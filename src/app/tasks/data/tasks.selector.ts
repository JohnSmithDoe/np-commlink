import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskItem, TasksList, TasksState } from '../model/task.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  itemCountByCategory,
} from '../../@shared/util/item-lists/list.selector';
import {
  Category,
  CategoryId,
  CategoryList,
} from '../../@shared/model/category.types';
import { SearchResult } from '../../@shared/model/item-list.types';
import { idsTaggedWith } from '../../@shared/util/categories/category-list.utils';

export const TASKS_STATE_KEY = 'tasks';

export const selectTasksState =
  createFeatureSelector<TasksState>(TASKS_STATE_KEY);

export const selectTasksList = createSelector(
  selectTasksState,
  (state): TasksList => state.list
);
export const selectTaskCategoryList = createSelector(
  selectTasksState,
  (state): CategoryList => state.categoryList
);

export const selectTasksCategories = createSelector(
  selectTaskCategoryList,
  (catalog): Category[] => catalog.items
);

export const selectTaskItems = createSelector(
  selectTasksList,
  (list): TaskItem[] => list.items
);

export const selectTasksListSearchResult = createSelector(
  selectTasksList,
  (list): SearchResult<TaskItem> | undefined => filterListBySearchQuery(list)
);

export const selectTasksListItems = createSelector(
  selectTasksList,
  selectTasksListSearchResult,
  (list, result): TaskItem[] | undefined => filterAndSortItemList(list, result)
);

export const selectTaskCategoriesSearchResult = createSelector(
  selectTaskCategoryList,
  (catalog): SearchResult<Category> | undefined =>
    filterListBySearchQuery(catalog)
);

export const selectTaskCategoriesListItems = createSelector(
  selectTaskCategoryList,
  selectTaskCategoriesSearchResult,
  (catalog, result): Category[] | undefined =>
    filterAndSortItemList(catalog, result)
);

export const selectTaskCountByCategory = createSelector(
  selectTaskItems,
  (items): Map<CategoryId, number> => itemCountByCategory(items)
);

export const selectTaskTaggedByCategory = createSelector(
  selectTaskItems,
  (items) =>
    (categoryId: CategoryId): string[] =>
      idsTaggedWith(items, categoryId)
);

export const selectOpenTaskCount = createSelector(
  selectTasksList,
  (list) => list?.items.length ?? 0
);
