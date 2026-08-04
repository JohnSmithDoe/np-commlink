import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Category, CategoryId } from '../../@shared/model/category.types';
import { ItemListSortType } from '../../@shared/model/item-list.types';
import { createCategory } from '../../@shared/util/app.factory';
import {
  CategoryListPageFacade,
  NO_CATALOG,
} from '../../@shared/util/categories/category-list.facade';
import {
  openCategoryCreate,
  openCategoryEdit,
} from '../../@shared/data/categories/category-dialogs';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { CASH_CATEGORIES_LIST_ID } from '../model/cash.types';
import { CashActions } from './cash.actions';
import {
  selectCashCategories,
  selectCashCategoriesListItems,
  selectCashCategoriesSearchResult,
  selectCashCategoryList,
  selectCashCountByCategory,
} from './cash.selector';

@Injectable({ providedIn: 'root' })
export class CashCategoriesPageFacade implements CategoryListPageFacade {
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

  setSortMode(type: ItemListSortType): void {
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

  showEditDialog(category: Category): void {
    openCategoryEdit(this.#dialogs, this.catalogListId, category);
  }

  saveCategory(category: Category): void {
    const exists = this.categories().some((entry) => entry.id === category.id);
    this.#store.dispatch(
      exists
        ? CashActions.updateCategory(category.id, category.name)
        : CashActions.addCategory(category)
    );
  }

  removeCategory(category: Category): void {
    this.#store.dispatch(CashActions.removeCategory(category.id));
  }

  drillTo(id: CategoryId): void {
    void this.#router.navigate(['/cash/category', id]);
  }
}
