import { RouterReducerState } from '@ngrx/router-store';
import { BaseItem } from '../model/base-item.types';
import { Category } from '../model/category.types';

export const TEST_TIMESTAMP = '2024-01-01T12:00:00.000Z';

function mockRouterState(): RouterReducerState {
  return {
    state: {
      url: '/',
      root: {
        parameters: {},
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
};

export type MockState = Partial<MockKernelState> & Record<string, unknown>;

export function mockKernelState(overrides: MockState = {}): MockKernelState {
  return {
    router: mockRouterState(),
    ...overrides,
  };
}
