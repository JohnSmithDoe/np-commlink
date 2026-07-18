import { PredefinedColors } from '@ionic/core/dist/types/interface';
import { RouterReducerState } from '@ngrx/router-store';

export type BooleanKeys<T> = {
  [k in keyof T]: T[k] extends boolean ? k : never;
}[keyof T];

export type TIonDragEvent = CustomEvent<{ amount: number; ratio: number }>;
export type TMarker = string;
// The Ionic base palette only. The per-domain color names (tracking, cash,
// storage, category, freeday, …) were dropped in the SCSS simplification for a
// uniform amber/teal deck, so a color is now always one of Ionic's predefined
// palette entries — anything else is a compile error.
export type TColor = PredefinedColors;

export type TTimestamp = string;

// IBaseItem is the minimal shared kernel every list item across BOTH app-halves
// carries: identity (id/name/createdAt) plus the optional `category` the generic
// list/category engine reads unguarded (categories.pipe, category-note,
// categoriesFromList). Domain-specific attributes are owned by the domain models
// that need them — IProduct/IShoppingItem/IStorageItem (groceries/model),
// ITrackingItem (tracking/model), etc. — never here.
export type IBaseItem = {
  id: string;
  name: string;
  createdAt: TTimestamp;
  category?: string[];
};

export type TUpdateDTO<T extends IBaseItem> = IBaseItem &
  Partial<T> & { id: string };

export type TItemListSortType = 'name' | string;
export type TItemListSortDir = 'asc' | 'desc';

export type TItemListSort = {
  sortDir: TItemListSortDir;
  sortBy: TItemListSortType;
};

export type TItemListCategory = string;
export type TItemListMode = 'alphabetical' | 'categories';
export type TItemListId =
  '_storage' | '_products' | '_shopping' | '_tasks' | '_tracking';

// The generic list shape shared by tracking and the grocery lists. `categories`
// and `mode` are required (kitchen-bot's grocery code reads them unguarded);
// the tracking list simply carries an empty categories array and 'alphabetical'
// mode. `id` and `filterBy` stay optional — tracking has no route-driven listId.
export interface IItemList<T extends IBaseItem> {
  title: string;
  items: T[];
  categories: TItemListCategory[];
  mode: TItemListMode;
  searchQuery?: string;
  sort?: TItemListSort;
  id?: TItemListId;
  filterBy?: string;
}

export type IListState<T extends IBaseItem> = IItemList<T>;

export type TNotificationActionType =
  'tracking.start' | 'tracking.stop' | 'tracking.pause';

export type TNotificationAction = {
  type: TNotificationActionType;
  trackingItemId: string;
};

export type INotification = IBaseItem & {
  body: string;
  icon: string;
  color: TColor;
  status: 'new' | 'done';
  updatedAt: TTimestamp;
  trackingItemId?: string;
  action?: TNotificationAction;
};

export interface INotificationsState {
  items: INotification[];
  doneCollapsed: boolean;
  lastViewedAt: TTimestamp;
}

// Published dashboard-telemetry contract (§4). A program reports a `source`
// (its context id, used for grouping), an optional `status`, and a bag of
// display `metrics` (numbers or strings) the deck renders.
export type IDashboardTelemetry = {
  source: string;
  status?: 'online' | 'standby';
  metrics: Record<string, number | string>;
};

// Persisted dashboard read-model doc (one `npc-summary-<source>` key each).
// The persistence model deliberately drops `status`: a summary on disk is
// cold, so it can only ever hydrate to `standby`; `online` is stamped by a
// live `report`. Persisting metrics only keeps the standby→online lifecycle
// structurally enforced by the reducer rather than by remembering to strip a
// field on the way to disk (lazy-modules plan §3).
export type IDashboardSummary = {
  source: string;
  metrics: Record<string, number | string>;
};

// Eager dashboard read-model (CQRS). Latest telemetry per source. Hydrated at
// boot from the persisted `npc-summary-*` docs (at `standby`) so the deck can
// render cold-launch numbers before any producing module loads; live `report`s
// then flip sources to `online`. NOT part of IDatastore — persisted centrally
// by DashboardEffects, not via the slice-keyed datastore.
export interface IDashboardState {
  bySource: Record<string, IDashboardTelemetry>;
}

export interface IDatastore {
  // persisted slices (the itemDialogs + quickAdd slices are ephemeral UI state
  // and deliberately NOT stored — mirrors kitchen-bot). The grocery slices
  // (products/shopping/storage) and `tasks` own their own
  // IDatastore-independent keys in their data modules after the god-file split.
  listSettings: IListSettings;
}

// At load time each slice may be null (fresh user, cleared storage), so
// migrations operate on a relaxed view of IDatastore where any slice can
// be absent.
export type LoadedDatastore = {
  [K in keyof IDatastore]: IDatastore[K] | null | undefined;
};

export interface ISearchResult<T extends IBaseItem> {
  listItems: T[];
  hasSearchTerm: boolean; // length of the searchTerm > 0
  searchTerm: string;
  exactMatch?: T; // the item from the list where the name matches exactly
  // Domain-blind base result. The grocery cross-list search buckets
  // (products/storageItems/shoppingItems) live on the groceries-owned
  // `IGrocerySearchResult<T>` extension in `groceries/model`.
}

export type TEditItemMode = 'update' | 'create';

export interface IAppState {
  router: RouterReducerState;
  // eager dashboard read-model (CQRS) — not persisted (not in IDatastore)
  dashboard: IDashboardState;
  quickadd: IQuickAddState;
  listSettings: IListSettings;
  itemDialogs: TItemDialogsState;
}

// ============================================================================
// The grocery domain types (products/shopping/storage) moved to
// `groceries/model` and the task types moved to `tasks/model` in the god-file
// split (DDD review #1).
//
// Rename vs kitchen-bot to avoid colliding with timetracker's own types:
//   KB `ISettings`      -> `IListSettings`      (feature flags; slice key `listSettings`)
//   KB `IEditItemState` -> `IItemDialogState`   (TT keeps its own IEditItemState)
// ============================================================================

// Grocery feature-flags (kitchen-bot `ISettings`). Shared slice key `listSettings`.
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
  version: string;
}

// Category-RENAME dialog state. The category-SELECTION working copy (catalog +
// selection + search) moved local to the pure-ui `categories-dialog` in the
// dialog refactor; only the rename flow (edit-category-dialog) still rides the
// shared slice, so this is now just the rename target.
export type ICategoriesState = Readonly<{
  editItem?: TItemListCategory;
  original?: TItemListCategory;
  isEditing?: boolean;
}>;

// kitchen-bot's `IEditItemState`, renamed to avoid colliding with TT's.
export type IItemDialogState<T extends IBaseItem> = Readonly<{
  item: T;
  listId: TItemListId;
  isEditing?: boolean;
  editMode?: TEditItemMode;
  dialogTitle?: string;
  saveButtonText?: string;
  category: ICategoriesState;
  addToAdditionalList?: TItemListId;
  scannedEan?: string;
}>;
// The shared itemDialogs slice is domain-blind: it carries an IBaseItem. Each
// context casts the generic edit state to its own item type in its own data
// module (e.g. groceries/data/item-dialogs.selector, tasks/data/item-dialogs.selector).
export type TItemDialogsState = IItemDialogState<IBaseItem>;

export type IQuickAddState = Readonly<{
  listName?: string;
  color?: TColor;
  searchQuery?: string;
  canAddLocal?: boolean;
  canAddProduct?: boolean;
  canAddCategory: boolean;
}>;
