/* ─── why ─────────────────────────────────────────────────────────
 * A second token beside `LIST_FACADE`, for the same reason it exists: one
 * page/dialog pair is shared by three domains, so neither can name a
 * facade the way `TasksPage` names its own. Every member below is one a
 * shared component reads and cannot reach through `ListPageFacade`.
 *
 * `categories` is deliberately absent: `state()?.items` is the same list
 * and is the UNFILTERED one, which is what a duplicate-name check needs.
 * `items` is the list after filtering.
 *
 * `catalogListId` stays a constant rather than reading `state()?.id`. The
 * `loaded` reducers rebuild from a persisted document, so one written
 * without `id` yields a slice without one — and `BaseEditItemDialog` keys
 * `isOpen` off it, so the editor would silently never open again.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken, Provider, Signal, Type } from '@angular/core';
import { Category, CategoryId } from '../../model/category.types';
import { ItemListId } from '../../model/item-list.types';
import { ListPageFacade, LIST_FACADE } from '../item-lists/list-page.facade';

interface CatalogFacade extends ListPageFacade {
  readonly catalogListId: ItemListId;
  readonly countById: Signal<Map<CategoryId, number>>;
  readonly listHref: Signal<string>;
  readonly listTitleKey: Signal<string>;

  saveCategory(category: Category): void;
  removeCategory(category: Category): void;
  showEditDialog(category: Category): void;
  drillTo(id: CategoryId): void;
}

export const CATALOG_FACADE = new InjectionToken<CatalogFacade>(
  'CATALOG_FACADE'
);

export const provideCatalogFacade = (
  facade: Type<CatalogFacade>
): Provider[] => [
  { provide: LIST_FACADE, useExisting: facade },
  { provide: CATALOG_FACADE, useExisting: facade },
];
