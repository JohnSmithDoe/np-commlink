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

export interface IItemList<T extends IBaseItem> {
  id?: TItemListId;
  title: string;
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
