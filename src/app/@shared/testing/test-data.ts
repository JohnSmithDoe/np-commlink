import { RouterReducerState } from '@ngrx/router-store';
import {
  IAppState,
  IBaseItem,
  ICategoriesState,
  ICategory,
  IDashboardState,
  ISettings,
  TItemDialogsState,
} from '../types';

// NOTE: initial states are defined inline (rather than imported from the
// reducers) on purpose: importing e.g. the item-dialogs reducer eagerly
// evaluates `createBaseItem('initial')` -> `dayjs()` at module load, which
// pulls a non-deterministic timestamp into the fixtures. Inlining keeps the
// fixtures deterministic and side-effect free.

/**
 * Deterministic test-data factories.
 *
 * Unlike the production factories these produce *stable* ids and timestamps so
 * equality/matching assertions in specs are repeatable. Every factory takes a
 * `Partial<...>` of overrides.
 */
export const TEST_TIMESTAMP = '2024-01-01T12:00:00.000Z';

export function mockDashboardState(
  overrides: Partial<IDashboardState> = {}
): IDashboardState {
  return { bySource: {}, ...overrides };
}

export function mockSettings(overrides: Partial<ISettings> = {}): ISettings {
  return { version: '1', theme: 'cyberpunk', ...overrides };
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

// Generic base-item carrier for domain-blind (shared) specs that only need an
// IBaseItem — the grocery-specific mocks live in `groceries/testing`.
export function mockBaseItem(overrides: Partial<IBaseItem> = {}): IBaseItem {
  return {
    id: 'item-1',
    name: 'Item',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockCategoriesState(
  overrides: Partial<ICategoriesState> = {}
): ICategoriesState {
  return {
    isEditing: false,
    ...overrides,
  };
}

// A first-class {id,name} category for specs. Default id/name are stable.
export function mockCategory(overrides: Partial<ICategory> = {}): ICategory {
  return { id: 'cat-1', name: 'Category', ...overrides };
}

export function mockItemDialogsState(
  overrides: Partial<TItemDialogsState> = {}
): TItemDialogsState {
  return {
    isEditing: false,
    item: mockBaseItem({ id: 'dialog-item', name: 'initial' }),
    listId: '_storage',
    addToAdditionalList: undefined,
    ...overrides,
    category: mockCategoriesState(overrides.category),
  };
}

/** A complete, overridable {@link IAppState} for use with `provideMockStore`. */
export function mockAppState(
  overrides: Partial<IAppState> & Record<string, unknown> = {}
): IAppState {
  return {
    router: mockRouterState(),
    dashboard: mockDashboardState(),
    settings: mockSettings(),
    itemDialogs: mockItemDialogsState(),
    ...overrides,
  };
}
