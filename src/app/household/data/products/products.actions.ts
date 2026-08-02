import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import {
  Product,
  ShoppingItem,
  StorageItem,
} from '../../model/household-list.types';

export const ProductsActions = createActionGroup({
  source: 'Products',
  events: {
    ...createItemListActionEvents<Product>(),

    addStorageItem: (item: StorageItem) => ({ item }),
    addShoppingItem: (item: ShoppingItem) => ({ item }),
  },
});
