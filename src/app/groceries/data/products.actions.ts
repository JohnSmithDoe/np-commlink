import { createActionGroup } from '@ngrx/store';
import { itemListEvents } from '../../@shared/data/item-list/item-list.actions';
import { IProduct, IShoppingItem, IStorageItem } from '../model';

export const ProductsActions = createActionGroup({
  source: 'Products',
  events: {
    ...itemListEvents<IProduct>(),

    // Products-specific effects
    'Add Storage Item': (item: IStorageItem) => ({ item }),
    'Add Product': (item: IProduct) => ({ item }),
    'Add Shopping Item': (item: IShoppingItem) => ({ item }),
    // Category ops live on the shared GroceryCategoriesActions (one catalog
    // across all three grocery lists) — not per slice.
  },
});
