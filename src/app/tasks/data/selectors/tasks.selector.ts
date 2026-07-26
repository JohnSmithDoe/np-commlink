import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ITaskItem, ITasksState } from '../../model/task.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/list/list.selector';
import { ICategory } from '../../../@shared/model/category.types';
import { ISearchResult } from '../../../@shared/model/item-list.types';

export const selectTasksState = createFeatureSelector<ITasksState>('tasks');

// The tasks list's category catalog (dialog refactor: the edit dialog reads the
// catalog straight from the domain slice).
export const selectTasksCategories = createSelector(
  selectTasksState,
  (state): ICategory[] => state.categories
);

export const selectTasksListSearchResult = createSelector(
  selectTasksState,
  (listState): ISearchResult<ITaskItem> | undefined =>
    filterListBySearchQuery(listState)
);

export const selectTasksListItems = createSelector(
  selectTasksState,
  selectTasksListSearchResult,
  (state: ITasksState, result): ITaskItem[] | undefined =>
    filterAndSortItemList(state, result)
);

// Count of open tasks for the deck's AGENDA tile. Tasks have no completion
// state (they are deleted when done), so every item in the list is "open".
export const selectOpenTaskCount = createSelector(
  selectTasksState,
  (state) => state?.items.length ?? 0
);
