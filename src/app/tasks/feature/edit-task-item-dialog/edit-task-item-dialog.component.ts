import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Action } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ICategory, TCategoryId } from '../../../@shared/types';
import { BaseCategoryEditItemDialog } from '../../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { ITaskItem } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import {
  selectEditTaskItem,
  selectTasksCategories,
  selectTasksListItems,
  TasksActions,
} from '../../data';

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
  protected readonly listId = '_tasks' as const;
  readonly seedItem = this.store.selectSignal(selectEditTaskItem);
  readonly categories = this.store.selectSignal(selectTasksCategories);
  readonly listItems = this.store.selectSignal(selectTasksListItems);

  protected save(item: ITaskItem): Action {
    return TasksActions.addOrUpdateItem(item);
  }
  protected addCategoryAction(category: ICategory): Action {
    return TasksActions.addCategory(category);
  }
  protected removeCategoryAction(categoryId: TCategoryId): Action {
    return TasksActions.removeCategory(categoryId);
  }
  protected renameCategoryAction(id: TCategoryId, to: string): Action {
    return TasksActions.updateCategory(id, to);
  }

  updatePrio(value: number) {
    this.patch({ prio: value });
  }

  updateDueAt(value?: string) {
    this.patch({ dueAt: value });
  }
}
