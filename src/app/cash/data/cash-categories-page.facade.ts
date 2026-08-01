import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ICategory, TCategoryId } from '../../@shared/model/category.types';
import { TItemListSortType } from '../../@shared/model/item-list.types';
import { createCategory } from '../../@shared/util/app.factory';
import {
  ICategoryListPageFacade,
  NO_CATALOG,
  openCategoryCreate,
  openCategoryEdit,
} from '../../@shared/util/categories/category-list.facade';
import { ItemDialogService } from '../../@shared/util/item-lists/item-dialog.service';
import { CASH_CATEGORIES_LIST_ID } from '../model/cash.types';
import { CashActions } from './cash.actions';
import {
  selectCashCategories,
  selectCashCategoriesListItems,
  selectCashCategoriesSearchResult,
  selectCashCategoryList,
  selectCashCountByCategory,
} from './cash.selector';

/**
 * {@link ICategoryListPageFacade} for the single cash catalog, rendered by the
 * shared list page like every other catalog.
 *
 * Cash keeps its own category events rather than the generic list ones: deleting a
 * category here also drops the RULES that assigned it, and a merge remaps a scalar
 * `categoryId` on transactions — cascades that are cash's alone, so they stay named
 * for what they do (`removeCategory`, not `removeItem`).
 *
 * `drillTo` goes to the cash category→transactions view, cash's answer to the
 * grocery/tasks `?filter` drill, since cash has no `filterBy` list.
 */
@Injectable({ providedIn: 'root' })
export class CashCategoriesPageFacade implements ICategoryListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);

  readonly catalogListId = CASH_CATEGORIES_LIST_ID;

  readonly state = this.#store.selectSignal(selectCashCategoryList);
  readonly items = this.#store.selectSignal(selectCashCategoriesListItems);
  readonly searchResult = this.#store.selectSignal(
    selectCashCategoriesSearchResult
  );
  readonly categories = this.#store.selectSignal(selectCashCategories);
  readonly countById = this.#store.selectSignal(selectCashCountByCategory);
  readonly listHref = signal('/cash');
  readonly catalog = NO_CATALOG;

  search(term?: string): void {
    this.#store.dispatch(CashActions.updateCategorySearch(term));
  }

  addItemFromSearch(): void {
    const name = this.state().searchQuery ?? '';
    if (!name.trim()) return;
    this.#store.dispatch(CashActions.addCategory(createCategory(name)));
    this.#store.dispatch(CashActions.updateCategorySearch(''));
  }

  setSortMode(type: TItemListSortType): void {
    this.#store.dispatch(CashActions.updateCategorySort(type, 'toggle'));
  }

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

  // Add-or-rename resolved here rather than by a reducer: cash's two category
  // events carry different cascades, so which one this is has to be decided.
  saveCategory(category: ICategory): void {
    const exists = this.categories().some((entry) => entry.id === category.id);
    this.#store.dispatch(
      exists
        ? CashActions.updateCategory(category.id, category.name)
        : CashActions.addCategory(category)
    );
  }

  removeCategory(category: ICategory): void {
    this.#store.dispatch(CashActions.removeCategory(category.id));
  }

  drillTo(id: TCategoryId): void {
    void this.#router.navigate(['/cash/category', id]);
  }
}
