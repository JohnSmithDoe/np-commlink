import { InjectionToken, Signal } from '@angular/core';
import { BaseItem } from '../../model/base-item.types';
import { Category, CategoryId } from '../../model/category.types';
import {
  SearchResult,
  ItemListSortType,
  ListState,
} from '../../model/item-list.types';

export interface ListPageFacade {
  readonly state: Signal<ListState<BaseItem> | undefined>;
  readonly items: Signal<BaseItem[] | undefined>;
  readonly searchResult: Signal<SearchResult<BaseItem> | undefined>;
  readonly catalog: Signal<readonly Category[]>;

  search(term?: string): void;
  addItemFromSearch(): void;
  setSortMode(type: ItemListSortType): void;
  selectCategory(categoryId?: CategoryId): void;
  showCreateDialog(): void;
  manageCategories?(): void;
}

export const LIST_FACADE = new InjectionToken<ListPageFacade>('LIST_FACADE');
