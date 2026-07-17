import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IAppState, IBaseItem } from '../../@shared/types';
import { createTaskItem } from '../../@shared/util/item.factory';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../@shared/data/item-dialogs/item-dialogs.selector';
import { TasksActions } from './tasks.actions';

/**
 * Tasks' edit/category-dialog orchestrator. Copied (switch-free) from the
 * grocery ItemDialogs orchestrator and scoped to the single `_tasks` list: it
 * dispatches only `TasksActions` and reads only `state.tasks`, and has no
 * product flow. Registered lazily via `tasksLazyProviders`.
 *
 * The shared `itemDialogs` slice is domain-blind and its actions are generic,
 * and route injectors/effects are NOT torn down on navigation — so both this
 * and the grocery dialog orchestrator stay registered once both route sets are
 * visited. EVERY effect here therefore guards on the dialog's `listId === '_tasks'`
 * so it ignores grocery dialogs (otherwise it would dispatch TasksActions onto a
 * grocery dialog action — cross-list corruption).
 */
@Injectable({ providedIn: 'root' })
export class TasksItemDialogsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  showCategories$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.showDialog),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      filter(
        ({ state }: { state: IAppState }) =>
          state.itemDialogs.listId === '_tasks'
      ),
      map(({ state }: { state: IAppState }) =>
        CategoriesActions.updateSelection(
          state.itemDialogs.item,
          state.tasks.categories
        )
      )
    );
  });

  confirmCategories$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.confirmChanges),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      filter(
        ({ state }: { state: IAppState }) =>
          state.itemDialogs.listId === '_tasks'
      ),
      map(({ state }: { state: IAppState }) =>
        ItemDialogsActions.updateItem({
          category: state.itemDialogs.category.selection,
        })
      )
    );
  });

  addCategoryFromDialogSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.addCategoryFromDialogSearch),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      filter(
        ({ state }: { state: IAppState }) =>
          state.itemDialogs.listId === '_tasks'
      ),
      map(({ state }: { state: IAppState }) =>
        CategoriesActions.addCategory(
          state.itemDialogs.category.searchQuery?.trim() ?? ''
        )
      )
    );
  });

  addCategoryToList$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.addCategory),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      filter(({ state }) => state.itemDialogs.listId === '_tasks'),
      map(({ action }) => TasksActions.addCategory(action.category))
    );
  });

  confirmItemChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.confirmChanges),
      concatLatestFrom(() => this.#store.select(selectEditState)),
      filter(([, state]) => state.listId === '_tasks'),
      map(([, state]) => TasksActions.addOrUpdateItem(<never>state.item))
    );
  });

  confirmEditCategoryChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.confirmEditChanges),
      concatLatestFrom(() => this.#store.select(selectEditState)),
      filter(([, state]) => state.listId === '_tasks'),
      map(([, state]) =>
        TasksActions.updateCategory(
          state.category.original ?? '',
          state.category.editItem ?? ''
        )
      )
    );
  });

  showCreateDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateDialogWithSearch),
      filter(({ listId }) => listId === '_tasks'),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ state }) => {
        const localState = state.tasks;
        const name = localState.searchQuery ?? '';
        if (localState.mode === 'categories') {
          return CategoriesActions.showEditDialog(name, '_tasks');
        }
        const item: IBaseItem = createTaskItem(name, localState.filterBy);
        return ItemDialogsActions.showEditDialog(item, '_tasks');
      })
    );
  });
}
