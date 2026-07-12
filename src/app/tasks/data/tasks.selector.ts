import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IAppState,
  ISearchResult,
  ITaskItem,
  ITasksState,
} from '../../@shared/types';
import {
  filterAndSortItemList,
  filterBySearchQuery,
} from '../../@shared/data/grocery-list/grocery-list.selector';

export const selectTasksState = createFeatureSelector<ITasksState>('tasks');

export const selectTasksListSearchResult = createSelector(
  selectTasksState,
  (state: IAppState) => state,
  (listState, state): ISearchResult<ITaskItem> | undefined =>
    filterBySearchQuery(state, listState)
);

export const selectTasksListItems = createSelector(
  selectTasksState,
  selectTasksListSearchResult,
  (state: ITasksState, result): ITaskItem[] | undefined =>
    filterAndSortItemList(state, result)
);
