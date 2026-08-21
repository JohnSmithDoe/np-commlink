import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { routerNavigatedAction } from '@ngrx/router-store';
import { Action, createActionGroup, emptyProps } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { mockKernelState, mockRouterState } from '../../testing/test-data';
import { ItemListRouteActions } from '../actions/item-list-route.actions';
import { selectRouteCategoryFilter } from '../router/router.selector';
import {
  categoryFilterFromRoute,
  categoryFilterRouteEffects,
} from './category-filter.effects';

const TestActions = createActionGroup({
  source: 'Test',
  events: {
    updateFilter: (filterBy?: string) => ({ filterBy }),
    unrelated: emptyProps(),
  },
});

const navigated = () =>
  routerNavigatedAction({
    payload: { routerState: {}, event: {} },
  } as never);

describe('categoryFilterFromRoute', () => {
  let actions$: Observable<Action>;

  const setup = (queryParameters: Record<string, string | string[]> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockKernelState({
            router: mockRouterState({ url: '/tasks', queryParameters }),
          }),
        }),
      ],
    });
  };

  const emissions = (): Promise<Action[]> =>
    firstValueFrom(
      TestBed.runInInjectionContext(() =>
        categoryFilterFromRoute(selectRouteCategoryFilter, (id) =>
          id ? TestActions.updateFilter(id) : undefined
        )()
      ).pipe(toArray())
    );

  it('applies the drilled category once navigation has ended', async () => {
    setup({ filter: 'cat-1' });
    actions$ = of(navigated());

    expect(await emissions()).toEqual([TestActions.updateFilter('cat-1')]);
  });

  it('stays silent when the route carries no filter, so a restored filter survives', async () => {
    setup();
    actions$ = of(navigated());

    expect(await emissions()).toEqual([]);
  });

  it('ignores actions that are not the end of a navigation', async () => {
    setup({ filter: 'cat-1' });
    actions$ = of(TestActions.unrelated());

    expect(await emissions()).toEqual([]);
  });
});

const drain = (): Promise<unknown[]> =>
  firstValueFrom(
    TestBed.runInInjectionContext(() =>
      categoryFilterRouteEffects.stripCategoryFilterParam$()
    ).pipe(toArray())
  );

describe('categoryFilterRouteEffects', () => {
  let actions$: Observable<Action>;

  const setup = (url: string) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideMockActions(() => actions$)],
    });
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', { get: () => url });
    return vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  };

  it('navigates the filter param away, keeping the path', async () => {
    const navigate = setup('/household/storage?filter=cat-1');
    actions$ = of(ItemListRouteActions.clearCategoryFilter());

    await drain();

    expect(navigate).toHaveBeenCalledWith('/household/storage', {
      replaceUrl: true,
    });
  });

  it('does not navigate when there is no query string to strip', async () => {
    const navigate = setup('/household/storage');
    actions$ = of(ItemListRouteActions.clearCategoryFilter());

    await drain();

    expect(navigate).not.toHaveBeenCalled();
  });
});
