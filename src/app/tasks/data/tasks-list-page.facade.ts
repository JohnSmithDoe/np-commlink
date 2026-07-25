import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  ICategory,
  TCategoryId,
  TItemListMode,
  TItemListSortType,
} from '../../@shared/model/types';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ItemDialogHost } from '../../@shared/data/item-dialogs/item-dialog-host';
import { ITaskItem } from '../model';
import { createTaskItem } from '../util/task.factory';
import { IListPageFacade } from '../../@shared/util/list/list-page.facade';
import {
  listCategoriesWithCount,
  listStateFilter,
} from '../../@shared/util/list/list.selector';
import { TasksActions } from './tasks.actions';
import {
  selectTasksCategories,
  selectTasksListItems,
  selectTasksListSearchResult,
  selectTasksState,
} from './tasks.selector';

/**
 * {@link IListPageFacade} implementation for the single `_tasks` list. It reads
 * the tasks slice through the tasks-domain selectors and dispatches only
 * `TasksActions` — never the grocery multi-list engine. This is what seals
 * `tasks` off the grocery domain: the generic `ListPageComponent` drives it
 * entirely through this contract.
 *
 * The dispatch bodies mirror what the shell GroceryListEffects orchestrator
 * resolved for `_tasks` (via `actionsByListId`), so behaviour is preserved: e.g.
 * "add from search" in categories mode adds a category, otherwise an item.
 */
@Injectable({ providedIn: 'root' })
export class TasksListPageFacade implements IListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogHost);

  readonly state = this.#store.selectSignal(selectTasksState);
  readonly items = this.#store.selectSignal(selectTasksListItems);
  readonly searchResult = this.#store.selectSignal(selectTasksListSearchResult);
  readonly filter = computed(() => listStateFilter(this.state()));
  readonly categories = computed(() => listCategoriesWithCount(this.state()));

  // Edit-dialog read (the tasks edit-dialog wrapper): the raw {id,name} catalog
  // for the category picker. The open item rides the ItemDialogHost command.
  readonly taskCategories = this.#store.selectSignal(selectTasksCategories);

  search(term?: string): void {
    this.#store.dispatch(TasksActions.updateSearch(term));
  }

  addItemFromSearch(): void {
    // Mirror GroceryListEffects.addItemFromSearch: in categories mode the
    // "add from search" affordance creates a category instead of an item.
    if (this.state()?.mode === 'categories') {
      this.addCategoryFromSearch();
    } else {
      this.#store.dispatch(TasksActions.addItemFromSearch());
    }
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
      listId: '_tasks',
      editMode: 'create',
    });
  }

  saveCategory(name: string): void {
    this.addCategory({ id: uuidv4(), name });
  }

  manageCategories(): void {
    void this.#router.navigate(['/categories/_tasks']);
  }

  // ── Tasks-page commands (beyond the shared list contract) ────────────────
  enterPage(): void {
    this.#store.dispatch(TasksActions.enterPage());
  }

  removeItem(item: ITaskItem): void {
    this.#store.dispatch(TasksActions.removeItem(item));
  }

  showEditDialog(item: ITaskItem): void {
    this.#dialogs.open({ item, listId: '_tasks', editMode: 'update' });
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
