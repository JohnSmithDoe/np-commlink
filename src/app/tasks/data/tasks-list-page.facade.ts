import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { categoryById } from '../../@shared/util/categories/category.utils';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import {
  TaskItem,
  TASK_CATEGORIES_LIST_ID,
  TASKS_LIST_ID,
} from '../model/task.types';
import { createTaskItem } from '../util/task.factory';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../@shared/data/item-lists/list-page.facade.base';
import { UndoActions } from '../../@shared/data/undo/undo.actions';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import {
  selectDoneTasks,
  selectOpenTasks,
  selectTaskItems,
  selectTaskTaggedByCategory,
  selectTasksCategories,
  selectTasksList,
  selectTasksListItems,
  selectTasksListSearchResult,
} from './tasks.selector';
import { Category, CategoryId } from '../../@shared/model/category.types';
import { ItemListSortOption } from '../../@shared/model/item-list.types';
import { ListSection } from '../../@shared/util/item-lists/list-page.facade';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'prio', labelKey: marker('tasks.list-toolbar.prio') },
  { type: 'dueAt', labelKey: marker('tasks.list-toolbar.due') },
];

const OPEN_SECTION = 'open';
const DONE_SECTION = 'done';

@Injectable({ providedIn: 'root' })
export class TasksListPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);

  protected readonly commands = itemListCommands(this.#store, TasksActions);

  readonly state = this.#store.selectSignal(selectTasksList);
  readonly undoScope = signal(TASKS_LIST_ID);

  readonly #taggedWith = this.#store.selectSignal(selectTaskTaggedByCategory);
  readonly items = this.#store.selectSignal(selectTasksListItems);
  readonly searchResult = this.#store.selectSignal(selectTasksListSearchResult);
  readonly catalog = this.#store.selectSignal(selectTasksCategories);
  readonly sortOptions = signal(SORT_OPTIONS);

  readonly allItems = this.#store.selectSignal(selectTaskItems);

  readonly #open = this.#store.selectSignal(selectOpenTasks);
  readonly #done = this.#store.selectSignal(selectDoneTasks);

  readonly sections = computed<readonly ListSection[]>(() => {
    const open = this.#open();
    const done = this.#done();
    if (open.length + done.length === 0) return [];
    return [
      { id: OPEN_SECTION, labelKey: marker('tasks.section.open'), items: open },
      { id: DONE_SECTION, labelKey: marker('tasks.section.done'), items: done },
    ];
  });

  toggleDone(item: TaskItem): void {
    this.#store.dispatch(
      UndoActions.pushed({
        scope: TASKS_LIST_ID,
        name: item.name,
        action: TasksActions.addOrUpdateItem(item),
        toastKey: item.doneAt
          ? marker('tasks.toast.reopened')
          : marker('tasks.toast.done'),
      })
    );
    this.#store.dispatch(
      TasksActions.addOrUpdateItem({
        ...item,
        doneAt: item.doneAt ? undefined : new Date().toISOString(),
      })
    );
  }

  showCreateDialog(): void {
    const state = this.state();
    this.#dialogs.open({
      item: createTaskItem(state?.searchQuery ?? '', state?.filterBy),
      listId: TASKS_LIST_ID,
      editMode: 'create',
    });
  }

  manageCategories(): void {
    void this.#router.navigate(['/tasks/categories']);
  }

  removeItem(item: TaskItem): void {
    this.#store.dispatch(TasksActions.removeItem(item));
  }

  showEditDialog(item: TaskItem): void {
    this.#dialogs.open({ item, listId: TASKS_LIST_ID, editMode: 'update' });
  }

  saveItem(item: TaskItem): void {
    this.#store.dispatch(TasksActions.addOrUpdateItem(item));
  }

  addCategory(category: Category): void {
    this.#store.dispatch(TaskCategoriesActions.addItem(category));
  }

  renameCategory(id: CategoryId, to: string): void {
    this.#store.dispatch(TaskCategoriesActions.updateItem({ id, name: to }));
  }

  removeCategory(id: CategoryId): void {
    const category = categoryById(this.catalog(), id);
    if (!category) return;
    this.#store.dispatch(
      UndoActions.pushed({
        scope: TASK_CATEGORIES_LIST_ID,
        name: category.name,
        action: TasksActions.restoreCategory(category, this.#taggedWith()(id)),
      })
    );
    this.#store.dispatch(TaskCategoriesActions.removeItem(category));
  }
}
