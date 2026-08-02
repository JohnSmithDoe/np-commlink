import { computed, Injectable } from '@angular/core';
import { BaseCategoryListPageFacade } from '../../../@shared/data/categories/category-list-page.facade.base';
import { Category, CategoryId } from '../../../@shared/model/category.types';
import { categoryById } from '../../../@shared/util/categories/category.utils';
import {
  HOUSEHOLD_CATEGORIES_LIST_ID,
  HouseholdListId,
} from '../../model/household-list.types';
import { HouseholdCategoriesActions } from './household-categories.actions';
import { selectActiveHouseholdListId } from '../list/household-list.selector';
import {
  selectHouseholdCategories,
  selectHouseholdCategoriesListItems,
  selectHouseholdCategoriesSearchResult,
  selectHouseholdCategoryList,
  selectHouseholdCountByCategory,
} from './household-categories.selector';

const LIST_HREF: Record<HouseholdListId, string> = {
  _shopping: '/household/shopping/_shopping',
  _storage: '/household/storage/_storage',
  _products: '/household/products/_products',
};

@Injectable({ providedIn: 'root' })
export class HouseholdCategoriesPageFacade extends BaseCategoryListPageFacade {
  readonly #activeListId = this.store.selectSignal(selectActiveHouseholdListId);

  readonly catalogListId = HOUSEHOLD_CATEGORIES_LIST_ID;
  protected readonly actions = HouseholdCategoriesActions;

  readonly state = this.store.selectSignal(selectHouseholdCategoryList);
  readonly items = this.store.selectSignal(selectHouseholdCategoriesListItems);
  readonly searchResult = this.store.selectSignal(
    selectHouseholdCategoriesSearchResult
  );
  readonly categories = this.store.selectSignal(selectHouseholdCategories);
  readonly countById = this.store.selectSignal(selectHouseholdCountByCategory);
  readonly listHref = computed(() => LIST_HREF[this.#activeListId()]);

  addCategory(category: Category): void {
    this.store.dispatch(HouseholdCategoriesActions.addItem(category));
  }

  renameCategory(id: CategoryId, to: string): void {
    this.store.dispatch(
      HouseholdCategoriesActions.updateItem({ id, name: to })
    );
  }

  removeCategoryById(id: CategoryId): void {
    const category = categoryById(this.categories(), id);
    if (!category) return;
    this.store.dispatch(HouseholdCategoriesActions.removeItem(category));
  }
}
