import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IBaseItem } from '../../@shared/types';
import { createTaskItem } from '../util/task.factory';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../@shared/data/item-dialogs/item-dialogs.selector';
import { TasksActions } from './tasks.actions';
import { selectTasksState } from './tasks.selector';

/**
 * Tasks' dialog OPEN-command producer + category-rename bridge (switch-free
 * copy of the grocery orchestrator, scoped to `_tasks`). Since the dialog
 * refactor the item draft + category selection are owned by
 * `edit-task-item-dialog` / the pure-ui categories-dialog, so this only opens
 * the create dialog (or the rename dialog in categories mode) and forwards a
 * confirmed rename to `TasksActions`. Both effects guard on `listId === '_tasks'`
 * so they ignore grocery dialogs (shared actions, non-torn-down injectors).
 */
@Injectable({ providedIn: 'root' })
export class TasksItemDialogsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

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
      withLatestFrom(this.#store.select(selectTasksState), (action, tasks) => ({
        action,
        tasks,
      })),
      map(({ tasks }) => {
        const name = tasks.searchQuery ?? '';
        if (tasks.mode === 'categories') {
          return CategoriesActions.showEditDialog(name, '_tasks');
        }
        const item: IBaseItem = createTaskItem(name, tasks.filterBy);
        return ItemDialogsActions.showEditDialog(item, '_tasks');
      })
    );
  });
}
