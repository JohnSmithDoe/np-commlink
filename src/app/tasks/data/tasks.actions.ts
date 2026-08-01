import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../@shared/data/item-lists/item-list.actions.factory';
import { ITaskItem, ITasksState } from '../model/task.types';
import { ICategory } from '../../@shared/model/category.types';

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    // Own-data lazy load lifecycle: `load` is dispatched by the route's
    // moduleHydrationResolver on entry; the load effect reads the `tasks` key
    // and emits `loaded`, which the reducer hydrates on.
    load: emptyProps(),
    loaded: (tasks: ITasksState | null) => ({ tasks }),

    ...createItemListActionEvents<ITaskItem>(),
  },
});

/**
 * The catalog's own list surface. A catalog is a list, so it gets the same events
 * every list has rather than a bespoke add/remove/rename trio — which is what
 * lets the shared list page and the shared edit dialog drive it.
 *
 * A separate group, not more events on `TasksActions`, because the two lists have
 * separate view state: a search term typed on the catalog page must not clear the
 * task list's, and one `updateSearch` for both cannot express that.
 */
export const TaskCategoriesActions = createActionGroup({
  source: 'TaskCategories',
  events: createItemListActionEvents<ICategory>(),
});
