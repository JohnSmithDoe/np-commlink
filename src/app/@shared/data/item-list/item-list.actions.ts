import { emptyProps } from '@ngrx/store';
import {
  IBaseItem,
  TItemListMode,
  TItemListSortType,
  TUpdateDTO,
} from '../../model/types';

/**
 * The item-list action surface shared verbatim by every list-backed context —
 * the grocery `products`/`shopping`/`storage` slices and `tasks`: the
 * add/remove/update-item operations plus the search/filter/mode/sort view-state
 * setters. Each context spreads these into its own
 * `createActionGroup({ source, events })` and adds its context-specific extras
 * alongside. Only the `source` differs; the event names — and therefore the
 * generated `[Source] <Event>` action-type strings the reducers and save
 * effects match on — are identical, so this is a pure de-duplication with no
 * behavioural change.
 *
 * Generic over the item type `T`. The returned map is precisely typed (each
 * value keeps its concrete creator signature), so spreading it leaves NgRx's
 * inference intact — every camelCased creator (`updateItem`, `enterPage`, …)
 * is still generated and typed at the call site.
 */
export function itemListEvents<T extends IBaseItem>() {
  return {
    // Effects only
    'Enter Page': emptyProps(),
    'Add Or Update Item': (item: T) => ({ item }),
    'Add Item From Search': emptyProps(),

    // Operations
    'Add Item': (item: T) => ({ item }),
    'Add Item Failure': (item: T) => ({ item }),
    'Remove Item': (item: T) => ({ item }),
    'Update Item': (item: TUpdateDTO<T>) => ({ item }),
    'Update Search': (searchQuery?: string) => ({ searchQuery }),
    'Update Filter': (filterBy?: string) => ({ filterBy }),
    'Update Mode': (mode?: TItemListMode) => ({ mode }),
    'Update Sort': (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  };
}
