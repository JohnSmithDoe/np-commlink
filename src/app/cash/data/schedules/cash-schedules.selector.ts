import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { CashSchedulesState } from '../../model/cash.types';
import { CashSchedule } from '../../model/schedule.types';
import { selectCashState } from '../cash.selector';

const selectSchedulesState = createSelector(
  selectCashState,
  (state): CashSchedulesState => state.schedules
);

export const selectScheduleItems = createSelector(
  selectSchedulesState,
  (state): CashSchedule[] => state.items
);

const selectSchedulesSearchResult = createSelector(
  selectSchedulesState,
  (state): SearchResult<CashSchedule> | undefined =>
    filterListBySearchQuery(state)
);

export const selectSchedulesListItems = createSelector(
  selectSchedulesState,
  selectSchedulesSearchResult,
  (state, result): CashSchedule[] => filterAndSortItemList(state, result)
);
