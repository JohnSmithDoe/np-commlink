import { inject } from '@angular/core';
import { IBaseItem, ICategory, TCategoryId } from '../../@shared/model/types';
import { BaseCategoryEditItemDialog } from '../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { GroceryListPageFacade } from '../data';

/**
 * Intermediate base for the grocery edit-dialog wrappers (shopping + storage):
 * every grocery list routes its category-catalog commands to the same
 * `GroceryListPageFacade`, so the three category hooks are implemented once here.
 * Subclasses supply only the list-specific `listId` / `seedItem` / `categories` /
 * `listItems` / `save` (+ any per-field updaters) off the shared `facade`.
 */
export abstract class BaseGroceryEditItemDialog<
  T extends IBaseItem,
> extends BaseCategoryEditItemDialog<T> {
  protected readonly facade = inject(GroceryListPageFacade);

  protected addCategoryCmd(category: ICategory): void {
    this.facade.addGroceryCategory(category);
  }
  protected removeCategoryCmd(categoryId: TCategoryId): void {
    this.facade.deleteCategory(categoryId);
  }
  protected renameCategoryCmd(id: TCategoryId, to: string): void {
    this.facade.renameGroceryCategory(id, to);
  }
}
