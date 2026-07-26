import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BaseCategoryEditItemDialog } from '../../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { ITaskItem, TASKS_LIST_ID } from '../../model/task.types';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { TasksListPageFacade } from '../../data';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

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
  protected readonly listId = TASKS_LIST_ID;
  readonly categories = this.#facade.taskCategories;
  readonly listItems = this.#facade.items;

  protected save(item: ITaskItem): void {
    this.#facade.saveItem(item);
  }
  protected addCategoryToCatalog(category: ICategory): void {
    this.#facade.addCategory(category);
  }
  protected removeCategoryFromCatalog(categoryId: TCategoryId): void {
    this.#facade.deleteCategory(categoryId);
  }
  protected renameCategoryInCatalog(id: TCategoryId, to: string): void {
    this.#facade.renameCategory(id, to);
  }

  updatePrio(value: number) {
    this.patch({ prio: value });
  }

  updateDueAt(value?: string) {
    this.patch({ dueAt: value });
  }
}
