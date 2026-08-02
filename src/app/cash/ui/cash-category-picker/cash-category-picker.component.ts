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
import { Category, CategoryId } from '../../../@shared/model/category.types';

@Component({
  selector: 'app-cash-category-picker',
  templateUrl: './cash-category-picker.component.html',
  styleUrls: ['./cash-category-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryInputComponent, CategoriesDialogComponent],
})
export class CashCategoryPickerComponent implements FormValueControl<CategoryId> {
  readonly categories = input.required<Category[]>();
  readonly value = model<CategoryId>('');

  readonly addNew = output<Category>();
  readonly deleted = output<CategoryId>();
  readonly renamed = output<{ id: CategoryId; to: string }>();

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
    this.addNew.emit(category);
  }

  onDelete(id: CategoryId): void {
    this.deleted.emit(id);
    if (this.value() === id) this.value.set('');
  }

  onRename({ id, to }: { id: CategoryId; to: string }): void {
    const survivor = this.categories().find(
      (c) => c.id !== id && matchingTxt(c.name) === matchingTxt(to)
    );
    this.renamed.emit({ id, to });
    if (survivor && this.value() === id) this.value.set(survivor.id);
  }
}
