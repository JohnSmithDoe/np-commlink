import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TGroceryListId } from '../model/grocery-list.types';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ICategoriesPageFacade } from '../../@shared/util/categories/categories-page.facade';
import { GroceryCategoriesActions } from './actions/grocery-categories.actions';
import {
  selectListCategories,
  selectListIdParam,
} from './selectors/grocery-list.selector';

import { TCategoryId } from '../../@shared/model/category.types';

// The three grocery lists share ONE catalog, but each manage-categories view is
// scoped to a list: the counts + drill target are that list's. Both are keyed
// off the `:listId` route param (like the multi-list page facade), so a single
// root instance serves the shopping/storage/products manage routes.
const LIST_HREF: Record<TGroceryListId, string> = {
  _shopping: '/groceries/shopping/_shopping',
  _storage: '/groceries/storage/_storage',
  _products: '/groceries/products/_products',
};
const LIST_TITLE_KEY: Record<TGroceryListId, string> = {
  _shopping: 'page-title.groceries-shopping',
  _storage: 'page-title.groceries-storage',
  _products: 'page-title.groceries-products',
};

/**
 * {@link ICategoriesPageFacade} for the grocery shared catalog, scoped to the
 * `:listId` route param. Add/rename/remove dispatch the fan-out
 * {@link GroceryCategoriesActions} (applied by all three grocery reducers with
 * the same pre-minted id), so managing the catalog from any one list keeps the
 * three in lockstep. `drillTo` navigates to that list pre-filtered.
 */
@Injectable({ providedIn: 'root' })
export class GroceryCategoriesPageFacade implements ICategoriesPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #listId = this.#store.selectSignal(selectListIdParam);
  readonly #activeListId = computed<TGroceryListId>(
    () => this.#listId() ?? '_shopping'
  );

  readonly categories = this.#store.selectSignal(selectListCategories);
  readonly listTitleKey = computed(() => LIST_TITLE_KEY[this.#activeListId()]);
  readonly listHref = computed(() => LIST_HREF[this.#activeListId()]);

  add(name: string): void {
    this.#store.dispatch(GroceryCategoriesActions.add({ id: uuidv4(), name }));
  }

  rename(id: TCategoryId, name: string): void {
    this.#store.dispatch(GroceryCategoriesActions.rename(id, name));
  }

  remove(id: TCategoryId): void {
    this.#store.dispatch(GroceryCategoriesActions.remove(id));
  }

  drillTo(id: TCategoryId): void {
    void this.#router.navigate([this.listHref()], {
      queryParams: { filter: id },
    });
  }
}
