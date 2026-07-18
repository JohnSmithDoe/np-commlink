import { createSelector } from '@ngrx/store';
import { ITaskItem } from '../model';
import { selectEditItem } from '../../@shared/data/item-dialogs/item-dialogs.selector';

/**
 * The tasks context's typed view of the shared, domain-blind `itemDialogs`
 * slice. The shared kernel exposes only the generic `selectEditItem`; tasks
 * casts it to its own item type here, so the kernel never knows the task concept.
 */
export const selectEditTaskItem = createSelector(
  selectEditItem,
  (item): ITaskItem | undefined => item as ITaskItem | undefined
);
