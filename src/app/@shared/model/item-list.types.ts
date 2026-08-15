import { BaseItem } from './base-item.types';

export type ItemListSortType = string;
export type ItemListSortDirection = 'asc' | 'desc';
export type ItemListSort = {
  sortDirection: ItemListSortDirection;
  sortBy: ItemListSortType;
};
export type ItemListSortOption = {
  type: ItemListSortType;
  labelKey: string;
};

export type ItemListId = string;

export interface ItemList<T extends BaseItem> {
  id?: ItemListId;
  items: T[];
  searchQuery?: string;
  sort?: ItemListSort;
  filterBy?: string;
}

export interface SearchResult<T extends BaseItem> {
  listItems: T[];
  searchTerm: string;
  exactMatch?: T; // the item from the list where the name matches exactly
}
