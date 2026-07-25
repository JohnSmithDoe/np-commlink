import { createActionGroup, emptyProps } from '@ngrx/store';
import { itemListEvents } from '../../@shared/data/item-list/item-list.actions';
import { IProduct, IShoppingItem, IStorageItem } from '../model';

export const ShoppingActions = createActionGroup({
  source: 'Shopping',
  events: {
    ...itemListEvents<IShoppingItem>(),

    // Shopping-specific effects
    'Add Product': (item: IProduct) => ({ item }),
    'Add Storage Item': (item: IStorageItem) => ({ item }),
    'Move To Storage': emptyProps(),
    'Share Shoppinglist': emptyProps(),
    'Add Item Or Increase Quantity': (item: IShoppingItem) => ({ item }),
    'Add Item Or Increase Quantity Success': (item: IShoppingItem) => ({
      item,
    }),
    'Buy Item': (item: IShoppingItem) => ({ item }),
    'Show Action Sheet': emptyProps(),
    'Hide Action Sheet': emptyProps(),

    // Shopping-specific operations
    'Remove Items': (items: IShoppingItem[]) => ({ items }),
    // Category ops live on the shared GroceryCategoriesActions.
  },
});
