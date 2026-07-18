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
import {
  IBaseItem,
  IItemList,
  TItemListCategory,
  TItemListMode,
  TTimestamp,
} from '../../@shared/types';

export interface ITaskItem extends IBaseItem {
  dueAt?: TTimestamp;
  prio?: number;
}

// Concrete task list narrows `id`/`title` and re-requires categories/mode
// (optional on the shared IItemList base) so task selectors can read them
// without null guards.
export type TTasksList = IItemList<ITaskItem> & {
  id: '_tasks';
  title: 'Tasks Items';
  categories: TItemListCategory[];
  mode: TItemListMode;
};
export type ITasksState = Readonly<TTasksList>;
