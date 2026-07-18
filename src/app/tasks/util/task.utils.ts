import { IBaseItem } from '../../@shared/types';
import { ITaskItem } from '../model';

/**
 * Task item type guard. Moved out of `@shared/util/app.utils` in the tasks
 * phase of the god-file split (DDD review #1) — the shared list engine now
 * reads prio/dueAt structurally, so nothing in `@shared` needs it.
 */
export const isTaskItem = (value?: IBaseItem): value is ITaskItem =>
  !!value && Object.prototype.hasOwnProperty.call(value, 'prio');
