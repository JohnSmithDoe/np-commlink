import { InjectionToken, Signal } from '@angular/core';
import { IBaseItem } from '../../model/base-item.types';
import { ICategory, TCategoryId } from '../../model/category.types';
import {
  IListState,
  ISearchResult,
  TItemListMode,
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
 * computation only invites them to disagree. `categories` does stay — a domain
 * really does decorate its own catalog with its own counts.
 */
export interface IListPageFacade {
  readonly state: Signal<IListState<IBaseItem> | undefined>;
  readonly items: Signal<IBaseItem[] | undefined>;
  readonly searchResult: Signal<ISearchResult<IBaseItem> | undefined>;
  readonly categories: Signal<{ category: ICategory; count: number }[]>;

  search(term?: string): void;
  addItemFromSearch(): void;
  addCategoryFromSearch(): void;
  setDisplayMode(mode: TItemListMode): void;
  setSortMode(type: TItemListSortType): void;
  selectCategory(categoryId: TCategoryId): void;
  deleteCategory(categoryId: TCategoryId): void;
  showCreateDialog(): void;
  // Navigate to this list's manage-categories page. Optional: category-less
  // lists (tracking) omit it — the shell only renders the entry button when
  // `hasCategories` is set, so it is never called for them.
  manageCategories?(): void;
  // Persist a category the shell's name dialog just confirmed. Optional for the
  // same reason as `manageCategories`: the dialog only renders when
  // `hasCategories` is set.
  saveCategory?(name: string): void;
}

export const LIST_FACADE = new InjectionToken<IListPageFacade>('LIST_FACADE');
