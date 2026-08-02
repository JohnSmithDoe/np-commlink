import { inject } from '@angular/core';
import { BaseCategoryEditItemDialog } from '../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { HouseholdCategoriesPageFacade } from '../data';
import { BaseItem } from '../../@shared/model/base-item.types';
import { Category, CategoryId } from '../../@shared/model/category.types';

export abstract class BaseHouseholdEditItemDialog<
  T extends BaseItem,
> extends BaseCategoryEditItemDialog<T> {
  readonly #catalog = inject(HouseholdCategoriesPageFacade);

  readonly categories = this.#catalog.categories;

  protected addCategoryToCatalog(category: Category): void {
    this.#catalog.addCategory(category);
  }
  protected removeCategoryFromCatalog(categoryId: CategoryId): void {
    this.#catalog.removeCategoryById(categoryId);
  }
  protected renameCategoryInCatalog(id: CategoryId, to: string): void {
    this.#catalog.renameCategory(id, to);
  }
}
