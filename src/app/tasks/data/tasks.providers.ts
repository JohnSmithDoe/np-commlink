import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import { tasksReducer } from './tasks.reducer';
import {
  taskCategoriesListEffects,
  tasksListEffects,
  tasksRouteFilterEffects,
} from './tasks-list.effects';
import {
  TASKS_STATE_KEY,
  selectOpenTaskCount,
  selectTasksState,
} from './tasks.selector';

export const tasksContext = providePersistedContext({
  key: TASKS_STATE_KEY,
  reducer: tasksReducer,
  lifecycle: TasksActions,
  select: selectTasksState,
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
  effects: [
    tasksListEffects,
    taskCategoriesListEffects,
    tasksRouteFilterEffects,
  ],
});
