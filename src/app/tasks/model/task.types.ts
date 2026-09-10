import { Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { Interval } from '../../@shared/model/interval.types';
import { CategoryList } from '../../@shared/model/category.types';
import { ItemList } from '../../@shared/model/item-list.types';

export const TASKS_LIST_ID = '_tasks';
export const TASK_CATEGORIES_LIST_ID = '_task-categories';

export interface TaskItem extends BaseItem {
  dueAt?: Timestamp;
  doneAt?: Timestamp;
  prio?: number;
  interval?: Interval;
}

export type TasksList = ItemList<TaskItem> & { id: typeof TASKS_LIST_ID };

export type TasksState = Readonly<{
  list: TasksList;
  categoryList: CategoryList;
}>;
