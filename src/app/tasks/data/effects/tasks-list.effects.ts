import { inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import {
  clearFilterWhenLeavingCategories,
  clearSearchAfter,
  createItemListEffects,
} from '../../../@shared/data/effects/item-list.effects.factory';
import { createTaskItem } from '../../util/task.factory';
import { TasksActions } from '../actions/tasks.actions';
import { selectTasksState } from '../selectors/tasks.selector';

/**
 * Tasks' item flow, composed from the shared single-list builders. Reads only
 * `state.tasks` and dispatches only `TasksActions`, which is what seals the
 * domain off the grocery engine — it depends on nothing in `groceries/`.
 *
 * NB: tasks has NO quick-add. The grocery quick-add row + slice moved into the
 * groceries domain in the settings re-scope, and tasks' vestigial copy was
 * removed: its only affordance ("add the typed search as a task") is already
 * covered by the searchbar's enter key and the empty state, and it was gated by
 * a grocery feature flag that has nothing to do with tasks.
 */
export const tasksListEffects = {
  ...createItemListEffects({
    actions: TasksActions,
    select: selectTasksState,
    create: (name, filterBy) => createTaskItem(name, filterBy),
  }),

  clearSearch$: clearSearchAfter(TasksActions.updateSearch, [
    TasksActions.addItem,
    TasksActions.updateFilter,
    TasksActions.updateMode,
    TasksActions.addCategory,
    TasksActions.removeCategory,
  ]),

  clearFilter$: clearFilterWhenLeavingCategories(TasksActions),

  addItemFailure$: createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(TasksActions.addItemFailure),
        map(({ item }) =>
          NotificationsActions.toast({
            key: marker('toast.add.item.failure'),
            params: { name: item.name },
            color: 'medium',
          })
        )
      );
    },
    { functional: true }
  ),
};
