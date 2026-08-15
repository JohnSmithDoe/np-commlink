import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Category, CategoryId } from '../../../@shared/model/category.types';
import { categoryById } from '../../../@shared/util/categories/category.utils';
import { CashCategoriesActions } from './cash-categories.actions';
import { selectCashCategories } from './cash-categories.selector';

@Injectable({ providedIn: 'root' })
export class CashCategoriesFacade {
  readonly #store = inject(Store);

  readonly allItems = this.#store.selectSignal(selectCashCategories);

  addCategory(category: Category): void {
    this.#store.dispatch(CashCategoriesActions.addItem(category));
  }

  renameCategory(id: CategoryId, to: string): void {
    this.#store.dispatch(CashCategoriesActions.updateItem({ id, name: to }));
  }

  removeCategoryById(id: CategoryId): void {
    const category = categoryById(this.allItems(), id);
    if (!category) return;
    this.#store.dispatch(CashCategoriesActions.removeItem(category));
  }
}
