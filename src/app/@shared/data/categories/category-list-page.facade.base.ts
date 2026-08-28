/* ─── why ─────────────────────────────────────────────────────────
 * Only what a catalog list does BEYOND an ordinary one: count a row's
 * usages, drill into the list it filters, edit its own rows. The toolbar
 * three live on `BaseListPageFacade` and are not repeated here.
 *
 * `actions` survives alongside `commands` because they answer different
 * questions — `commands` is the toolbar, `actions` the two writes below —
 * and it cannot be derived from `this.actions`: a subclass field is
 * assigned only after the base's initializers run (see
 * `base-edit-item-dialog.ts`).
 *
 * No `catalog`, no `selectCategory`: a category is not filed under a
 * category, which is how `ListPageComponent` learns to render no chip bar.
 *
 * And deliberately no `implements CatalogFacade` — on an ABSTRACT class
 * that turns every undeclared member into an implicit abstract one,
 * optional ones included, demanding the `catalog` the line above omits.
 * `provideCatalogFacade` takes a `Type<CatalogFacade>`, so each route
 * manifest type-checks the concrete class instead.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Action, Store } from '@ngrx/store';
import { Category, CategoryId } from '../../model/category.types';
import { ItemListId } from '../../model/item-list.types';
import { createCategory } from '../../util/app.factory';
import { categoryFilterQueryParameters } from '../../util/item-lists/category-filter.route';
import { ItemDialogService } from '../item-lists/item-dialog.service';
import { BaseListPageFacade } from '../item-lists/list-page.facade.base';

interface CatalogWriteActions {
  addOrUpdateItem: (item: Category) => Action;
  removeItem: (item: Category) => Action;
}

export abstract class BaseCategoryListPageFacade extends BaseListPageFacade {
  protected readonly store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);

  abstract readonly catalogListId: ItemListId;
  protected abstract readonly actions: CatalogWriteActions;

  abstract readonly countById: Signal<Map<CategoryId, number>>;
  abstract readonly listHref: Signal<string>;
  abstract readonly listTitleKey: Signal<string>;

  showCreateDialog(): void {
    this.#dialogs.open({
      item: createCategory(this.state()?.searchQuery ?? ''),
      listId: this.catalogListId,
      editMode: 'create',
    });
  }

  showEditDialog(category: Category): void {
    this.#dialogs.open({
      item: category,
      listId: this.catalogListId,
      editMode: 'update',
    });
  }

  saveCategory(category: Category): void {
    this.store.dispatch(this.actions.addOrUpdateItem(category));
  }

  removeCategory(category: Category): void {
    this.store.dispatch(this.actions.removeItem(category));
  }

  drillTo(id: CategoryId): void {
    void this.#router.navigate([this.listHref()], {
      queryParams: categoryFilterQueryParameters(id),
    });
  }
}
