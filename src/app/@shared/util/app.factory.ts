import dayjs from 'dayjs';
import { uuidv4 } from './app.utils';
import { IBaseItem } from '../model/base-item.types';
import { TCategoryId } from '../model/category.types';

export function createBaseItem(
  name: string,
  categories?: TCategoryId | TCategoryId[]
): IBaseItem {
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
