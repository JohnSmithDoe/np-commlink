import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { CashSchedule, ScheduleAmountChange } from '../../model/schedule.types';

export const CashSchedulesActions = createActionGroup({
  source: 'Cash Schedules',
  events: {
    ...createItemListActionEvents<CashSchedule>(),

    applyAmountChanges: (changes: ScheduleAmountChange[]) => ({ changes }),
  },
});
