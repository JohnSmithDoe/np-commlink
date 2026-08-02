import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseCategoryEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { TaskItem, TASKS_LIST_ID } from '../../model/task.types';
import { createTaskItem } from '../../util/task.factory';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { TasksListPageFacade } from '../../data';
import { Category, CategoryId } from '../../../@shared/model/category.types';

@Component({
  selector: 'app-edit-task-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    CategoryInputComponent,
    CategoriesDialogComponent,
    ItemEditModalComponent,
    DateInputComponent,
    NumberInputComponent,
  ],
  templateUrl: './edit-task-item-dialog.component.html',
})
export class EditTaskItemDialogComponent extends BaseCategoryEditItemDialog<TaskItem> {
  protected blank(): TaskItem {
    return createTaskItem('');
  }

  readonly #facade = inject(TasksListPageFacade);
  protected readonly listId = TASKS_LIST_ID;
  readonly categories = this.#facade.catalog;
  readonly siblings = this.#facade.allItems;

  protected save(item: TaskItem): void {
    this.#facade.saveItem(item);
  }
  protected addCategoryToCatalog(category: Category): void {
    this.#facade.addCategory(category);
  }
  protected removeCategoryFromCatalog(categoryId: CategoryId): void {
    this.#facade.removeCategory(categoryId);
  }
  protected renameCategoryInCatalog(id: CategoryId, to: string): void {
    this.#facade.renameCategory(id, to);
  }

  updatePrio(value: number) {
    this.patch({ prio: value });
  }

  updateDueAt(value: string | null) {
    this.patch({ dueAt: value ?? undefined });
  }
}
