import { TTimestamp } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { IItemList, ISearchResult } from '../../@shared/model/item-list.types';

// The three shopper-facing lists: the product catalog, the shopping list and the
// pantry. They share the shared `IItemList` engine but each narrows its identity,
// and the search buckets below are what makes them cross-readable.

const GROCERY_LIST_IDS = ['_storage', '_products', '_shopping'] as const;
export type TGroceryListId = (typeof GROCERY_LIST_IDS)[number];
export const isGroceryListId = (value?: string): value is TGroceryListId =>
  GROCERY_LIST_IDS.includes(value as TGroceryListId);

export type TItemUnit = 'ml' | 'g' | 'pieces';
type TPackagingUnit = 'bottle' | 'package' | 'loose' | 'tin-can';
export type TBestBeforeTimespan =
  'forever' | 'days' | 'weeks' | 'months' | 'years';

export interface IProduct extends IBaseItem {
  unit: TItemUnit;
  packaging: TPackagingUnit;
  packagingWeight?: number;
  bestBeforeTimespan: TBestBeforeTimespan;
  bestBeforeTimevalue?: number;
  // Pantry staples (salt, oil, water) are never kept in storage the way milk is,
  // so the recipe matcher must not count them as missing. Optional because
  // products persisted before the recipe book don't carry it — which is what
  // keeps the feature migration-free.
  alwaysOnHand?: boolean;
}

/**
 * The catalog reference a row copied from a product carries.
 *
 * Optional because it can be absent two honest ways — a row typed straight into
 * the list was never a product, and rows persisted before this field existed
 * have none — which is what keeps it migration-free. A reader must therefore
 * treat it as a *better* answer than the name, not the only one: the recipe
 * matcher tries the id first and falls back to the name (`recipe-match.utils`).
 *
 * Why it exists at all: the copy factories used to take `product.name` and drop
 * the id, so renaming a product silently broke "do I have it" until the storage
 * row was renamed to match.
 */
export type TProductLinked = {
  productId?: string;
};

export type IShoppingItem = IBaseItem &
  TProductLinked & {
    quantity: number;
    state: 'bought' | 'active';
  };

export type IStorageItem = IBaseItem &
  TProductLinked & {
    quantity: number;
    minAmount?: number;
    bestBefore?: TTimestamp;
  };

// The catalog is a fourth list beside the three, shared by all of them. Its id is
// only the `ItemDialogService` handshake token — unlike the three item lists,
// nothing routes on it, so the type stays the plain shared one.
export const GROCERY_CATEGORIES_LIST_ID = '_grocery-categories';

// Concrete grocery lists narrow `id`; everything else comes from the shared base.
type TStorageList = IItemList<IStorageItem> & { id: '_storage' };
type TProductsList = IItemList<IProduct> & { id: '_products' };
type TShoppingList = IItemList<IShoppingItem> & { id: '_shopping' };

export type IStorageState = Readonly<TStorageList>;
export type IShoppingState = Readonly<TShoppingList> & {
  showActionSheet: boolean;
};
export type IProductsState = Readonly<TProductsList>;

// Grocery cross-list search buckets, split off the shared `ISearchResult` base
// (which stays domain-blind). Populated by the grocery selector when the
// corresponding list-settings flag is on (e.g. showProductsInStorage).
export interface IGrocerySearchResult<
  T extends IBaseItem,
> extends ISearchResult<T> {
  products?: IProduct[];
  storageItems?: IStorageItem[];
  shoppingItems?: IShoppingItem[];
}
