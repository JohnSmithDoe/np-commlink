import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../@shared/data/item-lists/item-list.actions.factory';
import { TTimestamp } from '../../@shared/model/app.types';
import {
  IDataItem,
  ITrackingItem,
  ITrackingState,
  TTrackingViewId,
} from '../model/tracking.types';

export const TrackingActions = createActionGroup({
  source: 'Tracking',
  events: {
    // Own-data lazy load lifecycle. The load effect
    // reads the `tracking` key and emits `loaded`, which the reducer (and
    // trackTime$) hydrate on.
    load: emptyProps(),
    loaded: (tracking: ITrackingState | null) => ({ tracking }),

    // The shared list event map, one definition for every list-backed context.
    // Three of its creators are inert here — tracking is category-less
    // (`updateFilter`/`updateMode`) and its page has no enter flow
    // (`enterPage`) — which is the price of the map having a single home.
    ...createItemListActionEvents<ITrackingItem>(),

    // A notification CTA (fired from the eager /notifications page) deep-links
    // to /tracking?cmd=<command>&target=<itemId>; the tracking page dispatches
    // this so tracking applies its own command on activation (see
    // tracking-notifications.effects). The link carries the command itself,
    // not the notification's id, so tracking resolves it against its own items
    // and never reads the inbox.
    applyNotificationCommand: (command: string, targetId: string) => ({
      command,
      targetId,
    }),

    // Operations
    toggleTrackingItem: (item: ITrackingItem, now: TTimestamp) => ({
      item,
      now,
    }),
    updateTracking: (item: ITrackingItem, now: TTimestamp) => ({
      item,
      now,
    }),
    resetTracking: (item: ITrackingItem) => ({ item }),
    resetAllTracking: emptyProps(),
    saveAndResetTracking: emptyProps(),
    // The generated sessions travel in the payload: the generator is random and
    // clock-bound, and the reducer stays a pure merge of what it is handed.
    seedDemoSessions: (sessions: ITrackingItem[]) => ({ sessions }),

    shareData: emptyProps(),
    removeDataItem: (item: IDataItem) => ({ item }),
    changeDataView: (viewId: TTrackingViewId) => ({ viewId }),
  },
});
