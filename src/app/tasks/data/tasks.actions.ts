import { createActionGroup, emptyProps } from '@ngrx/store';
import { ICategory, TCategoryId } from '../../@shared/model/types';
import { itemListEvents } from '../../@shared/data/item-list/item-list.actions';
import { ITaskItem, ITasksState } from '../model';

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2): `load` is dispatched
    // by the route's moduleHydrationResolver on entry; the load effect reads
    // the `tasks` key and emits `loaded`, which the reducer hydrates on.
    load: emptyProps(),
    loaded: (tasks: ITasksState | null) => ({ tasks }),

    ...itemListEvents<ITaskItem>(),

    // Categories are {id,name} objects: Add carries a pre-minted one (the picker
    // mints the id the item will reference); Remove/Rename key by id.
    'Add Category': (category: ICategory) => ({ category }),
    'Remove Category': (id: TCategoryId) => ({ id }),
    'Update Category': (id: TCategoryId, name: string) => ({ id, name }),
  },
});
