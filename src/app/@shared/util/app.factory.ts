import dayjs from 'dayjs';
import { IBaseItem, TCategoryId } from '../types';
import { uuidv4 } from './app.utils';

export function createBaseItem(
  name: string,
  categoryIds?: TCategoryId | TCategoryId[]
): IBaseItem {
  return {
    id: uuidv4(),
    name: name.trim(),
    categoryIds: categoryIds
      ? Array.isArray(categoryIds)
        ? categoryIds
        : [categoryIds]
      : undefined,
    createdAt: dayjs().format(),
  };
}
