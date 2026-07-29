import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { matchingTxt } from '../../../@shared/util/app.utils';
import { categoriesByIds } from '../../../@shared/util/categories/category.utils';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

/**
 * Dumb single-select category picker shared by the cash edit modals (rule +
 * transaction): the selected-category chip (open/clear) plus the manage-and-pick
 * dialog. Owns the picker's local UI state (the dialog-open flag) and all
 * selection logic — pick, clear, clear-on-delete, and follow-the-survivor on a
 * merging rename — and exposes the chosen id as its form value. It
 * stays store-free (type:ui): the category CRUD is emitted for the parent modal
 * to forward to its `CashFacade`.
 *
 * The selected id is a `FormValueControl`, so a Signal Forms dialog binds
 * `[formField]="form.categoryId"` and the rule that requires one lives in the
 * schema. The model is named `value` because that name *is* the framework
 * contract — `[formField]` writes through it — which is why the field it holds is
 * only readable as `categoryId` from the outside.
 */
@Component({
  selector: 'app-cash-category-picker',
  templateUrl: './cash-category-picker.component.html',
  styleUrls: ['./cash-category-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryInputComponent, CategoriesDialogComponent],
})
export class CashCategoryPickerComponent implements FormValueControl<TCategoryId> {
  readonly categories = input.required<ICategory[]>();
  readonly value = model<TCategoryId>('');

  readonly addNew = output<ICategory>();
  readonly deleted = output<TCategoryId>();
  readonly renamed = output<{ id: TCategoryId; to: string }>();

  readonly dialogOpen = signal(false);
  readonly selectedCategories = computed<ICategory[]>(() =>
    categoriesByIds(this.value() ? [this.value()] : [], this.categories())
  );

  open(): void {
    this.dialogOpen.set(true);
  }

  close(): void {
    this.dialogOpen.set(false);
  }

  pick(selection: TCategoryId[]): void {
    this.value.set(selection[0] ?? '');
    this.dialogOpen.set(false);
  }

  clear(): void {
    this.value.set('');
  }

  onAdd(category: ICategory): void {
    this.addNew.emit(category);
  }

  onDelete(id: TCategoryId): void {
    this.deleted.emit(id);
    if (this.value() === id) this.value.set('');
  }

  onRename({ id, to }: { id: TCategoryId; to: string }): void {
    // A rename onto an existing name merges in the reducer (the id is dropped
    // and its rows remapped to the survivor); follow the survivor so the parent's
    // save() doesn't re-assert the now-orphan id from the local draft.
    const survivor = this.categories().find(
      (c) => c.id !== id && matchingTxt(c.name) === matchingTxt(to)
    );
    this.renamed.emit({ id, to });
    if (survivor && this.value() === id) this.value.set(survivor.id);
  }
}
