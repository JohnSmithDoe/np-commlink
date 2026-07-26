import {
  IProduct,
  IShoppingItem,
  IStorageItem,
} from '../model/grocery-list.types';
import { IBaseItem } from '../../@shared/model/base-item.types';

// Grocery item type guards (moved out of `@shared/util/app.utils` in the DDD
// god-file split). They narrow a base/unknown item to a concrete grocery type
// by structural property presence.

export const isProductItem = (value: IBaseItem): value is IProduct =>
  Object.hasOwn(value, 'unit');

export const isStorageItem = (value?: IBaseItem): value is IStorageItem =>
  !!value && Object.hasOwn(value, 'bestBefore');

export const isShoppingItem = (value?: IBaseItem): value is IShoppingItem =>
  !!value && Object.hasOwn(value, 'state');
