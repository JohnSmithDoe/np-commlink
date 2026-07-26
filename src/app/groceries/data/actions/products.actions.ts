import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/actions/item-list.actions.factory';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
} from '../../model/grocery-list.types';

export const ProductsActions = createActionGroup({
  source: 'Products',
  events: {
    ...createItemListActionEvents<IProduct>(),

    // Products-specific effects
    addStorageItem: (item: IStorageItem) => ({ item }),
    addProduct: (item: IProduct) => ({ item }),
    addShoppingItem: (item: IShoppingItem) => ({ item }),
    // Category ops live on the shared GroceryCategoriesActions (one catalog
    // across all three grocery lists) — not per slice.
  },
});
