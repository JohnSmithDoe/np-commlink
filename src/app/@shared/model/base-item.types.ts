import { Timestamp } from './app.types';
import { CategoryId } from './category.types';

export type BaseItem = {
  id: string;
  name: string;
  createdAt?: Timestamp;
  categoryIds?: CategoryId[];
};

export type UpdateDTO<T extends BaseItem> = BaseItem & Partial<T>;

export type EditItemMode = 'update' | 'create';
