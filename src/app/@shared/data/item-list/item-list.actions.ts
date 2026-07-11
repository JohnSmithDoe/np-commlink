import { createActionGroup, emptyProps } from '@ngrx/store';
import { ITrackingItem, TItemListSortType } from '../../types';

export const itemListActions = createActionGroup({
  source: 'ItemList',
  events: {
    // Effects only
    'Add Item From Search': emptyProps(),
    'Add Tracking Item': (item: ITrackingItem) => ({ item }),
    'Configuration Error': emptyProps(),
    // Operations
    'Update Search': (searchQuery?: string) => ({ searchQuery }),
    'Update Filter': (filterBy?: string) => ({ filterBy }),
    'Update Sort': (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  },
});
