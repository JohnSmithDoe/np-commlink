import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../@shared/data/item-lists/item-list.actions.factory';
import { Timestamp } from '../../@shared/model/app.types';
import {
  DataItem,
  TrackingItem,
  TrackingState,
  TrackingViewId,
} from '../model/tracking.types';

export const TrackingActions = createActionGroup({
  source: 'Tracking',
  events: {
    load: emptyProps(),
    loaded: (tracking: TrackingState | null) => ({ tracking }),

    ...createItemListActionEvents<TrackingItem>(),

    applyNotificationCommand: (command: string, targetId: string) => ({
      command,
      targetId,
    }),

    toggleTrackingItem: (item: TrackingItem, now: Timestamp) => ({
      item,
      now,
    }),
    updateTracking: (item: TrackingItem, now: Timestamp) => ({
      item,
      now,
    }),
    resetTracking: (item: TrackingItem) => ({ item }),
    resetAllTracking: emptyProps(),
    saveAndResetTracking: emptyProps(),
    seedDemoSessions: (sessions: TrackingItem[]) => ({ sessions }),

    shareData: emptyProps(),
    removeDataItem: (item: DataItem) => ({ item }),
    changeDataView: (viewId: TrackingViewId) => ({ viewId }),
  },
});
