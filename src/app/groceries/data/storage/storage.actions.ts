import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
} from '../../model/grocery-list.types';

export const StorageActions = createActionGroup({
  source: 'Storage',
  events: {
    ...createItemListActionEvents<IStorageItem>(),

    // Storage-specific effects
    addProduct: (item: IProduct) => ({ item }),
    addShoppingItem: (item: IShoppingItem) => ({ item }),
    copyToShoppinglist: (item: IStorageItem) => ({ item }),

    // Storage-specific operations
    addShoppingList: (items: IShoppingItem[]) => ({ items }),
    // Category ops live on the shared GroceryCategoriesActions.
  },
});
