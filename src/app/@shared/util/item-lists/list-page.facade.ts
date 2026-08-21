import { InjectionToken, Signal } from '@angular/core';
import { BaseItem } from '../../model/base-item.types';
import { Category, CategoryId } from '../../model/category.types';
import {
  SearchResult,
  ItemListSortOption,
  ItemListSortType,
  ItemList,
} from '../../model/item-list.types';

export interface ListPageFacade {
  readonly state: Signal<ItemList<BaseItem> | undefined>;
  readonly items: Signal<BaseItem[] | undefined>;
  readonly searchResult: Signal<SearchResult<BaseItem> | undefined>;
  readonly catalog?: Signal<readonly Category[]>;
  readonly sortOptions?: Signal<readonly ItemListSortOption[]>;
  readonly sortable?: Signal<boolean>;

  search(term?: string): void;
  addItemFromSearch(): void;
  setSortMode(type: ItemListSortType): void;
  selectCategory?(categoryId?: CategoryId): void;
  showCreateDialog(): void;
  manageCategories?(): void;
}

export const LIST_FACADE = new InjectionToken<ListPageFacade>('LIST_FACADE');
