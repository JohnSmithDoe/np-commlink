import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseCategoryListPageFacade } from '../../../@shared/data/categories/category-list-page.facade.base';
import {
  GROCERY_CATEGORIES_LIST_ID,
  TGroceryListId,
} from '../../model/grocery-list.types';
import { GroceryCategoriesActions } from './grocery-categories.actions';
import {
  selectGroceryCategories,
  selectGroceryCategoriesListItems,
  selectGroceryCategoriesSearchResult,
  selectGroceryCategoryList,
  selectGroceryCountByCategory,
  selectListIdParameter,
} from '../grocery-list.selector';

// Where a drill lands, keyed by the list the shopper came from. The catalog is
// shared, but "show me what's in this category" only means something relative to
// one list, so the page stays scoped to the `:listId` it was opened from.
const LIST_HREF: Record<TGroceryListId, string> = {
  _shopping: '/groceries/shopping/_shopping',
  _storage: '/groceries/storage/_storage',
  _products: '/groceries/products/_products',
};

/**
 * The ONE grocery catalog, scoped to the `:listId` route param for its drill
 * target only. Everything a catalog page does is the shared base's.
 *
 * The catalog itself is not per-list: `GroceryCategoriesActions` is handled once,
 * by the catalog's own reducer, instead of being fanned into all three list
 * reducers with a pre-minted id so three copies could stay in lockstep.
 */
@Injectable({ providedIn: 'root' })
export class GroceryCategoriesPageFacade extends BaseCategoryListPageFacade {
  readonly #store = inject(Store);
  readonly #listId = this.#store.selectSignal(selectListIdParameter);
  readonly #activeListId = computed<TGroceryListId>(
    () => this.#listId() ?? '_shopping'
  );

  readonly catalogListId = GROCERY_CATEGORIES_LIST_ID;
  protected readonly actions = GroceryCategoriesActions;

  readonly state = this.#store.selectSignal(selectGroceryCategoryList);
  readonly items = this.#store.selectSignal(selectGroceryCategoriesListItems);
  readonly searchResult = this.#store.selectSignal(
    selectGroceryCategoriesSearchResult
  );
  readonly categories = this.#store.selectSignal(selectGroceryCategories);
  readonly countById = this.#store.selectSignal(selectGroceryCountByCategory);
  readonly listHref = computed(() => LIST_HREF[this.#activeListId()]);
}
