/**
 * Public model of the `groceries` bounded context (type:model).
 *
 * The grocery-owned types, split out of the `@shared/types` god-file
 * (DDD review #1). Shared-kernel types they build on (IBaseItem, IItemList,
 * ISearchResult, IItemDialogState, TItemListCategory, TItemListMode,
 * TTimestamp) are imported from `@shared/types`; everything grocery-specific
 * lives here and is imported by the groceries domain via `../model` /
 * `../../model` / `../../../model`.
 *
 * Renames vs kitchen-bot (to avoid colliding with timetracker's own types)
 * were already applied when the types lived in `@shared/types`:
 *   KB `IEditItemState` -> `IItemDialogState` (the shared-kernel dialog state).
 */
import {
  IBaseItem,
  IItemList,
  ISearchResult,
  TColor,
  TItemListCategory,
  TItemListMode,
  TTimestamp,
} from '../../@shared/types';

// Grocery list feature-flags (kitchen-bot `ISettings`; slice key `listSettings`).
// These were parked in @shared as a pseudo-shared "list settings" slice, but
// they're grocery-only: the showQuickAdd* toggles gate the grocery quick-add row
// and the show*In* flags gate the cross-list search buckets. The persisted schema
// `version` that used to ride here moved to the app-global @shared Settings slice.
export interface IListSettings {
  showQuickAdd: boolean;
  showQuickAddProduct: boolean;
  showQuickAddCategory: boolean;
  showProductsInStorage: boolean;
  showShoppingInStorage: boolean;
  showProductsInShopping: boolean;
  showStorageInShopping: boolean;
  showStorageInProducts: boolean;
  showShoppingInProducts: boolean;
}

// The grocery quick-add row's derived UI state (also formerly a pseudo-shared
// @shared slice). Only groceries feeds and renders it now — tasks' vestigial
// copy was removed. The grocery engine recomputes it (updateQuickAddState) on
// search/mode changes; the quick-add component reads it, ANDed with the
// showQuickAdd* flags above.
export type IQuickAddState = Readonly<{
  listName?: string;
  color?: TColor;
  searchQuery?: string;
  canAddLocal?: boolean;
  canAddProduct?: boolean;
  canAddCategory: boolean;
}>;

export type TItemUnit = 'ml' | 'g' | 'pieces';
export type TPackagingUnit = 'bottle' | 'package' | 'loose' | 'tin-can';
export type TBestBeforeTimespan =
  'forever' | 'days' | 'weeks' | 'months' | 'years';

export interface IProduct extends IBaseItem {
  unit: TItemUnit;
  packaging: TPackagingUnit;
  packagingWeight?: number;
  bestBeforeTimespan: TBestBeforeTimespan;
  bestBeforeTimevalue?: number;
}

export interface IShoppingItem extends IBaseItem {
  quantity: number;
  state: 'bought' | 'active';
}

export type IStorageItem = IBaseItem & {
  quantity: number;
  minAmount?: number;
  bestBefore?: TTimestamp;
};

// Concrete grocery lists narrow `id`/`title` and re-require categories/mode
// (optional on the shared IItemList base) so grocery selectors can read them
// without null guards.
export type TStorageList = IItemList<IStorageItem> & {
  id: '_storage';
  title: 'Storage';
  categories: TItemListCategory[];
  mode: TItemListMode;
};
export type TProductsList = IItemList<IProduct> & {
  id: '_products';
  title: 'Product Items';
  categories: TItemListCategory[];
  mode: TItemListMode;
};
export type TShoppingList = IItemList<IShoppingItem> & {
  id: '_shopping';
  title: 'Shopping Items';
  categories: TItemListCategory[];
  mode: TItemListMode;
};

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

// The grocery slice bundle. The grocery slices (products/shopping/storage) left
// `IAppState` in the god-file split, so the cross-list engine helpers take this
// recomposed view — built from per-slice feature selectors + the shared
// listSettings selector inside the grocery selectors / effects — instead of
// reading `state.storage/products/shopping` off the root state.
export type IGroceryLists = {
  storage: IStorageState;
  products: IProductsState;
  shopping: IShoppingState;
  listSettings: IListSettings;
};
