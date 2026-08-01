import { IBaseItem } from './base-item.types';

// Plainly `string`, and it must stay that way: the sort keys are domain
// vocabulary (`bestBefore`, `dueAt`, `last`), which `@shared/model` may not name.
// It was spelled `'name' | string` — which collapses to `string` anyway, so it
// advertised a completion list and a wrong-key error that neither existed.
export type TItemListSortType = string;
export type TItemListSortDirection = 'asc' | 'desc';
export type TItemListSort = {
  sortDirection: TItemListSortDirection;
  sortBy: TItemListSortType;
};

export type TItemListId = string;

// `id` is the list's own identity, read by the grocery cross-list search to pick
// which sibling buckets to decorate a result with. There is deliberately no
// `title`: a list's heading is an i18n key the page passes in, never persisted
// state — the six slices each carried a hardcoded English one nothing read.
//
// There is deliberately no `categories` either: a catalog is a list of its own
// (`ICategoryList`), living beside the item list rather than inside it. An item
// references it by `categoryIds`, and the page is handed the catalog to resolve
// them — which is what lets one catalog serve three grocery lists instead of
// being copied into each.
export interface IItemList<T extends IBaseItem> {
  id?: TItemListId;
  items: T[];
  searchQuery?: string;
  sort?: TItemListSort;
  filterBy?: string;
}

// A deliberate alias, not a divergence waiting to happen: the same shape reads as
// `IItemList` where a domain declares one and as `IListState` where the engine
// treats it as slice state.
export type IListState<T extends IBaseItem> = IItemList<T>;

// A result exists only while a non-empty query is active, so its presence IS
// "the list is being searched" — there is no flag for it.
export interface ISearchResult<T extends IBaseItem> {
  listItems: T[];
  searchTerm: string;
  exactMatch?: T; // the item from the list where the name matches exactly
}
