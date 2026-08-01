import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { categoryById } from '../../@shared/util/categories/category.utils';
import { ItemDialogService } from '../../@shared/util/item-lists/item-dialog.service';
import { ITaskItem, TASKS_LIST_ID } from '../model/task.types';
import { createTaskItem } from '../util/task.factory';
import { IListPageFacade } from '../../@shared/util/item-lists/list-page.facade';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import {
  selectTaskItems,
  selectTasksCategories,
  selectTasksList,
  selectTasksListItems,
  selectTasksListSearchResult,
} from './tasks.selector';
import { ICategory, TCategoryId } from '../../@shared/model/category.types';
import { TItemListSortType } from '../../@shared/model/item-list.types';

/**
 * {@link IListPageFacade} implementation for the single `_tasks` list. It reads
 * the tasks slice through the tasks-domain selectors and dispatches only
 * `TasksActions` — never the grocery multi-list engine. This is what seals
 * `tasks` off the grocery domain: the generic `ListPageComponent` drives it
 * entirely through this contract.
 */
@Injectable({ providedIn: 'root' })
export class TasksListPageFacade implements IListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectTasksList);
  readonly items = this.#store.selectSignal(selectTasksListItems);
  readonly searchResult = this.#store.selectSignal(selectTasksListSearchResult);
  readonly catalog = this.#store.selectSignal(selectTasksCategories);

  // The edit dialog's sibling set is the whole aggregate — NOT `items`, which is
  // this page's filtered view, so the duplicate-name rule would stop seeing a
  // sibling the moment a search term or category filter hid it.
  readonly allItems = this.#store.selectSignal(selectTaskItems);

  search(term?: string): void {
    this.#store.dispatch(TasksActions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(TasksActions.addItemFromSearch());
  }

  setSortMode(type: TItemListSortType): void {
    this.#store.dispatch(TasksActions.updateSort(type, 'toggle'));
  }

  selectCategory(categoryId: TCategoryId): void {
    this.#store.dispatch(TasksActions.updateFilter(categoryId));
  }

  // Create seeded from the searchbar. (The categories-mode variant is the shell's
  // own `saveCategory` path — it never reaches here.)
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

  // ── Tasks-page commands (beyond the shared list contract) ────────────────
  removeItem(item: ITaskItem): void {
    this.#store.dispatch(TasksActions.removeItem(item));
  }

  showEditDialog(item: ITaskItem): void {
    this.#dialogs.open({ item, listId: TASKS_LIST_ID, editMode: 'update' });
  }

  saveItem(item: ITaskItem): void {
    this.#store.dispatch(TasksActions.addOrUpdateItem(item));
  }

  // Catalog commands for the edit dialog's picker, dispatched onto the CATALOG
  // list — the picker edits the same list the catalog page does.
  addCategory(category: ICategory): void {
    this.#store.dispatch(TaskCategoriesActions.addItem(category));
  }

  // A rename is a partial update, which `TUpdateDTO` is exactly.
  renameCategory(id: TCategoryId, to: string): void {
    this.#store.dispatch(TaskCategoriesActions.updateItem({ id, name: to }));
  }

  removeCategory(id: TCategoryId): void {
    const category = categoryById(this.catalog(), id);
    if (!category) return;
    this.#store.dispatch(TaskCategoriesActions.removeItem(category));
  }
}
