/* ─── why ─────────────────────────────────────────────────────────
 * Smart, not dumb: the catalog it offers and the catalog it edits are one,
 * and both mounting dialogs wanted that. Dumb, it took `categories` in and
 * pushed three outputs out, so each dialog re-declared the same
 * pass-through and the same three delegates — plumbing with one
 * destination.
 *
 * `onRename` must stay here: a colliding rename MERGES, and the value this
 * control holds has to follow the survivor. The facade cannot do that — it
 * does not know which control is picking.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { matchingTxt } from '../../../@shared/util/app.utils';
import { categoriesByIds } from '../../../@shared/util/categories/category.utils';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { Category, CategoryId } from '../../../@shared/model/category.types';
import { CashCategoriesFacade } from '../../data';

@Component({
  selector: 'app-cash-category-picker',
  templateUrl: './cash-category-picker.component.html',
  styleUrls: ['./cash-category-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryInputComponent, CategoriesDialogComponent],
})
export class CashCategoryPickerComponent implements FormValueControl<CategoryId> {
  readonly #categories = inject(CashCategoriesFacade);

  readonly categories = this.#categories.allItems;
  readonly value = model<CategoryId>('');

  readonly dialogOpen = signal(false);
  readonly selectedCategories = computed<Category[]>(() =>
    categoriesByIds(this.value() ? [this.value()] : [], this.categories())
  );

  open(): void {
    this.dialogOpen.set(true);
  }

  close(): void {
    this.dialogOpen.set(false);
  }

  pick(selection: CategoryId[]): void {
    this.value.set(selection[0] ?? '');
    this.dialogOpen.set(false);
  }

  clear(): void {
    this.value.set('');
  }

  onAdd(category: Category): void {
    this.#categories.addCategory(category);
  }

  onDelete(id: CategoryId): void {
    this.#categories.removeCategoryById(id);
    if (this.value() === id) this.value.set('');
  }

  onRename({ id, to }: { id: CategoryId; to: string }): void {
    const survivor = this.categories().find(
      (c) => c.id !== id && matchingTxt(c.name) === matchingTxt(to)
    );
    this.#categories.renameCategory(id, to);
    if (survivor && this.value() === id) this.value.set(survivor.id);
  }
}
