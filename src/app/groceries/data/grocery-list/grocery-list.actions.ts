import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  TItemListCategory,
  TItemListId,
  TItemListMode,
  TItemListSortType,
} from '../../../@shared/types';
import { IProduct, IShoppingItem, IStorageItem } from '../../model';
// prettier-ignore
export const GroceryListActions = createActionGroup({
  source: 'GroceryList',
  events: {
    // Effects only
    'Add Item From Search': (listId:TItemListId) => ({ listId }),
    'Add Category From Search': (listId:TItemListId) => ({ listId }),
    'Add Product': (listId:TItemListId, item: IProduct) => ({ item, listId }),
    'Add Storage Item': (listId:TItemListId, item: IStorageItem) => ({ item, listId }),
    'Add Shopping Item': (listId:TItemListId, item: IShoppingItem) => ({ item, listId }),
    // NEW (merge): the mlkit barcode scanner dispatches this with a scanned
    // EAN-13 to open the product-item edit dialog seeded with the code. Owned
    // by the grocery domain (was the shared reducer's Open Edit Product event).
    'Open Edit Product': (scannedEan: string) => ({ scannedEan }),
    'Configuration Error': emptyProps(),
    // Operations
    'Add Category': (listId:TItemListId, category: TItemListCategory) => ({ listId, category }),
    'Remove Category': (listId:TItemListId, category: TItemListCategory) => ({ listId, category }),
    'Update Search': (listId:TItemListId, searchQuery?: string) => ({ searchQuery, listId }),
    'Update Filter': (listId:TItemListId, filterBy?: string) => ({ filterBy, listId }),
    'Update Mode': (listId:TItemListId, mode?: TItemListMode) => ({ mode, listId }),
    'Update Sort': (listId:TItemListId, sortBy?: TItemListSortType, sortDir?: 'asc' | 'desc' | 'keep' | 'toggle') => ({ sortBy, sortDir, listId }),
  },
});
