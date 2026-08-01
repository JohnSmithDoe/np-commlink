import { InjectionToken, Signal } from '@angular/core';
import { IBaseItem } from '../../model/base-item.types';
import { ICategory, TCategoryId } from '../../model/category.types';
import {
  IListState,
  ISearchResult,
  TItemListSortType,
} from '../../model/item-list.types';

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
 * the concrete grocery facade and are wired only from the grocery pages. Nor is
 * anything that is a pure function of `state`: the filter/header derivation the
 * page needs it computes itself, since asking three domains for one identical
 * computation only invites them to disagree.
 *
 * Nothing here names a category as an entity any more — a catalog is a list of
 * its own now, so it binds this same contract rather than being a second mode of
 * somebody else's page. `selectCategory` survives because it is not a
 * category-editing command: it sets `filterBy`, which is how a page arriving
 * from `?filter=<id>` lands pre-filtered.
 */
export interface IListPageFacade {
  readonly state: Signal<IListState<IBaseItem> | undefined>;
  readonly items: Signal<IBaseItem[] | undefined>;
  readonly searchResult: Signal<ISearchResult<IBaseItem> | undefined>;
  /**
   * The catalog this list's items reference, for resolving `categoryIds` to names
   * — in each row's chips and in the active-filter caption.
   *
   * On the contract because a list no longer carries its own copy: the catalog is
   * a sibling list (`ICategoryList`), which is what lets one grocery catalog serve
   * three item lists. A list with no categories (tracking, and a catalog itself
   * while nesting is deferred) reports an empty one.
   */
  readonly catalog: Signal<readonly ICategory[]>;

  search(term?: string): void;
  addItemFromSearch(): void;
  setSortMode(type: TItemListSortType): void;
  selectCategory(categoryId: TCategoryId): void;
  showCreateDialog(): void;
  // Navigate to this list's manage-categories page. Optional: category-less
  // lists (tracking, the catalog page itself) omit it, and its absence IS what
  // suppresses the shell's entry button — there is no second flag to set.
  manageCategories?(): void;
}

export const LIST_FACADE = new InjectionToken<IListPageFacade>('LIST_FACADE');
