import { createSelector } from '@ngrx/store';
import { ITrackingItem } from '../model';
import { selectEditItem } from '../../@shared/data/item-dialogs/item-dialogs.selector';

/**
 * The tracking context's typed view of the shared, domain-blind `itemDialogs`
 * slice. The shared kernel exposes only the generic `selectEditItem`; tracking
 * casts it to its own item type here, so the kernel never knows the tracking
 * concept (mirrors tasks' `selectEditTaskItem`).
 */
export const selectEditTrackingItem = createSelector(
  selectEditItem,
  (item): ITrackingItem | undefined => item as ITrackingItem | undefined
);
