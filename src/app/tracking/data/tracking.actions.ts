import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  TItemListSortType,
  TTimestamp,
  TUpdateDTO,
} from '../../@shared/model/types';
import { IDataItem, ITrackingItem, ITrackingState } from '../model';

export const TrackingActions = createActionGroup({
  source: 'Tracking',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2). The load effect
    // reads the `tracking` key and emits `loaded`, which the reducer (and
    // trackTime$) hydrate on.
    load: emptyProps(),
    loaded: (tracking: ITrackingState | null) => ({ tracking }),

    // Effects only
    'Enter Page': emptyProps(),
    'Add Or Update Item': (item: ITrackingItem) => ({ item }),
    'Add Item From Search': emptyProps(),
    // A notification CTA (fired from the eager /notifications page) deep-links
    // to /tracking?cmd=<notificationId>; the tracking page dispatches this so
    // tracking applies its own command on activation (see
    // tracking-notifications.effects — lazy-modules §7 decision).
    'Apply Notification Command': (notificationId: string) => ({
      notificationId,
    }),

    // Operations
    'Toggle Tracking Item': (item: ITrackingItem, now: TTimestamp) => ({
      item,
      now,
    }),
    'Pause Tracking': (item: ITrackingItem) => ({ item }),
    'Start Tracking': (item: ITrackingItem) => ({ item }),
    'Update Tracking': (item: ITrackingItem, now: TTimestamp) => ({
      item,
      now,
    }),
    'Reset Tracking': (item: ITrackingItem) => ({ item }),
    'Reset All Tracking': emptyProps(),
    'Save And Reset Tracking': emptyProps(),
    'End Tracking': emptyProps(),
    'Generate Dummy Data': emptyProps(),
    // Dev-only "add ticket" affordance: opens the shared edit dialog seeded with

    'Share Data': emptyProps(),
    'Remove Data Item': (item: IDataItem) => ({ item }),
    'Change Data View': (viewId: string) => ({ viewId }),

    'Add Item': (item: ITrackingItem) => ({ item }),
    'Add Item Failure': (item: ITrackingItem) => ({ item }),

    'Remove Item': (item: ITrackingItem) => ({ item }),
    'Update Item': (item?: TUpdateDTO<ITrackingItem>) => ({ item }),
    'Update Search': (searchQuery?: string) => ({ searchQuery }),
    'Update Sort': (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  },
});
