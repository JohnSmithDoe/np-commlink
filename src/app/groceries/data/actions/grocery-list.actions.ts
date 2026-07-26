import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
  TGroceryListId,
} from '../../model/grocery-list.types';
import {
  TItemListMode,
  TItemListSortType,
} from '../../../@shared/model/item-list.types';
// prettier-ignore
export const GroceryListActions = createActionGroup({
  source: 'GroceryList',
  events: {
    // Effects only
    addItemFromSearch: (listId: TGroceryListId) => ({ listId }),
    addCategoryFromSearch: (listId: TGroceryListId) => ({ listId }),
    addProduct: (listId: TGroceryListId, item: IProduct) => ({ item, listId }),
    addStorageItem: (listId: TGroceryListId, item: IStorageItem) => ({ item, listId }),
    addShoppingItem: (listId: TGroceryListId, item: IShoppingItem) => ({ item, listId }),
    configurationError: emptyProps(),
    // Operations. Category CRUD is on the shared GroceryCategoriesActions (one
    // catalog across the three lists); only "add from the search box" stays here
    // since it reads the active list's search query.
    updateSearch: (listId: TGroceryListId, searchQuery?: string) => ({ searchQuery, listId }),
    updateFilter: (listId: TGroceryListId, filterBy?: string) => ({ filterBy, listId }),
    updateMode: (listId: TGroceryListId, mode?: TItemListMode) => ({ mode, listId }),
    updateSort: (listId: TGroceryListId, sortBy?: TItemListSortType, sortDir?: 'asc' | 'desc' | 'keep' | 'toggle') => ({ sortBy, sortDir, listId }),
  },
});
