import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ISearchResult } from '../../@shared/types';
import { ITaskItem, ITasksState } from '../model';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/list/list.selector';

export const selectTasksState = createFeatureSelector<ITasksState>('tasks');

// The tasks list's category catalog (dialog refactor: the edit dialog reads the
// catalog straight from the domain slice).
export const selectTasksCategories = createSelector(
  selectTasksState,
  (state): string[] => state.categories
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
