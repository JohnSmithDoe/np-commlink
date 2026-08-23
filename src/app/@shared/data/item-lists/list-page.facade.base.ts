/* ─── why ─────────────────────────────────────────────────────────
 * Ten page facades repeat the same four forwarding lines; only WHERE
 * they forward differs — a store plus an action group, or a sibling
 * collection facade. `commands` is that seam, and `itemListCommands`
 * adapts the store half.
 *
 * Members are OPTIONAL where their ABSENCE is the declaration: no
 * `catalog` means no category axis, so `ListPageComponent` renders no
 * chip bar — one statement of the fact, with no empty catalog to keep in
 * step and nothing to read as "not loaded yet". `selectCategory` cannot
 * drift from it, since no chips means no caller. No `addItemFromSearch`
 * means typing-then-adding opens the create dialog seeded with the query.
 *
 * `manageCategories` must NOT move here. `ListPageComponent` reads
 * `!!facade.manageCategories` to decide the button exists at all, so
 * defining it on a base — even as a no-op — grows it on all ten pages.
 * ───────────────────────────────────────────────────────────────── */
import { Signal } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { BaseItem } from '../../model/base-item.types';
import { CategoryId } from '../../model/category.types';
import {
  ItemList,
  ItemListSortDirection,
  ItemListSortType,
  SearchResult,
} from '../../model/item-list.types';
import { ListPageFacade } from '../../util/item-lists/list-page.facade';

interface ListPageCommands {
  search(term?: string): void;
  setSortMode(
    type: ItemListSortType,
    direction?: ItemListSortDirection | 'toggle'
  ): void;
  addItemFromSearch?(): void;
  selectCategory?(categoryId?: CategoryId): void;
}

interface ItemListCommandActions {
  updateSearch: (searchQuery?: string) => Action;
  updateSort: (
    sortBy?: ItemListSortType,
    sortDirection?: ItemListSortDirection | 'keep' | 'toggle'
  ) => Action;
  addItemFromSearch?: () => Action;
  updateFilter?: (filterBy?: string) => Action;
}

export function itemListCommands(
  store: Store,
  actions: ItemListCommandActions
): ListPageCommands {
  const { updateSearch, updateSort, addItemFromSearch, updateFilter } = actions;
  return {
    search: (term) => store.dispatch(updateSearch(term)),
    setSortMode: (type, direction = 'toggle') =>
      store.dispatch(updateSort(type, direction)),
    ...(addItemFromSearch && {
      addItemFromSearch: () => store.dispatch(addItemFromSearch()),
    }),
    ...(updateFilter && {
      selectCategory: (categoryId?: CategoryId) =>
        store.dispatch(updateFilter(categoryId)),
    }),
  };
}

export abstract class BaseListPageFacade implements ListPageFacade {
  protected abstract readonly commands: ListPageCommands;

  abstract readonly state: Signal<ItemList<BaseItem> | undefined>;
  abstract readonly items: Signal<BaseItem[] | undefined>;
  abstract readonly searchResult: Signal<SearchResult<BaseItem> | undefined>;

  abstract showCreateDialog(): void;

  search(term?: string): void {
    this.commands.search(term);
  }

  setSortMode(type: ItemListSortType): void {
    this.commands.setSortMode(type, 'toggle');
  }

  addItemFromSearch(): void {
    if (this.commands.addItemFromSearch) {
      this.commands.addItemFromSearch();
    } else {
      this.showCreateDialog();
    }
  }

  selectCategory(categoryId?: CategoryId): void {
    this.commands.selectCategory?.(categoryId);
  }
}
