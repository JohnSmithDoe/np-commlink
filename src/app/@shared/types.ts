import { Color } from '@ionic/core/dist/types/interface';
import { Dayjs } from 'dayjs';
import { RouterReducerState } from '@ngrx/router-store';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export type BooleanKeys<T> = {
  [k in keyof T]: T[k] extends boolean ? k : never;
}[keyof T];

export type TIonDragEvent = CustomEvent<{ amount: number; ratio: number }>;
export type TMarker = string;
export type TColor =
  | Color
  | 'tracking'
  | 'settings'
  | 'office-time'
  | 'barcode'
  | 'data'
  | 'freeday'
  | 'commlink'
  | 'notifications'
  | 'cash'
  // trackplay domain (game-score tracker)
  | 'trackplay'
  // grocery domains (shopping / storage / tasks / globals + categories)
  | 'global'
  | 'task'
  | 'category'
  | 'storage'
  | 'shopping'
  | 'low-stock-warn'
  | 'low-stock';

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
export type TItemListId = '_storage' | '_globals' | '_shopping' | '_tasks';

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

export interface IDatastore {
  // timetracker slices
  tracking: ITrackingState;
  settings: ISettingsState;
  officeTime: IOfficeTimeStateStorage;
  notifications: INotificationsState;
  // grocery slices (persisted; the itemDialogs + quickAdd slices are ephemeral
  // UI state and deliberately NOT stored — mirrors kitchen-bot).
  globals: TGlobalsList;
  shopping: TShoppingList;
  storage: TStorageList;
  tasks: TTasksList;
  listSettings: IListSettings;
  // cash ledger (offline multi-account finance)
  cash: ICashState;
  // trackplay slice (game-score tracker)
  trackplay: ITrackplayState;
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
  // list-settings flag is on (e.g. showGlobalsInStorage).
  globalItems?: IGlobalItem[];
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
  barcode?: string;
  dashboardSettings: DashboardSettings;
  dashboardItems: DashboardItemType[];
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
  // timetracker
  tracking: ITrackingState;
  dialogs: TDialogsState;
  settings: ISettingsState;
  officeTime: IOfficeTimeState;
  notifications: INotificationsState;
  // grocery (independent domains + shared slices)
  globals: IGlobalsState;
  shopping: IShoppingState;
  storage: IStorageState;
  tasks: ITasksState;
  quickadd: IQuickAddState;
  listSettings: IListSettings;
  itemDialogs: TItemDialogsState;
  // cash ledger
  cash: ICashState;
  // trackplay (single sealed domain, normalized maps)
  trackplay: ITrackplayState;
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

export interface IGlobalItem extends IBaseItem {
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

export type TAllItemTypes =
  IGlobalItem | IShoppingItem | IStorageItem | ITaskItem;

// Concrete grocery lists narrow `id`/`title` and re-require categories/mode
// (optional on the shared IItemList base above) so grocery selectors can read
// them without null guards.
export type TStorageList = IItemList<IStorageItem> & {
  id: '_storage';
  title: 'Storage';
  categories: TItemListCategory[];
  mode: TItemListMode;
};
export type TGlobalsList = IItemList<IGlobalItem> & {
  id: '_globals';
  title: 'Global Items';
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
export type IGlobalsState = Readonly<TGlobalsList>;
export type ITasksState = Readonly<TTasksList>;

// Grocery feature-flags (kitchen-bot `ISettings`). Shared slice key `listSettings`.
export interface IListSettings {
  showQuickAdd: boolean;
  showQuickAddGlobal: boolean;
  showQuickAddCategory: boolean;
  showGlobalsInStorage: boolean;
  showShoppingInStorage: boolean;
  showGlobalsInShopping: boolean;
  showStorageInShopping: boolean;
  showStorageInGlobals: boolean;
  showShoppingInGlobals: boolean;
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
export type IEditGlobalItemState = IItemDialogState<IGlobalItem>;

export type IQuickAddState = Readonly<{
  listName?: string;
  color?: TColor;
  searchQuery?: string;
  canAddLocal?: boolean;
  canAddGlobal?: boolean;
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

export interface ICashAccount {
  id: string;
  name: string;
  kind: TAccountKind;
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
  importBatchId?: string;
}

// Email-style categorization filter. A rule fires when its conditions match
// (`all` = AND, `any` = OR), assigning `category`. Rules are ordered and the
// first matching rule wins.
export type TFilterOp =
  'contains' | 'startsWith' | 'endsWith' | 'equals' | 'regex';
export type TFilterField = 'description' | 'amount';

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
// Trackplay domain types (game-score tracker, ported from npTrackplay).
//
// One sealed Sheriff domain `trackplay` with a single NgRx slice holding
// NORMALIZED maps (players / games / gameTypes / rounds) keyed by TID. Player
// counters and per-game scores/winners are DERIVED in selectors — never stored.
// Timestamps are epoch-ms numbers (TDateTime), distinct from the ISO-string
// TTimestamp used by the timetracker/grocery item types.
// ============================================================================

export type TID = string;
export type TDateTime = number; // epoch ms (Date.now())

export interface IBase {
  id: TID;
  name: string;
  created: TDateTime;
}

// One scoring round: playerId -> points scored that round.
export interface IRound extends IBase {
  idx: number;
  values: Record<TID, number>;
}

// A player. NOTE: play/win/loss/open counters are DERIVED (see playerStats
// selector), not stored — only `lastPlayed` is persisted.
export interface IPlayer extends IBase {
  lastPlayed?: TDateTime;
}

// A game variant. Does NOT extend IBase (no `created`). winHigh=true means the
// highest total wins; false means the lowest total wins.
export interface IGameType {
  id: TID;
  name: string;
  winHigh: boolean;
}

export interface IGame extends IBase {
  type: TID; // -> IGameType.id
  players: TID[]; // -> IPlayer.id[]
  rounds: TID[]; // -> IRound.id[] (ordered)
  ended: boolean;
  updated: TDateTime;
}

// Per-list sort/filter config (games list, games-for-player list).
export interface IGameConfig {
  sort: 'name' | 'date' | 'updated';
  dir: 'asc' | 'desc';
  filter: string;
  typeId: TID; // '' = no type filter
  showEndedGames: boolean;
}

export interface ITrackplayConfig {
  games: IGameConfig;
  gamesForPlayer: IGameConfig;
  players: {
    sort: 'name' | 'date' | 'last';
    dir: 'asc' | 'desc';
    filter: string;
  };
}

// Derived per-player counters (from games + rounds). `loss` replaces the
// legacy "loose" misspelling.
export interface IPlayerStats {
  play: number;
  win: number;
  loss: number;
  open: number;
}

// Full snapshot of the mutable trackplay maps + config, captured before a
// destructive action so a single-level undo can re-insert it verbatim.
export interface ITrackplaySnapshot {
  players: Record<TID, IPlayer>;
  games: Record<TID, IGame>;
  gameTypes: Record<TID, IGameType>;
  rounds: Record<TID, IRound>;
  config: ITrackplayConfig;
}

// Single-slot undo payload: the snapshot + a human name for the toast.
export interface ITrackplayDeleted {
  name: string;
  snapshot: ITrackplaySnapshot;
}

export interface ITrackplayState {
  players: Record<TID, IPlayer>;
  games: Record<TID, IGame>;
  gameTypes: Record<TID, IGameType>;
  rounds: Record<TID, IRound>;
  config: ITrackplayConfig;
  lastDeleted: ITrackplayDeleted | null;
}
