import { RouterReducerState } from '@ngrx/router-store';
import { initialUndoState } from '../data/undo/undo.reducer';
import { BaseItem } from '../model/base-item.types';
import { Category } from '../model/category.types';
import { UndoState } from '../model/undo.types';

export const TEST_TIMESTAMP = '2024-01-01T12:00:00.000Z';

type MockRoute = {
  url?: string;
  parameters?: Record<string, string>;
  data?: Record<string, unknown>;
  queryParameters?: Record<string, string | string[]>;
};

export function mockRouterState({
  url = '/',
  parameters = {},
  data = {},
  queryParameters = {},
}: MockRoute = {}): RouterReducerState {
  const node = {
    params: {},
    data: {},
    url: [],
    outlet: 'primary',
    routeConfig: null,
    queryParams: queryParameters,
    fragment: null,
    firstChild: undefined,
    children: [],
    title: undefined,
  };

  return {
    state: {
      url,
      root: { ...node, firstChild: { ...node, params: parameters, data } },
    },
    navigationId: 1,
  } as unknown as RouterReducerState;
}

export function mockCategory(overrides: Partial<Category> = {}): Category {
  return { id: 'cat-1', name: 'Category', ...overrides };
}

export function mockBaseItem(overrides: Partial<BaseItem> = {}): BaseItem {
  return {
    id: 'item-1',
    name: 'Item',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

type MockKernelState = {
  router: RouterReducerState;
  undo: UndoState;
};

export type MockState = Partial<MockKernelState> & Record<string, unknown>;

export function mockKernelState(overrides: MockState = {}): MockKernelState {
  return {
    router: mockRouterState(),
    undo: initialUndoState,
    ...overrides,
  };
}
