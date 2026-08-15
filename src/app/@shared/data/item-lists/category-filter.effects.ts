/* ─── why ─────────────────────────────────────────────────────────
 * Both effects hang off `routerNavigatedAction`, not the router STATE,
 * and that is the whole point. A slice hydrates in a route resolver,
 * while router state is written at `ROUTER_NAVIGATION` — before resolvers
 * run. An effect keyed on the state would dispatch the drilled filter and
 * then watch `loaded` replace the slice underneath it, losing the filter
 * on any first-navigation deep link. `ROUTER_NAVIGATED` fires on
 * `NavigationEnd`, so it is ordered after hydration by construction.
 *
 * The read direction is set-only: an absent `?filter=` is not a clear.
 * `filterBy` is persisted, so treating the URL as sole truth would wipe a
 * restored filter whenever a list opened without the param.
 * ───────────────────────────────────────────────────────────────── */

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { routerNavigatedAction } from '@ngrx/router-store';
import { Action, MemoizedSelector, Store } from '@ngrx/store';
import { filter, map, tap, withLatestFrom } from 'rxjs';
import { ItemListRouteActions } from '../actions/item-list-route.actions';

export const categoryFilterFromRoute = <T>(
  select: MemoizedSelector<object, T>,
  toAction: (context: T) => Action | undefined
) =>
  createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(routerNavigatedAction),
        withLatestFrom(store.select(select), (_, context) => toAction(context)),
        filter((action): action is Action => !!action)
      );
    },
    { functional: true }
  );

export const clearCategoryFilterIn = (toAction: () => Action) =>
  createEffect(
    (actions$ = inject(Actions)) => {
      return actions$.pipe(
        ofType(ItemListRouteActions.clearCategoryFilter),
        map(toAction)
      );
    },
    { functional: true }
  );

export const categoryFilterRouteEffects = {
  stripCategoryFilterParam$: createEffect(
    (actions$ = inject(Actions), router = inject(Router)) => {
      return actions$.pipe(
        ofType(ItemListRouteActions.clearCategoryFilter),
        map(() => router.url),
        filter((url) => url.includes('?')),
        tap(
          (url) =>
            void router.navigateByUrl(url.slice(0, url.indexOf('?')), {
              replaceUrl: true,
            })
        )
      );
    },
    { functional: true, dispatch: false }
  ),
};
