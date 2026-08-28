/* ─── why ─────────────────────────────────────────────────────────
 * `drillTo` is the one override. The base navigates to `listHref()` with a
 * `?filter=<id>` query param, which is how tasks and household narrow their
 * own list; cash has a dedicated `/cash/category/:categoryId` route with its
 * own page and its own totals, so it drills there instead. `listHref` is
 * still the return target, and only that.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Router } from '@angular/router';
import { BaseCategoryListPageFacade } from '../../../@shared/data/categories/category-list-page.facade.base';
import { itemListCommands } from '../../../@shared/data/item-lists/list-page.facade.base';
import { CategoryId } from '../../../@shared/model/category.types';
import { CASH_CATEGORIES_LIST_ID } from '../../model/cash.types';
import { CashCategoriesActions } from './cash-categories.actions';
import {
  selectCashCategoriesListItems,
  selectCashCategoriesSearchResult,
  selectCashCategoryList,
  selectCashCountByCategory,
} from './cash-categories.selector';

@Injectable({ providedIn: 'root' })
export class CashCategoriesPageFacade extends BaseCategoryListPageFacade {
  readonly #router = inject(Router);

  readonly catalogListId = CASH_CATEGORIES_LIST_ID;
  protected readonly actions = CashCategoriesActions;

  protected readonly commands = itemListCommands(this.store, {
    updateSearch: CashCategoriesActions.updateSearch,
    updateSort: CashCategoriesActions.updateSort,
    addItemFromSearch: CashCategoriesActions.addItemFromSearch,
  });

  readonly state = this.store.selectSignal(selectCashCategoryList);
  readonly items = this.store.selectSignal(selectCashCategoriesListItems);
  readonly searchResult = this.store.selectSignal(
    selectCashCategoriesSearchResult
  );
  readonly countById = this.store.selectSignal(selectCashCountByCategory);
  readonly listHref = signal('/cash');
  readonly listTitleKey = signal(marker('page-title.cash'));

  override drillTo(id: CategoryId): void {
    void this.#router.navigate(['/cash/category', id]);
  }
}
