import { InjectionToken, Provider, signal, Signal, Type } from '@angular/core';
import { ICategory, TCategoryId } from '../../model/category.types';
import { TItemListId } from '../../model/item-list.types';
import { createCategory } from '../app.factory';
import { ItemDialogService } from '../item-lists/item-dialog.service';
import { IListPageFacade, LIST_FACADE } from '../item-lists/list-page.facade';

/**
 * What a catalog page needs beyond an ordinary list page.
 *
 * A catalog IS a list, so the shell, the search, the sort and the empty state all
 * come from {@link IListPageFacade} — this adds only the three things a category
 * row does that an item row does not: report how many items reference it, drill
 * into the owning list filtered to it, and save an edit through the shared dialog.
 *
 * It extends rather than replaces the list contract so ONE implementation per
 * domain serves both: the route binds `LIST_FACADE` and `CATEGORY_LIST_FACADE` to
 * the same instance with `useExisting`, exactly as the retired
 * `CATEGORIES_FACADE` was bound.
 */
export interface ICategoryListPageFacade extends IListPageFacade {
  /** The catalog's own list id — the `ItemDialogService` handshake token. */
  readonly catalogListId: TItemListId;
  /** The whole catalog, for the dialog's duplicate-name rule. Never a page view. */
  readonly categories: Signal<readonly ICategory[]>;
  /** How many items reference each category, keyed by id. */
  readonly countById: Signal<Map<TCategoryId, number>>;
  /**
   * Where "back" goes — the list this catalog serves.
   *
   * The shared page header's start slot is a fixed menu button, so a nested page
   * has no back affordance of its own; the catalog projects one into the toolbar
   * and this is its target.
   */
  readonly listHref: Signal<string>;

  saveCategory(category: ICategory): void;
  removeCategory(category: ICategory): void;
  /** Open the shared dialog over an existing entry (the row's rename swipe). */
  showEditDialog(category: ICategory): void;
  /** Navigate to the owning list, filtered down to this category. */
  drillTo(id: TCategoryId): void;
}

export const CATEGORY_LIST_FACADE = new InjectionToken<ICategoryListPageFacade>(
  'CATEGORY_LIST_FACADE'
);

/**
 * Both bindings the catalog page needs, from one facade.
 *
 * Binding only `CATEGORY_LIST_FACADE` compiles and then throws
 * `NullInjectorError: LIST_FACADE` on navigation — a runtime failure on a route,
 * the least-tested surface there is. Each of the three catalog routes used to
 * spell the pair out and carry a comment explaining it; a comment repeated at
 * every site is the signal that the composition belongs in a function.
 */
export const provideCategoryListFacade = (
  facade: Type<ICategoryListPageFacade>
): Provider[] => [
  { provide: LIST_FACADE, useExisting: facade },
  { provide: CATEGORY_LIST_FACADE, useExisting: facade },
];

// A catalog references no catalog of its own while nesting is deferred, which is
// also why every implementation's `selectCategory` is a no-op.
export const NO_CATALOG: Signal<readonly ICategory[]> = signal<
  readonly ICategory[]
>([]).asReadonly();

/**
 * The catalog page's two dialog commands. They carry no domain content — the
 * only thing that varies is the list id, which the contract already publishes as
 * `catalogListId` — so the three implementations held three verbatim copies, and
 * three chances to open a dialog against the wrong list.
 */
export const openCategoryCreate = (
  dialogs: ItemDialogService,
  listId: TItemListId,
  searchQuery?: string
): void =>
  dialogs.open({
    item: createCategory(searchQuery ?? ''),
    listId,
    editMode: 'create',
  });

export const openCategoryEdit = (
  dialogs: ItemDialogService,
  listId: TItemListId,
  category: ICategory
): void => dialogs.open({ item: category, listId, editMode: 'update' });
