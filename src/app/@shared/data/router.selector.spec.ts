import { RouterReducerState } from '@ngrx/router-store';
import { selectRouteParams, selectUrl } from './router.selector';

/**
 * Builds the serialized router slice the way @ngrx/router-store's
 * MinimalRouterStateSerializer does: a root ActivatedRouteSnapshot whose
 * deepest firstChild carries the leaf route's params.
 *
 * Note: `withHashLocation()` only changes how the URL is written to the
 * browser bar (`/#/storage/_storage`). The Angular router — and therefore the
 * serialized `state.url` — still sees the path form (`/storage/_storage`), so
 * route params resolve identically under hash routing. That is exactly what
 * this spec pins before any list-page depends on `:listId`.
 */
function routerState(
  url: string,
  params: Record<string, string>
): { router: RouterReducerState } {
  const leaf = {
    params,
    data: {},
    url: [],
    outlet: 'primary',
    routeConfig: null,
    queryParams: {},
    fragment: null,
    firstChild: undefined,
    children: [],
    title: undefined,
  };
  const root = { ...leaf, params: {}, firstChild: leaf, children: [leaf] };
  return {
    router: {
      state: { url, root },
      navigationId: 1,
    },
  } as unknown as { router: RouterReducerState };
}

describe('router.selector', () => {
  it('resolves the :listId param for a hash-routed storage URL', () => {
    const state = routerState('/storage/_storage', { listId: '_storage' });
    expect(selectRouteParams(state)).toEqual({ listId: '_storage' });
    expect(selectUrl(state)).toBe('/storage/_storage');
  });

  it('resolves the :listId param for a tasks URL', () => {
    const state = routerState('/tasks/_tasks', { listId: '_tasks' });
    expect(selectRouteParams(state)).toEqual({ listId: '_tasks' });
    expect(selectUrl(state)).toBe('/tasks/_tasks');
  });

  it('returns empty params for a param-less route', () => {
    const state = routerState('/tracking', {});
    expect(selectRouteParams(state)).toEqual({});
    expect(selectUrl(state)).toBe('/tracking');
  });
});
