import { createActionGroup, emptyProps } from '@ngrx/store';
import { createItemListActionEvents } from '../../@shared/data/item-lists/item-list.actions.factory';
import { TaskItem, TasksState } from '../model/task.types';
import { Category } from '../../@shared/model/category.types';

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    load: emptyProps(),
    loaded: (tasks: TasksState | null) => ({ tasks }),
    restoreCategory: (category: Category, tagged: readonly string[]) => ({
      category,
      tagged,
    }),

    ...createItemListActionEvents<TaskItem>(),
  },
});

export const TaskCategoriesActions = createActionGroup({
  source: 'TaskCategories',
  events: createItemListActionEvents<Category>(),
});
