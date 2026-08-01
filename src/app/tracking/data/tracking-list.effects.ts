import {
  clearSearchAfter,
  createItemListEffects,
} from '../../@shared/data/item-lists/item-list.effects.factory';
import { createTrackingItem } from '../util/tracking.factory';
import { TrackingActions } from './tracking.actions';
import { selectTrackingState } from './tracking.selector';

/**
 * Tracking's item flow, composed from the shared single-list builders.
 *
 * Tracking is category-less, so it carries neither the category-mode nor the
 * quick-add behaviours the grocery/tasks lists do — and its search only needs
 * clearing after an add.
 */
export const trackingListEffects = {
  ...createItemListEffects({
    actions: TrackingActions,
    select: selectTrackingState,
    create: (name) => createTrackingItem(name),
  }),

  clearSearch$: clearSearchAfter(TrackingActions.updateSearch, [
    TrackingActions.addItem,
  ]),
};
