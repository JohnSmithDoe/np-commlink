import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Action, ActionCreator, Store } from '@ngrx/store';
import { firstValueFrom, take } from 'rxjs';
import { PersistedReadRegistry } from '../../util/persistence/persisted-read-registry';

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
 *
 * Only the FIRST entry pays for that. Route injectors and their state are never
 * torn down (the lazy≠unloaded rule), and the save effect is the doc's only
 * writer, so a slice that has hydrated once is already current — re-reading it on
 * every re-entry cost a blocking IndexedDB round-trip per subtree entry, over the
 * whole doc (`npc-groceries` is five aggregates in one), and replaced the slice
 * object so every memoized selector under it recomputed. `deck→MARKET→deck→STASH`
 * paid two of those for nothing.
 *
 * `PersistedReadRegistry` is the honest condition for "already hydrated": it
 * records a key only once its read RESOLVED. A rejected read deliberately does
 * not record, so a context whose first load failed still retries on re-entry
 * instead of being stuck with initialState for the session.
 */
export function moduleHydrationResolver(
  key: string,
  load: ActionCreator<string, () => Action>,
  loaded: ActionCreator
): ResolveFn<boolean> {
  return async () => {
    const reads = inject(PersistedReadRegistry);
    if (reads.mayPersist(key)) return true;

    const store = inject(Store);
    const actions$ = inject(Actions);
    const hydrated = firstValueFrom(actions$.pipe(ofType(loaded), take(1)));
    store.dispatch(load());
    await hydrated;
    return true;
  };
}
