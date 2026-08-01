import { TTimestamp } from './app.types';
import { TCategoryId } from './category.types';

// `createdAt` is optional because nothing reads it — every factory stamps it,
// but requiring it would make `ICategory extends IBaseItem` a lie about the
// categories already persisted as bare `{id,name}`, and cost a migration hop to
// backfill a field no selector, sort or template consumes.
export type IBaseItem = {
  id: string;
  name: string;
  createdAt?: TTimestamp;
  categoryIds?: TCategoryId[];
};

// `IBaseItem` already requires `id`, so a partial update always carries one.
export type TUpdateDTO<T extends IBaseItem> = IBaseItem & Partial<T>;

export type TEditItemMode = 'update' | 'create';
