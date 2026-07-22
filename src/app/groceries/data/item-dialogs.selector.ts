import { createSelector } from '@ngrx/store';
import { IProduct, IShoppingItem, IStorageItem } from '../model';
import { selectEditItem } from '../../@shared/data/item-dialogs/item-dialogs.selector';

/**
 * The grocery context's typed views of the shared, domain-blind `itemDialogs`
 * slice. The shared kernel (`@shared/data/item-dialogs`) exposes only the
 * generic `selectEditItem`; each context casts it to its own item type here, so
 * the kernel never has to know grocery concepts (product/shopping/storage).
 * Once the item types move out of `@shared/types` (the god-file split), these
 * are the only casts that need to change.
 */
export const selectEditProduct = createSelector(
  selectEditItem,
  (item): IProduct | undefined => item as IProduct | undefined
);

export const selectEditShoppingItem = createSelector(
  selectEditItem,
  (item): IShoppingItem | undefined => item as IShoppingItem | undefined
);

export const selectEditStorageItem = createSelector(
  selectEditItem,
  (item): IStorageItem | undefined => item as IStorageItem | undefined
);
