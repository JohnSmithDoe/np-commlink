import { computed, Injectable, signal } from '@angular/core';
import { BaseCategoryListPageFacade } from '../../../@shared/data/categories/category-list-page.facade.base';
import { itemListCommands } from '../../../@shared/data/item-lists/list-page.facade.base';
import { Category, CategoryId } from '../../../@shared/model/category.types';
import { categoryById } from '../../../@shared/util/categories/category.utils';
import { HOUSEHOLD_CATEGORIES_LIST_ID } from '../../model/household-list.types';
import {
  ROUTE_BY_LIST_ID,
  TITLE_KEY_BY_LIST_ID,
} from '../../util/household-list.utils';
import { DispatchableAction } from '../../../@shared/model/dispatchable-action.types';
import { HouseholdActions } from '../household.actions';
import { HouseholdCategoriesActions } from './household-categories.actions';
import { selectActiveHouseholdListId } from '../list/household-list.selector';
import {
  selectHouseholdCategories,
  selectHouseholdCategoriesListItems,
  selectHouseholdCategoriesSearchResult,
  selectHouseholdCategoryList,
  selectHouseholdCountByCategory,
  selectHouseholdTaggedByCategory,
} from './household-categories.selector';

@Injectable({ providedIn: 'root' })
export class HouseholdCategoriesPageFacade extends BaseCategoryListPageFacade {
  readonly #activeListId = this.store.selectSignal(selectActiveHouseholdListId);

  readonly catalogListId = HOUSEHOLD_CATEGORIES_LIST_ID;
  protected readonly actions = HouseholdCategoriesActions;

  protected readonly commands = itemListCommands(this.store, {
    updateSearch: HouseholdCategoriesActions.updateSearch,
    updateSort: HouseholdCategoriesActions.updateSort,
    addItemFromSearch: HouseholdCategoriesActions.addItemFromSearch,
  });

  readonly state = this.store.selectSignal(selectHouseholdCategoryList);
  readonly items = this.store.selectSignal(selectHouseholdCategoriesListItems);
  readonly searchResult = this.store.selectSignal(
    selectHouseholdCategoriesSearchResult
  );
  readonly categories = this.store.selectSignal(selectHouseholdCategories);
  readonly countById = this.store.selectSignal(selectHouseholdCountByCategory);
  readonly undoScope = signal(HOUSEHOLD_CATEGORIES_LIST_ID);

  readonly #taggedWith = this.store.selectSignal(
    selectHouseholdTaggedByCategory
  );
  readonly listHref = computed(() => ROUTE_BY_LIST_ID[this.#activeListId()]);
  readonly listTitleKey = computed(
    () => TITLE_KEY_BY_LIST_ID[this.#activeListId()]
  );

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
    if (category) this.removeCategory(category);
  }

  protected override restoreActionFor(category: Category): DispatchableAction {
    return HouseholdActions.restoreCategory(
      category,
      this.#taggedWith()(category.id)
    );
  }
}
