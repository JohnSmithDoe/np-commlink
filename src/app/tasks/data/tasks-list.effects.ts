import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IAppState, IQuickAddState, ITasksState } from '../../@shared/types';
import { createTaskItem } from '../../@shared/util/item.factory';
import {
  matchesItemExactly,
  matchesSearchExactly,
  matchingTxtIsNotEmpty,
} from '../../@shared/util/app.utils';
import { updatedSearchQuery } from '../../@shared/util/list/list.utils';
import { QuickAddActions } from '../../@shared/data/quick-add/quick-add.actions';
import { TasksActions } from './tasks.actions';

marker('grocery.list-header.tasks');

// Tasks' own item-flow orchestration. Copied (switch-free) from the grocery
// multi-list engine and scoped to the single `_tasks` list — tasks is a sealed
// domain, so it dispatches only `TasksActions`, reads only `state.tasks`, and
// depends on nothing in `groceries/`. Registered lazily via `tasksLazyProviders`
// (was the eager shell GroceryListEffects, which no longer knows about tasks).
@Injectable({ providedIn: 'root' })
export class TasksListEffects {
  #store = inject(Store<IAppState>);
  #actions$ = inject(Actions);

  addItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TasksActions.addItemFromSearch),
      withLatestFrom(this.#store, (_, state: IAppState) => state),
      map((state) => {
        const item = createTaskItem(
          state.tasks.searchQuery ?? '',
          state.tasks.filterBy
        );
        const found = matchesItemExactly(item, state.tasks.items);
        return found
          ? TasksActions.addItemFailure(found)
          : TasksActions.addItem(item);
      })
    );
  });

  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TasksActions.addOrUpdateItem),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) =>
        matchesItemExactly(action.item, state.tasks.items)
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
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) =>
        TasksActions.updateSearch(
          updatedSearchQuery(action.item, state.tasks.searchQuery)
        )
      )
    );
  });

  // Recompute the quick-add button state whenever the search/mode changes.
  updateQuickAdd$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        TasksActions.updateSearch,
        TasksActions.updateMode,
        TasksActions.enterPage
      ),
      withLatestFrom(this.#store, (_, state: IAppState) => state),
      map((state) =>
        QuickAddActions.updateState(tasksQuickAddState(state.tasks))
      )
    );
  });
}

// Tasks-local quick-add computation (the `_tasks` branch of the grocery engine's
// updateQuickAddState, minus the product concept — tasks never adds products).
export const tasksQuickAddState = (state: ITasksState): IQuickAddState => {
  const searchQuery = state.searchQuery;
  const isCategoryMode = state.mode === 'categories';
  const doShow = matchingTxtIsNotEmpty(searchQuery);
  const exactMatchLocal = !!state.items.find((item) =>
    matchesSearchExactly(item, searchQuery)
  );
  const exactMatchCategory = !!state.categories.find((cat) =>
    matchesSearchExactly(cat, searchQuery)
  );
  return {
    searchQuery,
    canAddLocal: !isCategoryMode && doShow && !exactMatchLocal,
    canAddProduct: false,
    canAddCategory: doShow && isCategoryMode && !exactMatchCategory,
    listName: marker('grocery.list-header.tasks'),
    color: 'primary',
  };
};
