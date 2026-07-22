import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { createTaskItem } from '../util/task.factory';
import { matchesItemExactly } from '../../@shared/util/app.utils';
import { updatedSearchQuery } from '../../@shared/util/list/list.utils';
import { TasksActions } from './tasks.actions';
import { selectTasksState } from './tasks.selector';

marker('grocery.list-header.tasks');

// Tasks' own item-flow orchestration. Copied (switch-free) from the grocery
// multi-list engine and scoped to the single `_tasks` list — tasks is a sealed
// domain, so it dispatches only `TasksActions`, reads only `state.tasks`, and
// depends on nothing in `groceries/`. Registered lazily via `tasksLazyProviders`
// (was the eager shell GroceryListEffects, which no longer knows about tasks).
@Injectable({ providedIn: 'root' })
export class TasksListEffects {
  #store = inject(Store);
  #actions$ = inject(Actions);

  addItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TasksActions.addItemFromSearch),
      withLatestFrom(this.#store.select(selectTasksState), (_, tasks) => tasks),
      map((tasks) => {
        const item = createTaskItem(tasks.searchQuery ?? '', tasks.filterBy);
        const found = matchesItemExactly(item, tasks.items);
        return found
          ? TasksActions.addItemFailure(found)
          : TasksActions.addItem(item);
      })
    );
  });

  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TasksActions.addOrUpdateItem),
      withLatestFrom(this.#store.select(selectTasksState), (action, tasks) => ({
        action,
        tasks,
      })),
      map(({ action, tasks }) =>
        matchesItemExactly(action.item, tasks.items)
          ? TasksActions.updateItem(action.item)
          : TasksActions.addItem(action.item)
      )
    );
  });

  // Leaving categories mode clears any active category filter.
  clearFilter$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TasksActions.updateMode),
      filter(({ mode }) => mode !== 'categories'),
      map(() => TasksActions.updateFilter())
    );
  });

  // After a list-mutating action, reset the search query.
  clearSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        TasksActions.addItem,
        TasksActions.updateFilter,
        TasksActions.updateMode,
        TasksActions.addCategory,
        TasksActions.removeCategory
      ),
      map(() => TasksActions.updateSearch(''))
    );
  });

  // Keep the search query in sync when an item is renamed.
  updateSearchOnItemChange$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TasksActions.updateItem),
      withLatestFrom(this.#store.select(selectTasksState), (action, tasks) => ({
        action,
        tasks,
      })),
      map(({ action, tasks }) =>
        TasksActions.updateSearch(
          updatedSearchQuery(action.item, tasks.searchQuery)
        )
      )
    );
  });

  // NB: tasks has NO quick-add. The grocery quick-add row + slice were moved
  // into the groceries domain (settings re-scope); tasks' vestigial copy of it
  // (an `updateQuickAdd$` effect + a `tasksQuickAddState` helper) was removed —
  // its only affordance ("add the typed search as a task") was already covered
  // by the searchbar's enter key and the empty-state, and it was gated by a
  // grocery feature flag (`showQuickAdd`) that has nothing to do with tasks.
}
