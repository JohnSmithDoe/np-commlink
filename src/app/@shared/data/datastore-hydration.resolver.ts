import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { firstValueFrom, take } from 'rxjs';
import { ApplicationActions } from './application.actions';

/**
 * Co-hydration resolver for lazily-registered feature slices.
 *
 * A lazy feature registers its reducers via `provideState(...)` in the route's
 * `providers`. Angular creates that route `EnvironmentInjector` (running the
 * `provideState`/`provideEffects` `ENVIRONMENT_INITIALIZER`s) during route
 * *recognition* — before resolvers run — so by the time this resolver executes
 * the feature's reducers are already in the store. Re-dispatching the datastore
 * load then hydrates the freshly-registered slices from persistence *together*
 * (via the shared `ApplicationActions.loadedSuccessfully` handler each reducer
 * already carries), rather than leaving them at `initialState`.
 *
 * This is the fix for the co-hydration crash of the reverted lazy WIP: the
 * grocery slices cross-read each other, so a single-slice registration left the
 * siblings `undefined`. The grocery routes co-register all three slices in one
 * `providers` array and share this resolver, so entering *any* grocery route
 * makes all three slices present *and* hydrated. `tasks` (self-contained) uses
 * the same resolver on its own route.
 *
 * We await `loadedSuccessfully` (which the load effect always emits — even on
 * the storage-error fallback path) so activation happens with data in place and
 * the first paint is not a flash of empty lists.
 */
export const datastoreHydrationResolver: ResolveFn<boolean> = () => {
  const store = inject(Store);
  const actions$ = inject(Actions);
  const hydrated = firstValueFrom(
    actions$.pipe(ofType(ApplicationActions.loadedSuccessfully), take(1))
  );
  store.dispatch(ApplicationActions.load());
  return hydrated.then(() => true);
};
