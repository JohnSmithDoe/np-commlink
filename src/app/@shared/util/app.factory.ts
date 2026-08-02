import dayjs from 'dayjs';
import { uuidv4 } from './app.utils';
import { BaseItem } from '../model/base-item.types';
import { Category, CategoryId } from '../model/category.types';

export function createBaseItem(
  name: string,
  categories?: CategoryId | CategoryId[]
): BaseItem {
  let categoryIds = undefined;
  if (undefined !== categories) {
    categoryIds = Array.isArray(categories) ? categories : [categories];
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
