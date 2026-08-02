import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Category } from '../../../model/category.types';
import { CATEGORY_LIST_FACADE } from '../../../util/categories/category-list.facade';
import { createCategory } from '../../../util/app.factory';
import { ItemEditModalComponent } from '../../../ui/base-item/item-edit-modal/item-edit-modal.component';
import { BaseEditItemDialog } from '../../item-lists/edit-item-dialog/base-edit-item-dialog';

@Component({
  selector: 'app-edit-category-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemEditModalComponent],
  templateUrl: './edit-category-dialog.component.html',
})
export class EditCategoryDialogComponent extends BaseEditItemDialog<Category> {
  readonly #facade = inject(CATEGORY_LIST_FACADE);

  protected get listId() {
    return this.#facade.catalogListId;
  }

  readonly siblings = computed<readonly Category[]>(() =>
    this.#facade.categories()
  );

  protected blank(): Category {
    return createCategory('');
  }

  protected save(category: Category): void {
    this.#facade.saveCategory(category);
  }
}
