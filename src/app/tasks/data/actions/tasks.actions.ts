import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/actions/item-list.actions.factory';
import { ITaskItem, ITasksState } from '../../model/task.types';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    // Own-data lazy load lifecycle: `load` is dispatched by the route's
    // moduleHydrationResolver on entry; the load effect reads the `tasks` key
    // and emits `loaded`, which the reducer hydrates on.
    load: emptyProps(),
    loaded: (tasks: ITasksState | null) => ({ tasks }),

    ...createItemListActionEvents<ITaskItem>(),

    // Categories are {id,name} objects: Add carries a pre-minted one (the picker
    // mints the id the item will reference); Remove/Rename key by id.
    addCategory: (category: ICategory) => ({ category }),
    removeCategory: (id: TCategoryId) => ({ id }),
    updateCategory: (id: TCategoryId, name: string) => ({ id, name }),
  },
});
