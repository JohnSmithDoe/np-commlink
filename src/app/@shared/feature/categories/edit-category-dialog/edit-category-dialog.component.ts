import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ICategory } from '../../../model/category.types';
import { CATEGORY_LIST_FACADE } from '../../../util/categories/category-list.facade';
import { createCategory } from '../../../util/app.factory';
import { ItemEditModalComponent } from '../../../ui/base-item/item-edit-modal/item-edit-modal.component';
import { BaseEditItemDialog } from '../../item-lists/edit-item-dialog/base-edit-item-dialog';

/**
 * The catalog's edit dialog — ONE component for every domain, unlike the six
 * per-domain item wrappers, because a category has exactly one editable field and
 * so there is nothing per-domain left in the template.
 *
 * It extends the plain {@link BaseEditItemDialog}, not the category-carrying one:
 * a category has no categories of its own to pick while nesting is deferred, and
 * the inherited `categoryIds` stays unwritten.
 *
 * The name rule comes free from the base — which is what replaces the three
 * hand-rolled duplicate-name checks the manage page, the catalog reducer and the
 * rename-merge each had.
 */
@Component({
  selector: 'app-edit-category-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemEditModalComponent],
  templateUrl: './edit-category-dialog.component.html',
})
export class EditCategoryDialogComponent extends BaseEditItemDialog<ICategory> {
  readonly #facade = inject(CATEGORY_LIST_FACADE);

  // A getter, not a field: which catalog this dialog answers to is the injected
  // domain's business, and the base reads it inside a computed either way.
  protected get listId() {
    return this.#facade.catalogListId;
  }

  // The whole catalog, never the page's filtered view — a search term left in the
  // box would otherwise shrink the sibling set and let a duplicate name save.
  readonly siblings = computed<readonly ICategory[]>(() =>
    this.#facade.categories()
  );

  protected blank(): ICategory {
    return createCategory('');
  }

  protected save(category: ICategory): void {
    this.#facade.saveCategory(category);
  }
}
