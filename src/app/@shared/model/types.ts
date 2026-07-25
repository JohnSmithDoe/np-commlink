import { PredefinedColors } from '@ionic/core/dist/types/interface';

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

// Two-theme selection. 'cyberpunk' = the Shadowrun deck (the default look);
// 'boomer' = the plain, serious "OK Boomer" office style. Rides on the eager
// app-global `settings` slice (persisted `npc-settings`) and is mirrored onto
// the <html data-theme> attribute by theme.service — the base :root is
// 'boomer'/plain, cyberpunk decoration lives under :root[data-theme='cyberpunk'].
export type TTheme = 'cyberpunk' | 'boomer';

// IBaseItem is the minimal shared kernel every list item across BOTH app-halves
// carries: identity (id/name/createdAt) plus the optional `categoryIds` the
// generic list/category engine reads unguarded. A category is a first-class
// {id,name} object (ICategory) owned by the list's catalog; items reference it
// BY ID, so display resolves id→name against the catalog (categories.pipe,
// category-note) and renaming a category is O(1). Domain-specific attributes are
// owned by the domain models that need them — IProduct/IShoppingItem/IStorageItem
// (groceries/model), ITrackingItem (tracking/model), etc. — never here.
export type IBaseItem = {
  id: string;
  name: string;
  createdAt: TTimestamp;
  categoryIds?: TCategoryId[];
};

export type TUpdateDTO<T extends IBaseItem> = IBaseItem &
  Partial<T> & { id: string };

export type TItemListSortType = 'name' | string;
export type TItemListSortDir = 'asc' | 'desc';

export type TItemListSort = {
  sortDir: TItemListSortDir;
  sortBy: TItemListSortType;
};

// A category is a first-class {id,name} object. Items/txns/rules reference it by
// id (`categoryIds`/`categoryId`); the owning list holds the authoritative
// catalog (`IItemList.categories: ICategory[]`). `TItemListCategory` is the
// catalog element type — it was a bare name string, now the object.
export interface ICategory {
  id: string;
  name: string;
}
export type TCategoryId = string;
export type TItemListCategory = ICategory;
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

// Published dashboard-telemetry contract (§4) — the ONLY dashboard type that
// belongs to @shared, because the nine supplier contexts dispatch it. A program
// reports a `source` (its context id, used for grouping), an optional `status`,
// and a bag of display `metrics` (numbers or strings) the deck renders.
//
// The read-model types this feeds (IDashboardSummary, IDashboardState) live in
// `commlink/model` alongside the slice that owns them — sharing them would put
// a specific reader's shapes in the domain-blind kernel.
export type IDashboardTelemetry = {
  source: string;
  status?: 'online' | 'standby';
  metrics: Record<string, number | string>;
};

export interface IDatastore {
  // The one kernel-owned persisted slice. Every bounded context (groceries incl.
  // its listSettings, tasks, office-time, …) owns its own IDatastore-independent
  // key in its own data module after the god-file split + the settings re-scope;
  // the quickadd slice is ephemeral UI state and NOT stored.
  settings: ISettings;
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

// App-global settings (eager kernel): the persisted schema `version` anchor for
// the migration framework (@shared/util/migrations) and the selected UI theme.
// The grocery feature-flags that historically rode a shared "settings" slice
// moved into the groceries domain (IListSettings) and office-time owns its own
// OfficeTimeSettings, so `version` and `theme` are the only genuinely app-wide
// settings.
export interface ISettings {
  version: string;
  // The selected UI theme (default 'cyberpunk'); drives <html data-theme>.
  theme: TTheme;
}

// ============================================================================
// No root-state type by design — each slice is reached through its own
// `createFeatureSelector<ISliceState>('key')`. A complete one is impossible
// anyway: `dashboard` is eager but commlink-owned (Sheriff bars @shared from
// naming a domain type), every bounded context is lazy, and `main.ts` may not
// import `type:model`. The mock store's kernel seed lives with the test kit
// that needs it (`@shared/testing/test-data`).
//
// The grocery domain types (products/shopping/storage, IListSettings, the
// quick-add IQuickAddState) moved to `groceries/model` and the task types moved
// to `tasks/model` in the god-file split (DDD review #1) + the settings re-scope.
// ============================================================================
