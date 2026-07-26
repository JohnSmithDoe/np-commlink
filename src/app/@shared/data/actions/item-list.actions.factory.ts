import { emptyProps } from '@ngrx/store';
import { IBaseItem, TUpdateDTO } from '../../model/base-item.types';
import { TItemListMode, TItemListSortType } from '../../model/item-list.types';

/**
 * The item-list action surface shared verbatim by every list-backed context —
 * the grocery `products`/`shopping`/`storage` slices and `tasks`: the
 * add/remove/update-item operations plus the search/filter/mode/sort view-state
 * setters. Each context spreads these into its own
 * `createActionGroup({ source, events })` and adds its context-specific extras
 * alongside. Only the `source` differs; the event keys — and therefore the
 * generated `[Source] <event>` action-type strings — are identical, so this is a
 * pure de-duplication with no behavioural change.
 *
 * Generic over the item type `T`. The returned map is precisely typed (each
 * value keeps its concrete creator signature), so spreading it leaves NgRx's
 * inference intact — every creator (`updateItem`, `enterPage`, …) is still
 * generated and typed at the call site.
 */
export function createItemListActionEvents<T extends IBaseItem>() {
  return {
    enterPage: emptyProps(),
    addOrUpdateItem: (item: T) => ({ item }),
    addItemFromSearch: emptyProps(),
    addItem: (item: T) => ({ item }),
    addItemFailure: (item: T) => ({ item }),
    removeItem: (item: T) => ({ item }),
    updateItem: (item: TUpdateDTO<T>) => ({ item }),
    updateSearch: (searchQuery?: string) => ({ searchQuery }),
    updateFilter: (filterBy?: string) => ({ filterBy }),
    updateMode: (mode?: TItemListMode) => ({ mode }),
    updateSort: (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  };
}
