import { RouterReducerState } from '@ngrx/router-store';
import { IBaseItem } from '../model/base-item.types';
import { ICategory } from '../model/category.types';

// NOTE: initial states are defined inline (rather than imported from the
// reducers) on purpose: a reducer module can evaluate a factory like
// `createBaseItem('initial')` -> `dayjs()` at load time, pulling a
// non-deterministic timestamp into the fixtures. Inlining keeps them
// deterministic and side-effect free.

/**
 * Deterministic test-data factories.
 *
 * Unlike the production factories these produce *stable* ids and timestamps so
 * equality/matching assertions in specs are repeatable. Every factory takes a
 * `Partial<...>` of overrides.
 */
export const TEST_TIMESTAMP = '2024-01-01T12:00:00.000Z';

// NB: no `mockDashboardState` here — the dashboard read-model belongs to
// commlink, and @shared is tagged `domain:@shared` while Sheriff checks every
// fromTag, so this file could not name a domain type even though `type:testing`
// may reach any layer. commlink has no `testing/` folder either: a summary is a
// two-field literal, so each dashboard spec writes its own. A domain fixture
// reaches `provideMockStore` through `TMockState`'s `Record<string, unknown>`
// half, which exists for exactly this.

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

export function mockCategory(overrides: Partial<ICategory> = {}): ICategory {
  return { id: 'cat-1', name: 'Category', ...overrides };
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

/**
 * The kernel slices seeded by default — not an app-wide state type. `dashboard`
 * is eager too but commlink owns it, and every bounded context is lazy; those
 * ride the `Record` half of {@link TMockState}, which is also what turns off
 * excess-property checking so a spec can seed any slice.
 *
 * A `type` alias, not an `interface`: aliases get an implicit index signature,
 * so a domain's own bundle type (`mockGroceriesState()`) stays assignable.
 */
type TMockKernelState = {
  router: RouterReducerState;
};

export type TMockState = Partial<TMockKernelState> & Record<string, unknown>;

/** A complete, overridable kernel state for use with `provideMockStore`. */
export function mockKernelState(overrides: TMockState = {}): TMockKernelState {
  return {
    router: mockRouterState(),
    ...overrides,
  };
}
