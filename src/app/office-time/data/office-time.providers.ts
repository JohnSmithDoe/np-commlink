import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { pickMetrics } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { OfficeTimeActions } from './office-time.actions';
import { officeTimeReducer } from './office-time.reducer';
import { OfficeTimeEffects } from './office-time.effects';
import { OfficeTimeReminderEffects } from './office-time-reminder.effects';
import {
  OFFICE_TIME_STATE_KEY,
  selectOfficeTimeState,
} from './office-time.selector';
import { selectDashboardStatsYear } from './office-time-stats.selector';

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
  effects: [OfficeTimeEffects, OfficeTimeReminderEffects],
});
