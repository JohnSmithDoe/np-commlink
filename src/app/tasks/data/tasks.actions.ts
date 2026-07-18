import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  TItemListCategory,
  TItemListMode,
  TUpdateDTO,
} from '../../@shared/types';
import { ITaskItem, ITasksState } from '../model';

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2): `load` is dispatched
    // by the route's moduleHydrationResolver on entry; the load effect reads
    // the `tasks` key and emits `loaded`, which the reducer hydrates on.
    load: emptyProps(),
    loaded: (tasks: ITasksState | null) => ({ tasks }),

    // Effects only
    'Enter Page': emptyProps(),
    'Add Or Update Item': (item: ITaskItem) => ({ item }),
    'Add Item From Search': emptyProps(),

    // Operations

    'Add Item': (item: ITaskItem) => ({ item }),
    'Add Item Failure': (item: ITaskItem) => ({ item }),
    'Add Category': (category: TItemListCategory) => ({ category }),
    'Remove Category': (category: TItemListCategory) => ({ category }),
    'Update Category': (
      original: TItemListCategory,
      newName: TItemListCategory
    ) => ({ original, newName }),

    'Remove Item': (item: ITaskItem) => ({ item }),
    'Update Item': (item: TUpdateDTO<ITaskItem>) => ({ item }),
    'Update Search': (searchQuery?: string) => ({ searchQuery }),
    'Update Filter': (filterBy?: string) => ({ filterBy }),
    'Update Mode': (mode?: TItemListMode) => ({ mode }),
    'Update Sort': (
      sortBy?: 'name' | 'prio' | 'dueAt' | string,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  },
});
