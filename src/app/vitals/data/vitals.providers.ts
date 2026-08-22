import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { selectReadingsCount } from './readings/readings.selector';
import { VitalsActions } from './vitals.actions';
import { vitalsReducer } from './vitals.reducer';
import {
  profilesListEffects,
  readingsListEffects,
} from './vitals-list.effects';
import { selectVitalsState, VITALS_STATE_KEY } from './vitals.selector';

export const vitalsContext = providePersistedContext({
  key: VITALS_STATE_KEY,
  reducer: vitalsReducer,
  lifecycle: VitalsActions,
  select: selectVitalsState,
  save: {
    sources: ['[Vitals]', '[Vitals Profiles]', '[Vitals Readings]'],
  },
  telemetry: [
    {
      source: 'vitals',
      select: selectReadingsCount,
      metrics: createMetric('count'),
    },
  ],
  effects: [profilesListEffects, readingsListEffects],
});
