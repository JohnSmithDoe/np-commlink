import { TTimestamp } from './app.types';
import { TCategoryId } from './category.types';

export type IBaseItem = {
  id: string;
  name: string;
  createdAt: TTimestamp;
  categoryIds?: TCategoryId[];
};

// `IBaseItem` already requires `id`, so a partial update always carries one.
export type TUpdateDTO<T extends IBaseItem> = IBaseItem & Partial<T>;

export type TEditItemMode = 'update' | 'create';
