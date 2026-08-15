import { mockKernelState, mockRouterState } from '../../testing/test-data';
import {
  selectRouteCategoryFilter,
  selectRouteData,
  selectRouteParams as selectRouteParameters,
} from './router.selector';

describe('router.selector', () => {
  it('resolves the :listId param for a hash-routed categories URL', () => {
    const state = mockKernelState({
      router: mockRouterState({
        url: '/household/categories/_storage',
        parameters: { listId: '_storage' },
      }),
    });

    expect(selectRouteParameters(state)).toEqual({ listId: '_storage' });
  });

  it('resolves the listId a route definition fixes in its data', () => {
    const state = mockKernelState({
      router: mockRouterState({
        url: '/household/storage',
        data: { listId: '_storage' },
      }),
    });

    expect(selectRouteData(state)).toEqual({ listId: '_storage' });
  });

  it('returns empty data for a route declaring none', () => {
    const state = mockKernelState({
      router: mockRouterState({ url: '/tracking' }),
    });

    expect(selectRouteData(state)).toEqual({});
  });

  it('resolves the :listId param for a tasks URL', () => {
    const state = mockKernelState({
      router: mockRouterState({
        url: '/tasks/_tasks',
        parameters: { listId: '_tasks' },
      }),
    });

    expect(selectRouteParameters(state)).toEqual({ listId: '_tasks' });
  });

  it('returns empty params for a param-less route', () => {
    const state = mockKernelState({
      router: mockRouterState({ url: '/tracking' }),
    });

    expect(selectRouteParameters(state)).toEqual({});
  });

  it('reads the drilled category out of the filter query param', () => {
    const state = mockKernelState({
      router: mockRouterState({
        url: '/household/storage?filter=cat-1',
        queryParameters: { filter: 'cat-1' },
      }),
    });

    expect(selectRouteCategoryFilter(state)).toBe('cat-1');
  });

  it('reports no filter when the param is absent', () => {
    const state = mockKernelState({
      router: mockRouterState({ url: '/household/storage' }),
    });

    expect(selectRouteCategoryFilter(state)).toBeUndefined();
  });

  it('ignores a repeated filter param rather than half-applying it', () => {
    const state = mockKernelState({
      router: mockRouterState({
        url: '/household/storage?filter=cat-1&filter=cat-2',
        queryParameters: { filter: ['cat-1', 'cat-2'] },
      }),
    });

    expect(selectRouteCategoryFilter(state)).toBeUndefined();
  });
});
