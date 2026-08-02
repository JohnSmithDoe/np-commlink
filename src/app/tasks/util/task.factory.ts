import { createBaseItem } from '../../@shared/util/app.factory';
import { TaskItem } from '../model/task.types';

import { CategoryId } from '../../@shared/model/category.types';

export function createTaskItem(
  name: string,
  categoryIds?: CategoryId | CategoryId[],
  prio?: number
): TaskItem {
  const base = createBaseItem(name, categoryIds);
  return { ...base, prio };
}
