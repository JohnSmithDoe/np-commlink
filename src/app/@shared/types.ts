import { PredefinedColors } from '@ionic/core/dist/types/interface';
import { Dayjs } from 'dayjs';
import { RouterReducerState } from '@ngrx/router-store';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

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

// IBaseItem is shared by BOTH app-halves. timetracker items (tracking,
// notifications) use only id/name/createdAt; the grocery items add the
// optional category/price/desc/location carried over from kitchen-bot.
export type IBaseItem = {
  id: string;
  name: string;
  createdAt: TTimestamp;
  category?: string[];
  price?: number;
  desc?: string;
  location?: string;
};

export type TUpdateDTO<T extends IBaseItem> = IBaseItem &
  Partial<T> & { id: string };

export type ITrackingItemNotificationsConfig = {
  onStart: boolean;
  onStop: boolean;
  onProcess: boolean;
};

export type ITrackingItem = IBaseItem & {
  startTime?: TTimestamp;
  breakTime?: TTimestamp;
  trackedTimeInSeconds?: number;
  breakInSeconds?: number;
  state: 'running' | 'stopped' | 'paused';
  notifications?: ITrackingItemNotificationsConfig;
};

export type IDataItem = Pick<
  ITrackingItem,
  'trackedTimeInSeconds' | 'name' | 'id' | 'startTime'
>;

export type TItemListSortType = 'name' | string;
export type TItemListSortDir = 'asc' | 'desc';

export type TItemListSort = {
  sortDir: TItemListSortDir;
  sortBy: TItemListSortType;
};

export type TItemListCategory = string;
export type TItemListMode = 'alphabetical' | 'categories';
export type TItemListId = '_storage' | '_products' | '_shopping' | '_tasks';

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

export type TTrackingList = IListState<ITrackingItem> & {
  title: 'Time tracking';
  data: ITrackingItem[];
  dataViewId: string;
};
export type ITrackingState = TTrackingList;

export interface ISettingsState {
  showTotalTime: boolean;
  version: string;
}

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
  // timetracker slices
  tracking: ITrackingState;
  settings: ISettingsState;
  officeTime: IOfficeTimeStateStorage;
  barcode: IBarcodeState;
  notifications: INotificationsState;
  // grocery slices (persisted; the itemDialogs + quickAdd slices are ephemeral
  // UI state and deliberately NOT stored — mirrors kitchen-bot).
  products: TProductsList;
  shopping: TShoppingList;
  storage: TStorageList;
  tasks: TTasksList;
  listSettings: IListSettings;
  // cash ledger (offline multi-account finance)
  cash: ICashState;
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
  // grocery cross-list search buckets (optional — tracking search never sets
  // them). Populated by the shared item-list selector when the corresponding
  // list-settings flag is on (e.g. showProductsInStorage).
  products?: IProduct[];
  storageItems?: IStorageItem[];
  shoppingItems?: IShoppingItem[];
}

export type TEditItemMode = 'update' | 'create';
export type IEditItemState<T extends IBaseItem> = Readonly<{
  item: T | undefined;
  isEditing?: boolean;
  editMode?: TEditItemMode;
  dialogTitle?: string;
  saveButtonText?: string;
}>;
export type TDialogsState = IEditItemState<ITrackingItem>;
export type IEditTrackingItemState = IEditItemState<ITrackingItem>;

export interface IOfficeTimeState {
  targetOfficeDaysPerWeek: number;
  holidays: Record<string, Dayjs>;
  officedays: Array<Dayjs>;
  freedays: Array<Dayjs>;
  dashboardSettings: DashboardSettings;
  dashboardItems: DashboardItemType[];
}

// SIGIL badge — its own bounded context (sheriff-tighten §1). Persisted under
// `npc-barcode`; the uploaded/rotated badge image as a data URL.
export interface IBarcodeState {
  dataUrl?: string;
}

export type IOfficeTimeStateStorage = Omit<
  IOfficeTimeState,
  'holidays' | 'officedays' | 'freedays'
> & {
  holidays?: Record<string, string>;
  officedays?: Array<string>;
  freedays?: Array<string>;
};

export interface IAppState {
  router: RouterReducerState;
  // eager dashboard read-model (CQRS) — not persisted (not in IDatastore)
  dashboard: IDashboardState;
  // timetracker
  tracking: ITrackingState;
  dialogs: TDialogsState;
  settings: ISettingsState;
  officeTime: IOfficeTimeState;
  barcode: IBarcodeState;
  notifications: INotificationsState;
  // grocery (independent domains + shared slices)
  products: IProductsState;
  shopping: IShoppingState;
  storage: IStorageState;
  tasks: ITasksState;
  quickadd: IQuickAddState;
  listSettings: IListSettings;
  itemDialogs: TItemDialogsState;
  // cash ledger
  cash: ICashState;
}

export interface IonViewWillEnter {
  ionViewWillEnter(): void;
}

export interface IonViewDidEnter {
  ionViewDidEnter(): void;
}

export type DashboardStats = {
  workdays: number;
  workdaysTotal: number;
  officedays: number;
  targetdays: number;
  freedays: number;
  holidays: number;
  holidaysNotOnWeekend: number;
  remaining: number;
  percentage: number;
};

marker('officetime.page.settings.dashboard.showDateCard');
marker('officetime.page.settings.dashboard.showPercentageCard');
marker('officetime.page.settings.dashboard.showOfficedaysCardList');
marker('officetime.page.settings.dashboard.showOfficedaysCardEdit');
marker('officetime.page.settings.dashboard.showFreedaysCardList');
marker('officetime.page.settings.dashboard.showFreedaysCardEdit');
marker('officetime.page.settings.dashboard.showHolidaysCard');
marker('officetime.page.settings.dashboard.showStatsWeek');
marker('officetime.page.settings.dashboard.showStatsMonth');
marker('officetime.page.settings.dashboard.showStatsQuarter');
marker('officetime.page.settings.dashboard.showStatsYear');
marker('officetime.page.settings.dashboard.showWordclockCard');

export type DashboardSettings = {
  showDateCard: boolean;
  showPercentageCard: boolean;
  showOfficedaysCardList: boolean;
  showOfficedaysCardEdit: boolean;
  showFreedaysCardList: boolean;
  showFreedaysCardEdit: boolean;
  showHolidaysCard: boolean;
  showStatsWeek: boolean;
  showStatsMonth: boolean;
  showStatsQuarter: boolean;
  showStatsYear: boolean;
  showWordclockCard: boolean;
};

export type DashboardSettingsType = keyof DashboardSettings;
const DASHBOARD_ITEMS = [
  'date',
  'button',
  'wordclock',
  'officedays-list',
  'officedays-edit',
  'freedays-list',
  'freedays-edit',
  'stats-year',
  'stats-quarter',
  'stats-month',
  'stats-week',
  'holidays',
] as const;
export type DashboardItemType = (typeof DASHBOARD_ITEMS)[number];

export type DateTimeHighlight = {
  date: string;
  backgroundColor: string;
  border: string;
  textColor: string;
};

// ============================================================================
// Grocery domain types (ported from np-kitchen-bot @types/types.d.ts)
//
// Renames vs kitchen-bot to avoid colliding with timetracker's own types:
//   KB `ISettings`      -> `IListSettings`      (feature flags; slice key `listSettings`)
//   KB `IEditItemState` -> `IItemDialogState`   (TT keeps its own IEditItemState)
//   KB `TDialogsState`  -> `TItemDialogsState`  (TT keeps its own TDialogsState)
// ============================================================================

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

export interface ITaskItem extends IBaseItem {
  dueAt?: TTimestamp;
  prio?: number;
}

export type IStorageItem = IBaseItem & {
  quantity: number;
  minAmount?: number;
  bestBefore?: TTimestamp;
};

export type TAllItemTypes = IProduct | IShoppingItem | IStorageItem | ITaskItem;

// Concrete grocery lists narrow `id`/`title` and re-require categories/mode
// (optional on the shared IItemList base above) so grocery selectors can read
// them without null guards.
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
export type TTasksList = IItemList<ITaskItem> & {
  id: '_tasks';
  title: 'Tasks Items';
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
export type ITasksState = Readonly<TTasksList>;

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

export type ICategoriesState = Readonly<{
  categories: TItemListCategory[];
  selection: TItemListCategory[];
  editItem?: TItemListCategory;
  original?: TItemListCategory;
  searchQuery?: string;
  isSelecting?: boolean;
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
export type TItemDialogsState = IItemDialogState<TAllItemTypes>;
export type IEditStorageItemState = IItemDialogState<IStorageItem>;
export type IEditTaskItemState = IItemDialogState<ITaskItem>;
export type IEditShoppingItemState = IItemDialogState<IShoppingItem>;
export type IEditProductState = IItemDialogState<IProduct>;

export type IQuickAddState = Readonly<{
  listName?: string;
  color?: TColor;
  searchQuery?: string;
  canAddLocal?: boolean;
  canAddProduct?: boolean;
  canAddCategory: boolean;
}>;

// ============================================================================
// Cash domain types — an offline, EUR, multi-account personal-finance ledger.
//
// Purpose-built (NOT the grocery IItemList engine): each account holds signed
// transactions denominated in INTEGER CENTS (never floats). Ordered,
// email-style filter rules assign a category to each transaction; a manual
// category override wins and is shielded from rule re-runs. See the cash plan.
// ============================================================================

export type TAccountKind = 'giro' | 'creditcard' | 'savings' | 'cash';
// Banks with a dedicated CSV import parser (cash/util/import). An account's
// `bank` implicitly selects its parser — see docs/cash-plan.md P4.
export type TBank = 'volksbank' | 'dkb';

export interface ICashAccount {
  id: string;
  name: string;
  kind: TAccountKind;
  // Optional: selects the CSV import parser. A manual-only account has none.
  bank?: TBank;
  // Opening balance in integer cents as of `openingDateISO`; the running
  // balance is `openingBalanceCents + Σ signed transaction amounts`.
  openingBalanceCents: number;
  openingDateISO: TTimestamp;
  createdAt: TTimestamp;
}

export type TCashTxnSource = 'imported' | 'manual';
export type TCashTxnStatus = 'pending' | 'confirmed';

export interface ICashTransaction {
  id: string;
  accountId: string;
  dateISO: TTimestamp;
  // Signed integer cents: < 0 = outflow (spending), > 0 = inflow (income).
  amountCents: number;
  description: string;
  // Original bank text (kept verbatim from import for rule matching + audit).
  rawDescription?: string;
  category?: string;
  // Manual overrides win: rule re-runs skip transactions flagged here.
  categoryManual?: boolean;
  source: TCashTxnSource;
  // A manual card spend is `pending` until a later import reconciles it.
  status: TCashTxnStatus;
  // Reconciliation: the imported txn a pending manual entry merged into.
  matchedTxnId?: string;
  // Transfer legs are excluded from spend/income totals.
  isTransfer?: boolean;
  // The two legs of one transfer share this id (distinct from matchedTxnId,
  // which is reconciliation). Deleting either leg deletes the whole group.
  transferGroupId?: string;
  importBatchId?: string;
}

// Email-style categorization filter. A rule fires when its conditions match
// (`all` = AND, `any` = OR), assigning `category`. Rules are ordered and the
// first matching rule wins. Ops are split by field: string ops apply to
// `description`, numeric ops to `amount` (matched against signed cents — see
// cash/util/categorize.ts and docs/cash-plan.md).
export type TFilterField = 'description' | 'amount';
export type TDescriptionOp =
  'contains' | 'startsWith' | 'endsWith' | 'equals' | 'regex';
export type TAmountOp = 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
export type TFilterOp = TDescriptionOp | TAmountOp;

export interface ICashFilterCondition {
  field: TFilterField;
  op: TFilterOp;
  value: string;
  caseSensitive?: boolean;
}

export interface ICashRule {
  id: string;
  order: number;
  name?: string;
  match: 'all' | 'any';
  conditions: ICashFilterCondition[];
  category: string;
}

export interface ICashState {
  accounts: ICashAccount[];
  transactions: ICashTransaction[];
  rules: ICashRule[];
  categories: string[];
}
