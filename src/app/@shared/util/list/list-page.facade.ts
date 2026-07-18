import { InjectionToken, Signal } from '@angular/core';
import {
  IBaseItem,
  IListState,
  ISearchResult,
  TItemListCategory,
  TItemListMode,
  TItemListSortType,
} from '../../types';

/**
 * Domain-blind contract the generic `ListPageComponent` binds against. Each
 * list domain provides an implementation via the {@link LIST_FACADE} token:
 * grocery's facade drives the route-param multi-list engine (and renders the
 * cross-list search buckets into the page's `[searchExtras]` slot); tasks'
 * facade is a trivial single-list one. This inverts the selector-can't-read-DI
 * constraint — the facade is a service, so it can hold `store.selectSignal(...)`
 * — and keeps the page smart yet identity-free.
 *
 * Grocery-only operations (`addProduct`/`addStorageItem`/`addShoppingItem`,
 * `showCreateProductDialog`) are deliberately NOT on this contract; they live on
 * the concrete grocery facade and are wired only from the grocery pages.
 */
export interface IListPageFacade {
  readonly state: Signal<IListState<IBaseItem> | undefined>;
  readonly filter: Signal<{
    isCategoryModeOrHasFilter: boolean;
    hasFilter: boolean;
  }>;
  readonly items: Signal<IBaseItem[] | undefined>;
  readonly searchResult: Signal<ISearchResult<IBaseItem> | undefined>;
  readonly categories: Signal<{ category: TItemListCategory; count: number }[]>;

  search(term?: string): void;
  addItemFromSearch(): void;
  addCategoryFromSearch(): void;
  setDisplayMode(mode: TItemListMode): void;
  setSortMode(type: TItemListSortType): void;
  selectCategory(category: TItemListCategory): void;
  deleteCategory(category: TItemListCategory): void;
  showCreateDialog(): void;
}

export const LIST_FACADE = new InjectionToken<IListPageFacade>('LIST_FACADE');
