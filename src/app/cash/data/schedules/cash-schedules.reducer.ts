/* ─── why ─────────────────────────────────────────────────────────
 * `applyAmountChanges` both learns the amount and advances `nextDueISO`, in
 * one action, because they are one fact: the booking arrived. Splitting them
 * would let a confirmed amount land on a schedule still claiming last month's
 * due date, which the reserve would then divide by zero months.
 * ───────────────────────────────────────────────────────────────── */
import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import {
  CASH_SCHEDULES_LIST_ID,
  CashSchedulesState,
} from '../../model/cash.types';
import { CashSchedule, ScheduleAmountChange } from '../../model/schedule.types';
import { advanced } from '../../util/schedule.utils';
import { CashActions } from '../cash.actions';
import { CashSchedulesActions } from './cash-schedules.actions';

const initialSchedulesState: CashSchedulesState = {
  id: CASH_SCHEDULES_LIST_ID,
  items: [],
  sort: { sortBy: 'nextDueISO', sortDirection: 'asc' },
};

const withChanges = (
  items: readonly CashSchedule[],
  changes: readonly ScheduleAmountChange[]
): CashSchedule[] => {
  const byId = new Map(changes.map((change) => [change.scheduleId, change]));
  return items.map((schedule) => {
    const change = byId.get(schedule.id);
    return change
      ? advanced({ ...schedule, amountCents: change.toCents }, change.seenISO)
      : schedule;
  });
};

// prettier-ignore
export const cashSchedulesReducer = createReducer(
  initialSchedulesState,
  on(CashSchedulesActions.addItem, (state, { item }): CashSchedulesState => addListItem(state, item)),
  on(CashSchedulesActions.removeItem, (state, { item }): CashSchedulesState => removeListItem(state, item)),
  on(CashSchedulesActions.updateItem, (state, { item }): CashSchedulesState => updateListItem(state, item)),
  on(CashSchedulesActions.updateSearch, (state, { searchQuery }): CashSchedulesState => updateListSearch(state, searchQuery)),
  on(CashSchedulesActions.updateFilter, (state, { filterBy }): CashSchedulesState => ({ ...state, filterBy })),
  on(CashSchedulesActions.updateSort, (state, { sortBy, sortDirection }): CashSchedulesState => updateListSort(state, sortBy, sortDirection)),

  on(CashSchedulesActions.applyAmountChanges, (state, { changes }): CashSchedulesState => ({
    ...state,
    items: withChanges(state.items, changes),
  })),

  on(CashActions.loaded, (state, { cash }): CashSchedulesState => hydratedList(cash?.schedules ?? state))
);
