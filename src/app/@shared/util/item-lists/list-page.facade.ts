import { InjectionToken, Signal } from '@angular/core';
import { Marker } from '../../model/app.types';
import { BaseItem } from '../../model/base-item.types';
import { Category, CategoryId } from '../../model/category.types';
import {
  ItemList,
  ItemListSortOption,
  ItemListSortType,
  SearchResult,
} from '../../model/item-list.types';

export interface ListSection {
  readonly id: string;
  readonly labelKey?: Marker;
  readonly items: BaseItem[] | undefined;
}

export interface ListPageFacade {
  readonly state: Signal<ItemList<BaseItem> | undefined>;
  readonly items: Signal<BaseItem[] | undefined>;
  readonly searchResult: Signal<SearchResult<BaseItem> | undefined>;
  readonly sections?: Signal<readonly ListSection[]>;
  readonly catalog?: Signal<readonly Category[]>;
  readonly sortOptions?: Signal<readonly ItemListSortOption[]>;
  readonly sortable?: Signal<boolean>;
  readonly searchable?: Signal<boolean>;
  readonly hasToolbar?: Signal<boolean>;

  search(term?: string): void;
  addItemFromSearch(): void;
  setSortMode(type: ItemListSortType): void;
  selectCategory?(categoryId?: CategoryId): void;
  reorder?(ids: string[], sectionId?: string): void;
  showCreateDialog(): void;
  manageCategories?(): void;
}

export const LIST_FACADE = new InjectionToken<ListPageFacade>('LIST_FACADE');
