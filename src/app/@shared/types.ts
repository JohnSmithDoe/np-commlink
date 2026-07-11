import { Color } from '@ionic/core/dist/types/interface';
import { Dayjs } from 'dayjs';
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
  | 'notifications';

export type TTimestamp = string;

export type IBaseItem = {
  id: string;
  name: string;
  createdAt: TTimestamp;
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

export interface IItemList<T extends IBaseItem> {
  title: string;
  items: T[];
  searchQuery?: string;
  sort?: TItemListSort;
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
  tracking: ITrackingState;
  settings: ISettingsState;
  officeTime: IOfficeTimeStateStorage;
  notifications: INotificationsState;
}

// At load time each slice may be null (fresh user, cleared storage), so
// migrations operate on a relaxed view of IDatastore where any slice can
// be absent.
export type LoadedDatastore = {
  [K in keyof IDatastore]: IDatastore[K] | null | undefined;
};

// hmm clean up this and myba add a quick add state
export interface ISearchResult<T extends ITrackingItem> {
  listItems: T[];
  hasSearchTerm: boolean; // length of the searchTerm > 0
  searchTerm: string;
  exactMatch?: T; // the item from the list where the name matches exactly
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
  tracking: ITrackingState;
  dialogs: TDialogsState;
  settings: ISettingsState;
  officeTime: IOfficeTimeState;
  notifications: INotificationsState;
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
