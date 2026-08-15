/* ─── why ─────────────────────────────────────────────────────────
 * The `categories` argument is usually the list's active `filterBy`, so a
 * new item lands in the category you are looking at — but that token is not
 * always a category. `list-filter.ts` registers pseudo-filters on the same
 * string, and passing one through writes a category that does not exist,
 * invisible until something tries to name it.
 *
 * The guard sits here rather than at the five callers because it is where
 * they all funnel through, so a sixth gets it free.
 * ───────────────────────────────────────────────────────────────── */

import dayjs from 'dayjs';
import { uuidv4 } from './app.utils';
import { isPseudoFilter } from './item-lists/list-filter';
import { Timestamp } from '../model/app.types';
import { BaseItem } from '../model/base-item.types';
import { Category, CategoryId } from '../model/category.types';

export function createBaseItem(
  name: string,
  categories?: CategoryId | CategoryId[]
): BaseItem & { createdAt: Timestamp } {
  let categoryIds = undefined;
  if (undefined !== categories) {
    const real = (Array.isArray(categories) ? categories : [categories]).filter(
      (id) => !isPseudoFilter(id)
    );
    categoryIds = real.length > 0 ? real : undefined;
  }

  return {
    id: uuidv4(),
    name: name.trim(),
    categoryIds,
    createdAt: dayjs().format(),
  };
}

export function createCategory(name: string): Category {
  return createBaseItem(name);
}
