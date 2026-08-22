import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { pickMetrics } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { createDailyReminderEffects } from '../../@shared/data/services/daily-reminder.effects.factory';
import { OfficeTimeActions } from './office-time.actions';
import { officeTimeReducer } from './office-time.reducer';
import { OfficeTimeEffects } from './office-time.effects';
import {
  OFFICE_TIME_STATE_KEY,
  selectOfficeReminder,
  selectOfficeTimeState,
} from './office-time.selector';
import { selectDashboardStatsYear } from './office-time-stats.selector';

const officeReminderEffects = createDailyReminderEffects({
  armOn: [OfficeTimeActions.loaded, OfficeTimeActions.resetData],
  changeOn: [OfficeTimeActions.setReminder],
  select: selectOfficeReminder,
  source: 'officeReminder',
  titleKey: marker('office-time.reminder.title'),
  bodyKey: marker('office-time.reminder.body'),
  refusedKey: marker('office-time.reminder.refused'),
});

export const officeTimeContext = providePersistedContext({
  key: OFFICE_TIME_STATE_KEY,
  reducer: officeTimeReducer,
  lifecycle: OfficeTimeActions,
  select: selectOfficeTimeState,
  telemetry: [
    {
      source: 'office-time',
      select: selectDashboardStatsYear,
      metrics: pickMetrics('officedays', 'percentage'),
    },
  ],
  effects: [OfficeTimeEffects, officeReminderEffects],
});
