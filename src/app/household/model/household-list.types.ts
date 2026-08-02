import { Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { ItemList, SearchResult } from '../../@shared/model/item-list.types';

export const STORAGE_LIST_ID = '_storage';
export const PRODUCTS_LIST_ID = '_products';
export const SHOPPING_LIST_ID = '_shopping';

const HOUSEHOLD_LIST_IDS = [
  STORAGE_LIST_ID,
  PRODUCTS_LIST_ID,
  SHOPPING_LIST_ID,
] as const;
export type HouseholdListId = (typeof HOUSEHOLD_LIST_IDS)[number];
export const isHouseholdListId = (value?: string): value is HouseholdListId =>
  HOUSEHOLD_LIST_IDS.includes(value as HouseholdListId);

export type ItemUnit = 'ml' | 'g' | 'pieces';
type PackagingUnit = 'bottle' | 'package' | 'loose' | 'tin-can';
export type BestBeforeTimespan =
  'forever' | 'days' | 'weeks' | 'months' | 'years';

export interface Product extends BaseItem {
  unit: ItemUnit;
  packaging: PackagingUnit;
  packagingWeight?: number;
  bestBeforeTimespan: BestBeforeTimespan;
  bestBeforeTimevalue?: number;
  alwaysOnHand?: boolean;
}

export type ProductLinked = {
  productId?: string;
};

export type ShoppingItem = BaseItem &
  ProductLinked & {
    quantity: number;
    state: 'bought' | 'active';
  };

export type StorageItem = BaseItem &
  ProductLinked & {
    quantity: number;
    minAmount?: number;
    bestBefore?: Timestamp;
  };

export const HOUSEHOLD_CATEGORIES_LIST_ID = '_household-categories';

type StorageList = ItemList<StorageItem> & { id: '_storage' };
type ProductsList = ItemList<Product> & { id: '_products' };
type ShoppingList = ItemList<ShoppingItem> & { id: '_shopping' };

export type StorageState = Readonly<StorageList>;
export type ShoppingState = Readonly<ShoppingList> & {
  showActionSheet: boolean;
};
export type ProductsState = Readonly<ProductsList>;

export interface HouseholdSearchResult<
  T extends BaseItem,
> extends SearchResult<T> {
  products?: Product[];
  storageItems?: StorageItem[];
  shoppingItems?: ShoppingItem[];
}
