import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  TItemListMode,
  TItemListSortType,
  TUpdateDTO,
} from '../../@shared/types';
import { IProduct, IShoppingItem, IStorageItem } from '../model';

export const ShoppingActions = createActionGroup({
  source: 'Shopping',
  events: {
    // Effects only
    'Enter Page': emptyProps(),
    'Add Or Update Item': (item: IShoppingItem) => ({ item }),
    'Add Item From Search': emptyProps(),
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

    // Operations

    'Add Item': (item: IShoppingItem) => ({ item }),
    'Add Item Failure': (item: IShoppingItem) => ({ item }),
    // Category ops live on the shared GroceryCategoriesActions.
    'Remove Item': (item: IShoppingItem) => ({ item }),
    'Remove Items': (items: IShoppingItem[]) => ({ items }),
    'Update Item': (item: TUpdateDTO<IShoppingItem>) => ({ item }),
    'Update Search': (searchQuery?: string) => ({ searchQuery }),
    'Update Filter': (filterBy?: string) => ({ filterBy }),
    'Update Mode': (mode?: TItemListMode) => ({ mode }),
    'Update Sort': (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  },
});
