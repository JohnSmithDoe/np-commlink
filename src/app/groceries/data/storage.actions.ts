import { createActionGroup } from '@ngrx/store';
import { itemListEvents } from '../../@shared/data/item-list/item-list.actions';
import { IProduct, IShoppingItem, IStorageItem } from '../model';

export const StorageActions = createActionGroup({
  source: 'Storage',
  events: {
    ...itemListEvents<IStorageItem>(),

    // Storage-specific effects
    'Add Product': (item: IProduct) => ({ item }),
    'Add Shopping Item': (item: IShoppingItem) => ({ item }),
    'Copy To Shoppinglist': (item: IStorageItem) => ({ item }),
    'Copy To Shoppinglist Success': (name: string, quantity: number) => ({
      name,
      quantity,
    }),

    // Storage-specific operations
    'Add Shopping List': (items: IShoppingItem[]) => ({ items }),
    // Category ops live on the shared GroceryCategoriesActions.
  },
});
