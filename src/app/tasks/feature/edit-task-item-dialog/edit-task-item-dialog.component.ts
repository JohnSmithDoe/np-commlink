import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICategory, TCategoryId } from '../../../@shared/model/types';
import { BaseCategoryEditItemDialog } from '../../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { ITaskItem } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { TasksListPageFacade } from '../../data';

/**
 * Task edit-dialog wrapper (type:feature) in the sealed `tasks` domain. Supplies
 * the tasks list's selectors + save/category actions to the shared
 * `BaseCategoryEditItemDialog` and adds the task-specific fields (prio + due
 * date).
 */
@Component({
  selector: 'app-edit-task-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    CategoryInputComponent,
    CategoriesDialogComponent,
    ItemEditModalComponent,
    DateInputComponent,
    NumberInputComponent,
  ],
  templateUrl: './edit-task-item-dialog.component.html',
  styleUrl: './edit-task-item-dialog.component.scss',
})
export class EditTaskItemDialogComponent extends BaseCategoryEditItemDialog<ITaskItem> {
  readonly #facade = inject(TasksListPageFacade);
  protected readonly listId = '_tasks' as const;
  readonly categories = this.#facade.taskCategories;
  readonly listItems = this.#facade.items;

  protected save(item: ITaskItem): void {
    this.#facade.saveItem(item);
  }
  protected addCategoryCmd(category: ICategory): void {
    this.#facade.addCategory(category);
  }
  protected removeCategoryCmd(categoryId: TCategoryId): void {
    this.#facade.deleteCategory(categoryId);
  }
  protected renameCategoryCmd(id: TCategoryId, to: string): void {
    this.#facade.renameCategory(id, to);
  }

  updatePrio(value: number) {
    this.patch({ prio: value });
  }

  updateDueAt(value?: string) {
    this.patch({ dueAt: value });
  }
}
