import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { TrackplayActions } from './trackplay.actions';
import { trackplayReducer } from './trackplay.reducer';
import { TrackplayEffects } from './trackplay.effects';
import {
  TRACKPLAY_STATE_KEY,
  selectGameCount,
  selectTrackplayPersisted,
} from './trackplay.selector';

export const trackplayContext = providePersistedContext({
  key: TRACKPLAY_STATE_KEY,
  reducer: trackplayReducer,
  lifecycle: TrackplayActions,
  select: selectTrackplayPersisted,
  save: { sources: ['[Trackplay]'] },
  telemetry: [
    {
      source: 'trackplay',
      select: selectGameCount,
      metrics: createMetric('games'),
    },
  ],
  effects: [TrackplayEffects],
});
