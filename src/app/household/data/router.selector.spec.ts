import { RouterReducerState } from '@ngrx/router-store';
import { selectRouteParams as selectRouteParameters } from './router.selector';

function routerState(
  url: string,
  parameters: Record<string, string>
): { router: RouterReducerState } {
  const leaf = {
    params: parameters,
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
    expect(selectRouteParameters(state)).toEqual({ listId: '_storage' });
  });

  it('resolves the :listId param for a tasks URL', () => {
    const state = routerState('/tasks/_tasks', { listId: '_tasks' });
    expect(selectRouteParameters(state)).toEqual({ listId: '_tasks' });
  });

  it('returns empty params for a param-less route', () => {
    const state = routerState('/tracking', {});
    expect(selectRouteParameters(state)).toEqual({});
  });
});
