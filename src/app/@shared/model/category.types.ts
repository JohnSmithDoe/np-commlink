import { BaseItem } from './base-item.types';
import { ItemList } from './item-list.types';

export type CategoryId = string;

export interface Category extends BaseItem {}

export type CategoryList = ItemList<Category>;
