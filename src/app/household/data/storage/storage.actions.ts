import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import {
  Product,
  ShoppingItem,
  StorageItem,
} from '../../model/household-list.types';

export const StorageActions = createActionGroup({
  source: 'Storage',
  events: {
    ...createItemListActionEvents<StorageItem>(),

    addProduct: (item: Product) => ({ item }),
    addShoppingItem: (item: ShoppingItem) => ({ item }),
    copyToShoppinglist: (item: StorageItem) => ({ item }),

    addShoppingList: (items: ShoppingItem[]) => ({ items }),
  },
});
