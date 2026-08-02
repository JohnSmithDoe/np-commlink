import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { TrackingActions } from './tracking.actions';
import { trackingReducer } from './tracking.reducer';
import { TrackingEffects } from './tracking.effects';
import { trackingListEffects } from './tracking-list.effects';
import { TrackingNotificationsEffects } from './tracking-notifications.effects';
import { TrackingMessageEffects } from './tracking-message.effects';
import {
  TRACKING_STATE_KEY,
  selectTrackingItemCount,
  selectTrackingState,
} from './tracking.selector';

export const trackingContext = providePersistedContext({
  key: TRACKING_STATE_KEY,
  reducer: trackingReducer,
  lifecycle: TrackingActions,
  select: selectTrackingState,
  save: {
    on: [
      TrackingActions.addItem,
      TrackingActions.removeItem,
      TrackingActions.updateItem,
      TrackingActions.updateSort,
      TrackingActions.toggleTrackingItem,
      TrackingActions.resetTracking,
      TrackingActions.saveAndResetTracking,
      TrackingActions.resetAllTracking,
      TrackingActions.removeDataItem,
      TrackingActions.seedDemoSessions,
    ],
  },
  telemetry: [
    {
      source: 'tracking',
      select: selectTrackingItemCount,
      metrics: createMetric('count'),
    },
  ],
  effects: [
    TrackingEffects,
    trackingListEffects,
    TrackingNotificationsEffects,
    TrackingMessageEffects,
  ],
});
