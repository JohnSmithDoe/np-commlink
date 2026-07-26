import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Action, ActionCreator, Store } from '@ngrx/store';
import { firstValueFrom, take } from 'rxjs';

/**
 * Blocks route activation until a lazy module has hydrated its own data.
 * Replaces the single global `datastoreHydrationResolver` with a factory
 * parameterised by a module's own `load`/`loaded` actions, so entering a route
 * reads only that module's keys instead of re-reading the whole datastore.
 *
 * A lazy module registers its reducers via `provideState(...)` in the route's
 * `providers`; Angular creates that route `EnvironmentInjector` during route
 * *recognition* — before resolvers run — so the reducers are already in the
 * store when this resolver dispatches `load`. We await `loaded` (which the
 * module's load effect always emits, even on the storage-error fallback) so the
 * first paint is not a flash of empty lists.
 */
export function moduleHydrationResolver(
  load: ActionCreator<string, () => Action>,
  loaded: ActionCreator
): ResolveFn<boolean> {
  return async () => {
    const store = inject(Store);
    const actions$ = inject(Actions);
    const hydrated = firstValueFrom(actions$.pipe(ofType(loaded), take(1)));
    store.dispatch(load());
    await hydrated;
    return true;
  };
}
