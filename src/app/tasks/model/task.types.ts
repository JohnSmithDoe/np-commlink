/**
 * Public model of the `tasks` bounded context (type:model).
 *
 * The task-owned types, split out of the `@shared/types` god-file
 * (DDD review #1). Shared-kernel types they build on (IBaseItem, IItemList,
 * TItemListCategory, TItemListMode, TTimestamp) are imported from
 * `@shared/types`; everything task-specific lives here and is imported by the
 * tasks domain via `../model` / `../../model` / `../../../model`.
 *
 * Renames vs kitchen-bot (to avoid colliding with timetracker's own types)
 * were already applied when the types lived in `@shared/types`.
 */
import { TTimestamp } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { ICategory } from '../../@shared/model/category.types';
import { IItemList, TItemListMode } from '../../@shared/model/item-list.types';

// One constant on both sides of the ItemDialogService handshake (facade stamps
// it, dialog wrapper matches it) so the two cannot drift apart silently.
export const TASKS_LIST_ID = '_tasks';

export interface ITaskItem extends IBaseItem {
  dueAt?: TTimestamp;
  prio?: number;
}

// Concrete task list narrows `id` and re-requires categories/mode (optional on
// the shared IItemList base) so task selectors can read them without null
// guards.
export type TTasksList = IItemList<ITaskItem> & {
  id: typeof TASKS_LIST_ID;
  categories: ICategory[];
  mode: TItemListMode;
};
export type ITasksState = Readonly<TTasksList>;
