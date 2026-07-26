import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/actions/item-list.actions.factory';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
} from '../../model/grocery-list.types';

export const ShoppingActions = createActionGroup({
  source: 'Shopping',
  events: {
    ...createItemListActionEvents<IShoppingItem>(),

    // Shopping-specific effects
    addProduct: (item: IProduct) => ({ item }),
    addStorageItem: (item: IStorageItem) => ({ item }),
    moveToStorage: emptyProps(),
    shareShoppinglist: emptyProps(),
    addItemOrIncreaseQuantity: (item: IShoppingItem) => ({ item }),
    addItemOrIncreaseQuantitySuccess: (item: IShoppingItem) => ({
      item,
    }),
    buyItem: (item: IShoppingItem) => ({ item }),
    showActionSheet: emptyProps(),
    hideActionSheet: emptyProps(),

    // Shopping-specific operations
    removeItems: (items: IShoppingItem[]) => ({ items }),
    // Category ops live on the shared GroceryCategoriesActions.
  },
});
