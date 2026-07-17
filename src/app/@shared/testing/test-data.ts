import { RouterReducerState } from '@ngrx/router-store';
import {
  IAppState,
  ICashAccount,
  ICashRule,
  ICashState,
  ICashTransaction,
  ICategoriesState,
  IDashboardState,
  IProduct,
  IProductsState,
  IListSettings,
  INotificationsState,
  IBarcodeState,
  IOfficeTimeState,
  IQuickAddState,
  ISettingsState,
  IShoppingItem,
  IShoppingState,
  IStorageItem,
  IStorageState,
  ITaskItem,
  ITasksState,
  ITrackingItem,
  ITrackingState,
  TDialogsState,
  TItemDialogsState,
} from '../types';

// NOTE: initial states are defined inline (rather than imported from the
// reducers) on purpose: importing e.g. the item-dialogs reducer eagerly
// evaluates `createStorageItem('initial')` -> `dayjs()` at module load, which
// pulls a non-deterministic timestamp into the fixtures. Inlining keeps the
// fixtures deterministic and side-effect free.

const LIST_SETTINGS_VERSION = '1';

const initialListSettings: IListSettings = {
  showQuickAdd: false,
  showQuickAddProduct: false,
  showQuickAddCategory: false,
  showProductsInShopping: false,
  showProductsInStorage: false,
  showShoppingInProducts: false,
  showShoppingInStorage: false,
  showStorageInProducts: false,
  showStorageInShopping: false,
  version: LIST_SETTINGS_VERSION,
};

/**
 * Deterministic test-data factories.
 *
 * Unlike the production factories these produce *stable* ids and timestamps so
 * equality/matching assertions in specs are repeatable. Every factory takes a
 * `Partial<...>` of overrides.
 */
export const TEST_TIMESTAMP = '2024-01-01T12:00:00.000Z';

// --- timetracker slices ---

export function mockTrackingItem(
  overrides: Partial<ITrackingItem> = {}
): ITrackingItem {
  return {
    id: 'tracking-1',
    name: 'Ticket',
    createdAt: TEST_TIMESTAMP,
    state: 'stopped',
    ...overrides,
  };
}

export function mockTrackingState(
  overrides: Partial<ITrackingState> = {}
): ITrackingState {
  return {
    title: 'Time tracking',
    items: [],
    categories: [],
    mode: 'alphabetical',
    data: [],
    dataViewId: '',
    ...overrides,
  };
}

export function mockTrackingDialogsState(
  overrides: Partial<TDialogsState> = {}
): TDialogsState {
  return { item: undefined, isEditing: false, ...overrides };
}

export function mockSettingsState(
  overrides: Partial<ISettingsState> = {}
): ISettingsState {
  return { showTotalTime: false, version: '1', ...overrides };
}

export function mockOfficeTimeState(
  overrides: Partial<IOfficeTimeState> = {}
): IOfficeTimeState {
  return {
    targetOfficeDaysPerWeek: 3,
    holidays: {},
    officedays: [],
    freedays: [],
    dashboardSettings: {
      showDateCard: false,
      showPercentageCard: false,
      showOfficedaysCardList: false,
      showOfficedaysCardEdit: false,
      showFreedaysCardList: false,
      showFreedaysCardEdit: false,
      showHolidaysCard: false,
      showStatsWeek: false,
      showStatsMonth: false,
      showStatsQuarter: false,
      showStatsYear: false,
      showWordclockCard: false,
    },
    dashboardItems: [],
    ...overrides,
  };
}

export function mockBarcodeState(
  overrides: Partial<IBarcodeState> = {}
): IBarcodeState {
  return { ...overrides };
}

export function mockNotificationsState(
  overrides: Partial<INotificationsState> = {}
): INotificationsState {
  return {
    items: [],
    doneCollapsed: true,
    lastViewedAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockDashboardState(
  overrides: Partial<IDashboardState> = {}
): IDashboardState {
  return { bySource: {}, ...overrides };
}

function mockRouterState(): RouterReducerState {
  return {
    state: {
      url: '/',
      root: {
        params: {},
        data: {},
        url: [],
        outlet: 'primary',
        routeConfig: null,
        queryParams: {},
        fragment: null,
        firstChild: undefined,
        children: [],
        title: undefined,
      },
    },
    navigationId: 1,
  } as unknown as RouterReducerState;
}

// --- grocery slices ---

export function mockStorageItem(
  overrides: Partial<IStorageItem> = {}
): IStorageItem {
  return {
    id: 'storage-1',
    name: 'Milk',
    createdAt: TEST_TIMESTAMP,
    quantity: 1,
    ...overrides,
  };
}

export function mockShoppingItem(
  overrides: Partial<IShoppingItem> = {}
): IShoppingItem {
  return {
    id: 'shopping-1',
    name: 'Bread',
    createdAt: TEST_TIMESTAMP,
    quantity: 1,
    state: 'active',
    ...overrides,
  };
}

export function mockTaskItem(overrides: Partial<ITaskItem> = {}): ITaskItem {
  return {
    id: 'task-1',
    name: 'Clean the kitchen',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    id: 'product-1',
    name: 'Sugar',
    createdAt: TEST_TIMESTAMP,
    unit: 'pieces',
    packaging: 'loose',
    bestBeforeTimespan: 'forever',
    bestBeforeTimevalue: 1,
    ...overrides,
  };
}

export function mockStorageState(
  overrides: Partial<IStorageState> = {}
): IStorageState {
  return {
    id: '_storage',
    title: 'Storage',
    items: [],
    categories: [],
    mode: 'alphabetical',
    ...overrides,
  };
}

export function mockShoppingState(
  overrides: Partial<IShoppingState> = {}
): IShoppingState {
  return {
    id: '_shopping',
    title: 'Shopping Items',
    items: [],
    categories: [],
    mode: 'alphabetical',
    showActionSheet: false,
    ...overrides,
  };
}

export function mockProductsState(
  overrides: Partial<IProductsState> = {}
): IProductsState {
  return {
    id: '_products',
    title: 'Product Items',
    items: [],
    categories: [],
    mode: 'alphabetical',
    ...overrides,
  };
}

export function mockTasksState(
  overrides: Partial<ITasksState> = {}
): ITasksState {
  return {
    id: '_tasks',
    title: 'Tasks Items',
    items: [],
    categories: [],
    mode: 'alphabetical',
    ...overrides,
  };
}

export function mockListSettings(
  overrides: Partial<IListSettings> = {}
): IListSettings {
  return { ...initialListSettings, ...overrides };
}

export function mockCategoriesState(
  overrides: Partial<ICategoriesState> = {}
): ICategoriesState {
  return {
    categories: [],
    selection: [],
    isSelecting: false,
    isEditing: false,
    ...overrides,
  };
}

export function mockItemDialogsState(
  overrides: Partial<TItemDialogsState> = {}
): TItemDialogsState {
  return {
    isEditing: false,
    item: mockStorageItem({ id: 'dialog-item', name: 'initial' }),
    listId: '_storage',
    addToAdditionalList: undefined,
    ...overrides,
    category: mockCategoriesState(overrides.category),
  };
}

export function mockQuickAddState(
  overrides: Partial<IQuickAddState> = {}
): IQuickAddState {
  return {
    canAddLocal: false,
    canAddProduct: false,
    canAddCategory: false,
    searchQuery: undefined,
    ...overrides,
  };
}

// --- cash slice ---

export function mockCashAccount(
  overrides: Partial<ICashAccount> = {}
): ICashAccount {
  return {
    id: 'cash-account-1',
    name: 'Giro',
    kind: 'giro',
    openingBalanceCents: 0,
    openingDateISO: TEST_TIMESTAMP,
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockCashTransaction(
  overrides: Partial<ICashTransaction> = {}
): ICashTransaction {
  return {
    id: 'cash-txn-1',
    accountId: 'cash-account-1',
    dateISO: TEST_TIMESTAMP,
    amountCents: -1999,
    description: 'REWE SAGT DANKE',
    source: 'manual',
    status: 'confirmed',
    ...overrides,
  };
}

export function mockCashRule(overrides: Partial<ICashRule> = {}): ICashRule {
  return {
    id: 'cash-rule-1',
    order: 0,
    match: 'any',
    conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
    category: 'groceries',
    ...overrides,
  };
}

export function mockCashState(overrides: Partial<ICashState> = {}): ICashState {
  return {
    accounts: [],
    transactions: [],
    rules: [],
    categories: [],
    ...overrides,
  };
}

/** A complete, overridable {@link IAppState} for use with `provideMockStore`. */
export function mockAppState(
  overrides: Partial<IAppState> & Record<string, unknown> = {}
): IAppState {
  return {
    router: mockRouterState(),
    dashboard: mockDashboardState(),
    tracking: mockTrackingState(),
    dialogs: mockTrackingDialogsState(),
    settings: mockSettingsState(),
    officeTime: mockOfficeTimeState(),
    barcode: mockBarcodeState(),
    notifications: mockNotificationsState(),
    storage: mockStorageState(),
    shopping: mockShoppingState(),
    products: mockProductsState(),
    tasks: mockTasksState(),
    listSettings: mockListSettings(),
    itemDialogs: mockItemDialogsState(),
    quickadd: mockQuickAddState(),
    cash: mockCashState(),
    ...overrides,
  };
}
