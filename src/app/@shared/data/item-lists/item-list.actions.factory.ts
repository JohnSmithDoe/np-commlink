import { emptyProps } from '@ngrx/store';
import { BaseItem, UpdateDTO } from '../../model/base-item.types';
import { ItemListSortType } from '../../model/item-list.types';

export function createItemListActionEvents<T extends BaseItem>() {
  return {
    addOrUpdateItem: (item: T) => ({ item }),
    addItemFromSearch: emptyProps(),
    addItem: (item: T) => ({ item }),
    addItemFailure: (item: T) => ({ item }),
    removeItem: (item: T) => ({ item }),
    updateItem: (item: UpdateDTO<T>) => ({ item }),
    updateSearch: (searchQuery?: string) => ({ searchQuery }),
    updateFilter: (filterBy?: string) => ({ filterBy }),
    updateSort: (
      sortBy?: ItemListSortType,
      sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDirection }),
  };
}
