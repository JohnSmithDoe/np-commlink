import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import { tasksReducer } from './tasks.reducer';
import {
  taskCategoriesListEffects,
  tasksListEffects,
} from './tasks-list.effects';
import {
  TASKS_STATE_KEY,
  selectOpenTaskCount,
  selectTasksState,
} from './tasks.selector';

/**
 * The `tasks` bounded context, registered on the `tasks` route.
 *
 * `tasks` is self-contained — it shares no data with the grocery cluster and
 * its selectors read only `state.tasks` — so it registers on its own and needs
 * no co-registration.
 *
 * `tasksListEffects` is tasks' own item flow, built from the shared single-list
 * builders. Because they are builders rather than one shared class, tasks gets
 * its own effect identities — a grocery↔tasks transition cannot double-dispatch.
 */
export const tasksContext = providePersistedContext({
  key: TASKS_STATE_KEY,
  reducer: tasksReducer,
  lifecycle: TasksActions,
  select: selectTasksState,
  // Both lists live in this one doc, so a catalog edit persists on the catalog's
  // own actions rather than on a category event the task list used to carry.
  save: {
    on: [
      TasksActions.addItem,
      TasksActions.removeItem,
      TasksActions.updateItem,
      TasksActions.updateSort,
      TaskCategoriesActions.addItem,
      TaskCategoriesActions.removeItem,
      TaskCategoriesActions.updateItem,
      TaskCategoriesActions.updateSort,
    ],
  },
  telemetry: [
    {
      source: 'tasks',
      select: selectOpenTaskCount,
      metrics: createMetric('open'),
    },
  ],
  effects: [tasksListEffects, taskCategoriesListEffects],
});
