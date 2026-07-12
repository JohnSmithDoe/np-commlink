import dayjs from 'dayjs';
import { IBaseItem, ITrackingItem } from '../types';
import { uuidv4 } from './app.utils';

export function createBaseItem(
  name: string,
  category?: string | string[]
): IBaseItem {
  return {
    id: uuidv4(),
    name: name.trim(),
    category: category
      ? Array.isArray(category)
        ? category
        : [category.trim()]
      : undefined,
    createdAt: dayjs().format(),
  };
}

export function createTrackingItem(name: string): ITrackingItem {
  const base = createBaseItem(name);
  return { ...base, state: 'stopped' };
}
