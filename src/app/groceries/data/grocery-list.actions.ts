import { createActionGroup } from '@ngrx/store';
import { TGroceryListId } from '../model/grocery-list.types';
import { TItemListSortType } from '../../@shared/model/item-list.types';
// prettier-ignore
export const GroceryListActions = createActionGroup({
  source: 'GroceryList',
  events: {
    // Effects only
    addItemFromSearch: (listId: TGroceryListId) => ({ listId }),
    // The active list's view state. The catalog is a list of its own now, so its
    // own action group carries the equivalents.
    updateSearch: (listId: TGroceryListId, searchQuery?: string) => ({ searchQuery, listId }),
    updateFilter: (listId: TGroceryListId, filterBy?: string) => ({ filterBy, listId }),
    updateSort: (listId: TGroceryListId, sortBy?: TItemListSortType, sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle') => ({ sortBy, sortDirection, listId }),
  },
});
