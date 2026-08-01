import { inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Action, Store } from '@ngrx/store';
import { IBaseItem } from '../../model/base-item.types';
import { ICategory, TCategoryId } from '../../model/category.types';
import {
  IListState,
  ISearchResult,
  TItemListId,
  TItemListSortType,
} from '../../model/item-list.types';
import {
  ICategoryListPageFacade,
  NO_CATALOG,
  openCategoryCreate,
  openCategoryEdit,
} from '../../util/categories/category-list.facade';
import { ItemDialogService } from '../../util/item-lists/item-dialog.service';

/**
 * The slice of an item-list action group a catalog page dispatches.
 *
 * Structural rather than the generated group's own type: every catalog action
 * group is `createActionGroup({ source, events: createItemListActionEvents<
 * ICategory>() })`, and naming the five creators used here says which ones a
 * catalog page actually needs — a group missing one is a compile error at the
 * subclass rather than at a dispatch.
 */
interface ICategoryListActions {
  updateSearch: (searchQuery?: string) => Action;
  addItemFromSearch: () => Action;
  updateSort: (
    sortBy?: TItemListSortType,
    sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle'
  ) => Action;
  addOrUpdateItem: (item: ICategory) => Action;
  removeItem: (item: ICategory) => Action;
}

/**
 * The catalog page facade for a domain whose catalog is an ordinary item list.
 *
 * `TaskCategoriesPageFacade` and `GroceryCategoriesPageFacade` were line-for-line
 * identical apart from their action group, their selectors and where a drill
 * lands — nine method bodies duplicated, each one a single dispatch. A subclass
 * now supplies only what differs: the reads, the action group, `catalogListId`
 * and `listHref`.
 *
 * It lives in `@shared/data` rather than beside the contract in `@shared/util`
 * because it injects `Store`, and `commlink/ngrx-data-layer-only` allows `@ngrx`
 * only under `data/`.
 *
 * Cash deliberately does NOT extend it. Its catalog carries cascades of its own —
 * deleting a category drops the rules that assigned it, a merge remaps a scalar
 * `categoryId` — so its events are named for what they do and four of these
 * bodies would have to be overridden anyway. Sharing a shape is not sharing
 * behaviour.
 */
export abstract class BaseCategoryListPageFacade implements ICategoryListPageFacade {
  protected readonly store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);

  /** The catalog's own list id — the `ItemDialogService` handshake token. */
  abstract readonly catalogListId: TItemListId;
  protected abstract readonly actions: ICategoryListActions;

  abstract readonly state: Signal<IListState<ICategory>>;
  abstract readonly items: Signal<IBaseItem[] | undefined>;
  abstract readonly searchResult: Signal<ISearchResult<IBaseItem> | undefined>;
  abstract readonly categories: Signal<readonly ICategory[]>;
  abstract readonly countById: Signal<Map<TCategoryId, number>>;
  /** Where "back" goes, and what a drill filters — the list this catalog serves. */
  abstract readonly listHref: Signal<string>;

  readonly catalog = NO_CATALOG;

  search(term?: string): void {
    this.store.dispatch(this.actions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.store.dispatch(this.actions.addItemFromSearch());
  }

  setSortMode(type: TItemListSortType): void {
    this.store.dispatch(this.actions.updateSort(type, 'toggle'));
  }

  // A catalog references no catalog of its own while nesting is deferred.
  selectCategory(): void {}

  showCreateDialog(): void {
    openCategoryCreate(
      this.#dialogs,
      this.catalogListId,
      this.state().searchQuery
    );
  }

  showEditDialog(category: ICategory): void {
    openCategoryEdit(this.#dialogs, this.catalogListId, category);
  }

  // One command for both modes: the catalog reducer resolves add-or-update, the
  // same way every list's `addOrUpdateItem` does.
  saveCategory(category: ICategory): void {
    this.store.dispatch(this.actions.addOrUpdateItem(category));
  }

  removeCategory(category: ICategory): void {
    this.store.dispatch(this.actions.removeItem(category));
  }

  drillTo(id: TCategoryId): void {
    void this.#router.navigate([this.listHref()], {
      queryParams: { filter: id },
    });
  }
}
