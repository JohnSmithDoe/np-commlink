import { createBaseItem } from '../../@shared/util/app.factory';
import { ITaskItem } from '../model';

/**
 * Production factory for the `tasks` item type. Moved out of
 * `@shared/util/item.factory` in the tasks phase of the god-file split
 * (DDD review #1); reuses the shared-kernel `createBaseItem` seed.
 */
export function createTaskItem(
  name: string,
  category?: string | string[],
  prio?: number
): ITaskItem {
  const base = createBaseItem(name, category);
  return { ...base, prio };
}
