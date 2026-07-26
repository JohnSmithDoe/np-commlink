import { providePersistedContext } from '../../@shared/data/persisted-context.provider';
import { OfficeTimeActions } from './actions/office-time.actions';
import { officeTimeReducer } from './reducer/office-time.reducer';
import { OfficeTimeEffects } from './effects/office-time.effects';
import { selectOfficeTimeState } from './selectors/office-time.selector';
import {
  selectDashboardStatsYear,
  toDashboardStatsMetrics,
} from './selectors/office-time-stats.selector';

/**
 * The `office-time` bounded context, registered as ONE unit on both routes that
 * touch it: `/office-time` (the day tracker + stats) and `/office-time/settings`
 * (its own config — dashboard-card visibility, weekly target, data reset).
 *
 * `save` is deliberately absent: office-time is the one context whose write is
 * not a straight slice dump. `OfficeTimeEffects.saveOfficeTime$` serializes the
 * dayjs date maps into `IOfficeTimeStateStorage` first, and reports success or
 * swallows a storage rejection, so it owns its own persistence.
 */
export const officeTimeContext = providePersistedContext({
  key: 'officeTime',
  reducer: officeTimeReducer,
  lifecycle: OfficeTimeActions,
  select: selectOfficeTimeState,
  telemetry: [
    {
      source: 'office-time',
      select: selectDashboardStatsYear,
      metrics: toDashboardStatsMetrics,
    },
  ],
  effects: [OfficeTimeEffects],
});
