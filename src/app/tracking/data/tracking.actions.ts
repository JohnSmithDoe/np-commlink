import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IDataItem,
  ITrackingItem,
  TItemListSortType,
  TTimestamp,
  TUpdateDTO,
} from '../../@shared/types';

export const TrackingActions = createActionGroup({
  source: 'Tracking',
  events: {
    // Effects only
    'Enter Page': emptyProps(),
    'Add Or Update Item': (item: ITrackingItem) => ({ item }),
    'Add Item From Search': emptyProps(),

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
