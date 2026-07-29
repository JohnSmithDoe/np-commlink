import { IBaseItem } from './base-item.types';
import { ICategory } from './category.types';

export type TItemListSortType = 'name' | string;
export type TItemListSortDir = 'asc' | 'desc';
export type TItemListSort = {
  sortDir: TItemListSortDir;
  sortBy: TItemListSortType;
};

export type TItemListMode = 'alphabetical' | 'categories';
export type TItemListId = string;

// `id` is the list's own identity, read by the grocery cross-list search to pick
// which sibling buckets to decorate a result with. There is deliberately no
// `title`: a list's heading is an i18n key the page passes in, never persisted
// state — the six slices each carried a hardcoded English one nothing read.
export interface IItemList<T extends IBaseItem> {
  id?: TItemListId;
  items: T[];
  categories: ICategory[];
  mode: TItemListMode;
  searchQuery?: string;
  sort?: TItemListSort;
  filterBy?: string;
}

export type IListState<T extends IBaseItem> = IItemList<T>;

export interface ISearchResult<T extends IBaseItem> {
  listItems: T[];
  hasSearchTerm: boolean; // length of the searchTerm > 0
  searchTerm: string;
  exactMatch?: T; // the item from the list where the name matches exactly
  // Domain-blind base result. The grocery cross-list search buckets
  // (products/storageItems/shoppingItems) live on the groceries-owned
  // `IGrocerySearchResult<T>` extension in `groceries/model`.
}
