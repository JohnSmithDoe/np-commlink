import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import {
  Product,
  ShoppingItem,
  StorageItem,
} from '../../model/household-list.types';

export const ShoppingActions = createActionGroup({
  source: 'Shopping',
  events: {
    ...createItemListActionEvents<ShoppingItem>(),

    addProduct: (item: Product) => ({ item }),
    addStorageItem: (item: StorageItem) => ({ item }),
    moveToStorage: emptyProps(),
    shareShoppinglist: emptyProps(),
    buyItem: (item: ShoppingItem) => ({ item }),
    showActionSheet: emptyProps(),
    hideActionSheet: emptyProps(),

    removeItems: (items: ShoppingItem[]) => ({ items }),
  },
});
