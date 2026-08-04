import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { categoryById } from '../../@shared/util/categories/category.utils';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { TaskItem, TASKS_LIST_ID } from '../model/task.types';
import { createTaskItem } from '../util/task.factory';
import { ListPageFacade } from '../../@shared/util/item-lists/list-page.facade';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import {
  selectTaskItems,
  selectTasksCategories,
  selectTasksList,
  selectTasksListItems,
  selectTasksListSearchResult,
} from './tasks.selector';
import { Category, CategoryId } from '../../@shared/model/category.types';
import { ItemListSortType } from '../../@shared/model/item-list.types';

@Injectable({ providedIn: 'root' })
export class TasksListPageFacade implements ListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectTasksList);
  readonly items = this.#store.selectSignal(selectTasksListItems);
  readonly searchResult = this.#store.selectSignal(selectTasksListSearchResult);
  readonly catalog = this.#store.selectSignal(selectTasksCategories);

  readonly allItems = this.#store.selectSignal(selectTaskItems);

  search(term?: string): void {
    this.#store.dispatch(TasksActions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(TasksActions.addItemFromSearch());
  }

  setSortMode(type: ItemListSortType): void {
    this.#store.dispatch(TasksActions.updateSort(type, 'toggle'));
  }

  selectCategory(categoryId?: CategoryId): void {
    this.#store.dispatch(TasksActions.updateFilter(categoryId));
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
    this.#store.dispatch(TaskCategoriesActions.removeItem(category));
  }
}
