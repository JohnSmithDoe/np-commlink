/**
 * Public model of the `tasks` bounded context (type:model).
 *
 * The task-owned types, split out of the old `@shared/types` god-file (DDD
 * review #1). What they build on comes from the concern-sliced shared model
 * (`@shared/model/base-item.types`, `/item-list.types`, `/app.types`);
 * everything task-specific lives here.
 *
 * Renames vs kitchen-bot (to avoid colliding with timetracker's own types)
 * were already applied when the types lived in `@shared/types`.
 */
import { TTimestamp } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { ICategoryList } from '../../@shared/model/category.types';
import { IItemList } from '../../@shared/model/item-list.types';

// One constant on both sides of the ItemDialogService handshake (facade stamps
// it, dialog wrapper matches it) so the two cannot drift apart silently.
export const TASKS_LIST_ID = '_tasks';
export const TASK_CATEGORIES_LIST_ID = '_task-categories';

export interface ITaskItem extends IBaseItem {
  dueAt?: TTimestamp;
  prio?: number;
}

// Two lists, not a list with a catalog inside it: the tasks and the catalog they
// reference are both `IItemList`s, so both are driven by the same shared page.
export type TTasksList = IItemList<ITaskItem> & { id: typeof TASKS_LIST_ID };

export type ITasksState = Readonly<{
  list: TTasksList;
  categoryList: ICategoryList;
}>;
