import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  TItemListId,
  TItemListMode,
  TItemListSortType,
} from '../../../@shared/model/types';
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
    'Configuration Error': emptyProps(),
    // Operations. Category CRUD is on the shared GroceryCategoriesActions (one
    // catalog across the three lists); only "add from the search box" stays here
    // since it reads the active list's search query.
    'Update Search': (listId:TItemListId, searchQuery?: string) => ({ searchQuery, listId }),
    'Update Filter': (listId:TItemListId, filterBy?: string) => ({ filterBy, listId }),
    'Update Mode': (listId:TItemListId, mode?: TItemListMode) => ({ mode, listId }),
    'Update Sort': (listId:TItemListId, sortBy?: TItemListSortType, sortDir?: 'asc' | 'desc' | 'keep' | 'toggle') => ({ sortBy, sortDir, listId }),
  },
});
