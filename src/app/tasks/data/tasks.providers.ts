import { providePersistedContext } from '../../@shared/data/persisted-context.provider';
import { createMetric } from '../../@shared/data/effects/persisted-slice.effects.factory';
import { TasksActions } from './actions/tasks.actions';
import { tasksReducer } from './reducer/tasks.reducer';
import { tasksListEffects } from './effects/tasks-list.effects';
import {
  selectOpenTaskCount,
  selectTasksState,
} from './selectors/tasks.selector';

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
  key: 'tasks',
  reducer: tasksReducer,
  lifecycle: TasksActions,
  select: selectTasksState,
  save: {
    on: [
      TasksActions.addItem,
      TasksActions.removeItem,
      TasksActions.updateItem,
      TasksActions.updateSort,
      TasksActions.addCategory,
      TasksActions.removeCategory,
      TasksActions.updateCategory,
    ],
  },
  telemetry: [
    {
      source: 'tasks',
      select: selectOpenTaskCount,
      metrics: createMetric('open'),
    },
  ],
  effects: [tasksListEffects],
});
