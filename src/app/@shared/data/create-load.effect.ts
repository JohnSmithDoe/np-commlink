import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator } from '@ngrx/store';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { DatabaseService } from '../util/db/database.service';

/**
 * Factory for the per-context "own-data load" effect that every bounded context
 * repeated verbatim (lazy-modules plan §4): on `loadType` — dispatched by the
 * route's `moduleHydrationResolver`, never at boot — read the slice's own
 * storage `key` and emit `loaded`; on a storage failure emit `loaded(null)` so
 * the resolver unblocks and the page paints empty rather than hanging.
 *
 * Parameterized by `(loadType, loadedFn, key)`. The caller passes its own
 * already-injected `Actions` + `DatabaseService`, so this stays a plain function
 * with no injection context of its own — `createEffect` runs the same as inline
 * and the returned effect keeps its metadata brand, so assigning the result to a
 * class field is discovered by `provideEffects(TheClass)` exactly as before. A
 * context that owns several keys just declares one field per key (see
 * `OfficeTimeLoadEffects`); the atomic multi-key grocery load is its own shape.
 */
export function createLoadEffect<T>(
  actions$: Actions,
  database: DatabaseService,
  loadType: ActionCreator,
  loadedFn: (value: T | null) => Action,
  key: string
) {
  return createEffect(() => {
    return actions$.pipe(
      ofType(loadType),
      switchMap(() =>
        from(database.load<T>(key)).pipe(
          map((value) => loadedFn(value)),
          catchError(() => of(loadedFn(null)))
        )
      )
    );
  });
}
