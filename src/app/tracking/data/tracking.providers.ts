import { providePersistedContext } from '../../@shared/data/persisted-context.provider';
import { createMetric } from '../../@shared/data/effects/persisted-slice.effects.factory';
import { TrackingActions } from './actions/tracking.actions';
import { trackingReducer } from './reducer/tracking.reducer';
import { TrackingEffects } from './effects/tracking.effects';
import { trackingListEffects } from './effects/tracking-list.effects';
import { TrackingNotificationsEffects } from './effects/tracking-notifications.effects';
import { TrackingMessageEffects } from './effects/tracking-message.effects';
import {
  selectTrackingItemCount,
  selectTrackingState,
} from './selectors/tracking.selector';

/**
 * The `tracking` bounded context, registered on the two routes that read
 * `state.tracking` — `/tracking` (the tracker) and `/data/:listId` (the stats
 * page). A single slice; the edit dialog carries no store state at all (the
 * open-command lives on the root `ItemDialogService`).
 *
 * `updateTracking` is deliberately absent from the save trigger: it fires every
 * second while an item runs, and the live counter is recomputed from
 * `startTime + breakInSeconds` on the next load, so persisting on
 * toggle/reset/save-and-reset is enough.
 *
 * Everything that touches the slice rides here so no `store.select` ever hits an
 * unregistered slice: the item-flow orchestration, the notifications reconcile +
 * the /notifications CTA deep-link handler (both dispatch into the eager
 * notifications sink), and the add/update/remove/save toasts.
 */
export const trackingContext = providePersistedContext({
  key: 'tracking',
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
