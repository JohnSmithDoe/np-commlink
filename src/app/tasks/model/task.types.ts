import { Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { Interval, PeriodUnit } from '../../@shared/model/interval.types';
import { CategoryList } from '../../@shared/model/category.types';
import { ItemList } from '../../@shared/model/item-list.types';

export const TASKS_LIST_ID = '_tasks';
export const TASK_CATEGORIES_LIST_ID = '_task-categories';

export type TaskAnchor = 'due' | 'done';
export type TaskLead =
  { kind: 'days'; days: number } | { kind: 'startOf'; unit: PeriodUnit };

export interface TaskClosing {
  on: Timestamp;
  missed?: true;
}

export interface TaskItem extends BaseItem {
  dueAt?: Timestamp;
  nextDueAt?: Timestamp;
  doneAt?: Timestamp;
  prio?: number;
  interval?: Interval;
  anchor?: TaskAnchor;
  lead?: TaskLead;
  closings?: readonly TaskClosing[];
}

export type TaskWarnShift = 'earlier' | 'normal' | 'later';
export const TASK_WARN_SHIFTS = [
  'earlier',
  'normal',
  'later',
] as const satisfies readonly TaskWarnShift[];

export interface TaskSettings {
  warnShift: TaskWarnShift;
  defaultAnchor: TaskAnchor;
  defaultLead?: TaskLead;
}

export const DEFAULT_TASK_SETTINGS: TaskSettings = {
  warnShift: 'normal',
  defaultAnchor: 'done',
};

export type TasksList = ItemList<TaskItem> & { id: typeof TASKS_LIST_ID };

export type TasksState = Readonly<{
  list: TasksList;
  categoryList: CategoryList;
  settings: TaskSettings;
}>;
