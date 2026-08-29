import {
  clearSearchAfter,
  createItemListEffects,
} from '../../@shared/data/item-lists/item-list.effects.factory';
import { TRACKING_LIST_ID } from '../model/tracking.types';
import { createTrackingItem } from '../util/tracking.factory';
import { TrackingActions } from './tracking.actions';
import { selectTrackingState } from './tracking.selector';

export const trackingListEffects = {
  ...createItemListEffects({
    actions: TrackingActions,
    select: selectTrackingState,
    create: (name) => createTrackingItem(name),
    undoableDelete: {
      scope: TRACKING_LIST_ID,
      removeItem: TrackingActions.removeItem,
    },
  }),

  clearSearch$: clearSearchAfter(TrackingActions.updateSearch, [
    TrackingActions.addItem,
  ]),
};
