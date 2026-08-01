import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
} from '../../model/grocery-list.types';

export const ProductsActions = createActionGroup({
  source: 'Products',
  events: {
    ...createItemListActionEvents<IProduct>(),

    // Products-specific effects. No `addProduct` counterpart: copying a product
    // into the product catalogue is the diagonal `TCopyTargets` excludes, so
    // there is no caller the type system would even allow.
    addStorageItem: (item: IStorageItem) => ({ item }),
    addShoppingItem: (item: IShoppingItem) => ({ item }),
    // Category ops live on the shared GroceryCategoriesActions (one catalog
    // across all three grocery lists) — not per slice.
  },
});
