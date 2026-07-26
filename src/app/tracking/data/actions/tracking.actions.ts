import { createActionGroup, emptyProps } from '@ngrx/store';
import { TTimestamp } from '../../../@shared/model/app.types';
import { TUpdateDTO } from '../../../@shared/model/base-item.types';
import { TItemListSortType } from '../../../@shared/model/item-list.types';
import {
  IDataItem,
  ITrackingItem,
  ITrackingState,
} from '../../model/tracking.types';

export const TrackingActions = createActionGroup({
  source: 'Tracking',
  events: {
    // Own-data lazy load lifecycle. The load effect
    // reads the `tracking` key and emits `loaded`, which the reducer (and
    // trackTime$) hydrate on.
    load: emptyProps(),
    loaded: (tracking: ITrackingState | null) => ({ tracking }),

    // Effects only
    addOrUpdateItem: (item: ITrackingItem) => ({ item }),
    addItemFromSearch: emptyProps(),
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
    pauseTracking: (item: ITrackingItem) => ({ item }),
    startTracking: (item: ITrackingItem) => ({ item }),
    updateTracking: (item: ITrackingItem, now: TTimestamp) => ({
      item,
      now,
    }),
    resetTracking: (item: ITrackingItem) => ({ item }),
    resetAllTracking: emptyProps(),
    saveAndResetTracking: emptyProps(),
    endTracking: emptyProps(),
    seedDemoSessions: emptyProps(),

    shareData: emptyProps(),
    removeDataItem: (item: IDataItem) => ({ item }),
    changeDataView: (viewId: string) => ({ viewId }),

    addItem: (item: ITrackingItem) => ({ item }),
    addItemFailure: (item: ITrackingItem) => ({ item }),

    removeItem: (item: ITrackingItem) => ({ item }),
    updateItem: (item: TUpdateDTO<ITrackingItem>) => ({ item }),
    updateSearch: (searchQuery?: string) => ({ searchQuery }),
    updateSort: (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  },
});
