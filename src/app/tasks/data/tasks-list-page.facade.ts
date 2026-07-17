import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  TItemListCategory,
  TItemListMode,
  TItemListSortType,
} from '../../@shared/types';
import { ItemDialogsActions } from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { IListPageFacade } from '../../@shared/util/list/list-page.facade';
import {
  listCategoriesWithCount,
  listStateFilter,
} from '../../@shared/util/list/list.selector';
import { TasksActions } from './tasks.actions';
import {
  selectTasksListItems,
  selectTasksListSearchResult,
  selectTasksState,
} from './tasks.selector';

/**
 * {@link IListPageFacade} implementation for the single `_tasks` list. It reads
 * the tasks slice through the tasks-domain selectors and dispatches only
 * `TasksActions` + the shared `ItemDialogsActions` — never the grocery
 * multi-list engine. This is what seals `tasks` off the grocery domain: the
 * generic `ListPageComponent` drives it entirely through this contract.
 *
 * The dispatch bodies mirror what the shell GroceryListEffects orchestrator
 * resolved for `_tasks` (via `actionsByListId`), so behaviour is preserved: e.g.
 * "add from search" in categories mode adds a category, otherwise an item.
 */
@Injectable({ providedIn: 'root' })
export class TasksListPageFacade implements IListPageFacade {
  readonly #store = inject(Store);

  readonly state = this.#store.selectSignal(selectTasksState);
  readonly items = this.#store.selectSignal(selectTasksListItems);
  readonly searchResult = this.#store.selectSignal(selectTasksListSearchResult);
  readonly filter = computed(() => listStateFilter(this.state()));
  readonly categories = computed(() => listCategoriesWithCount(this.state()));

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
      TasksActions.addCategory(this.state()?.searchQuery ?? '')
    );
  }

  setDisplayMode(mode: TItemListMode): void {
    this.#store.dispatch(TasksActions.updateMode(mode));
  }

  setSortMode(type: TItemListSortType): void {
    this.#store.dispatch(TasksActions.updateSort(type, 'toggle'));
  }

  selectCategory(category: TItemListCategory): void {
    this.#store.dispatch(TasksActions.updateFilter(category));
  }

  deleteCategory(category: TItemListCategory): void {
    this.#store.dispatch(TasksActions.removeCategory(category));
  }

  showCreateDialog(): void {
    this.#store.dispatch(
      ItemDialogsActions.showCreateDialogWithSearch('_tasks')
    );
  }
}
