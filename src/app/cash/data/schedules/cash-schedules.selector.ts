import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import { filterListBySearchQuery } from '../../../@shared/util/item-lists/list.selector';
import { CashSchedulesState } from '../../model/cash.types';
import { CashSchedule } from '../../model/schedule.types';
import { selectCashState } from '../cash.selector';

export const selectSchedulesState = createSelector(
  selectCashState,
  (state): CashSchedulesState => state.schedules
);

export const selectScheduleItems = createSelector(
  selectSchedulesState,
  (state): CashSchedule[] => state.items
);

export const selectSchedulesSearchResult = createSelector(
  selectSchedulesState,
  (state): SearchResult<CashSchedule> | undefined =>
    filterListBySearchQuery(state)
);

export const selectSchedulesByDueDate = createSelector(
  selectScheduleItems,
  (schedules): CashSchedule[] =>
    schedules.toSorted((a, b) => a.nextDueISO.localeCompare(b.nextDueISO))
);
