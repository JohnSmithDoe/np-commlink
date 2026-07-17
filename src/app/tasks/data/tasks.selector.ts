import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ISearchResult, ITaskItem, ITasksState } from '../../@shared/types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/list/list.selector';

export const selectTasksState = createFeatureSelector<ITasksState>('tasks');

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
