import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ItemDialogService } from '../../@shared/util/item-dialog.service';
import { ITaskItem, TASKS_LIST_ID } from '../model/task.types';
import { createTaskItem } from '../util/task.factory';
import { IListPageFacade } from '../../@shared/util/list/list-page.facade';
import { listCategoriesWithCount } from '../../@shared/util/list/list.selector';
import { TasksActions } from './actions/tasks.actions';
import {
  selectTaskItems,
  selectTasksCategories,
  selectTasksListItems,
  selectTasksListSearchResult,
  selectTasksState,
} from './selectors/tasks.selector';
import { ICategory, TCategoryId } from '../../@shared/model/category.types';
import {
  TItemListMode,
  TItemListSortType,
} from '../../@shared/model/item-list.types';

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

  readonly state = this.#store.selectSignal(selectTasksState);
  readonly items = this.#store.selectSignal(selectTasksListItems);
  readonly searchResult = this.#store.selectSignal(selectTasksListSearchResult);
  readonly categories = computed(() => listCategoriesWithCount(this.state()));

  // Edit-dialog reads (the tasks edit-dialog wrapper): the raw {id,name} catalog
  // for the category picker, and the whole aggregate — NOT `items`, which is this
  // page's filtered view, so the duplicate-name rule would stop seeing a sibling
  // the moment a search term or category filter hid it.
  readonly taskCategories = this.#store.selectSignal(selectTasksCategories);
  readonly allItems = this.#store.selectSignal(selectTaskItems);

  search(term?: string): void {
    this.#store.dispatch(TasksActions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(TasksActions.addItemFromSearch());
  }

  addCategoryFromSearch(): void {
    this.#store.dispatch(
      TasksActions.addCategory({
        id: uuidv4(),
        name: this.state()?.searchQuery ?? '',
      })
    );
  }

  setDisplayMode(mode: TItemListMode): void {
    this.#store.dispatch(TasksActions.updateMode(mode));
  }

  setSortMode(type: TItemListSortType): void {
    this.#store.dispatch(TasksActions.updateSort(type, 'toggle'));
  }

  selectCategory(categoryId: TCategoryId): void {
    this.#store.dispatch(TasksActions.updateFilter(categoryId));
  }

  deleteCategory(categoryId: TCategoryId): void {
    this.#store.dispatch(TasksActions.removeCategory(categoryId));
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

  saveCategory(name: string): void {
    this.addCategory({ id: uuidv4(), name });
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

  // Catalog category commands for the edit dialog's picker. `deleteCategory`
  // (the IListPageFacade method above) already dispatches removeCategory, so the
  // dialog's catalog-delete reuses it.
  addCategory(category: ICategory): void {
    this.#store.dispatch(TasksActions.addCategory(category));
  }

  renameCategory(id: TCategoryId, to: string): void {
    this.#store.dispatch(TasksActions.updateCategory(id, to));
  }
}
