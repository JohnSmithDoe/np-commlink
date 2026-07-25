import { createEffect } from '@ngrx/effects';
import { Action, MemoizedSelector, Store } from '@ngrx/store';
import { Observable, tap, withLatestFrom } from 'rxjs';
import { DatabaseService } from '../util/db/database.service';

/**
 * Predicate matching a bounded context's own mutations by action-source prefix
 * while EXCLUDING its `load`/`loaded` hydration lifecycle. Hydration dispatches
 * `[X] load` while the slice is still at empty initialState (before the load
 * effect reads storage back), so persisting on it would clobber saved data — the
 * recurring lazy-cutover invariant. For contexts whose every non-lifecycle `[X]`
 * action is persist-worthy (cash/tasks/trackplay); a context that must skip a
 * high-frequency action (tracking's per-second tick) pipes an explicit
 * `ofType(...)` trigger instead.
 */
export const bySourcePrefix =
  (source: string) =>
  (action: Action): boolean =>
    action.type.startsWith(source) && !/\] (load|loaded)$/.test(action.type);

/**
 * Factory for the per-context "own-data save" effect (lazy-modules §4/Phase E:
 * each context persists its own slice, registered lazily with it). The only
 * variant across contexts is the `trigger$` — the caller's own `Actions` piped
 * through a source-prefix `filter` or an explicit mutation `ofType` list; the
 * rest (grab the latest slice value, write it under `key`, non-dispatching) is
 * identical everywhere.
 */
export function createSaveEffect<T>(
  store: Store,
  database: DatabaseService,
  trigger$: Observable<Action>,
  selector: MemoizedSelector<object, T>,
  key: string
) {
  return createEffect(
    () => {
      return trigger$.pipe(
        withLatestFrom(store.select(selector)),
        tap(([, state]) => {
          void database.save(key, state);
        })
      );
    },
    { dispatch: false }
  );
}
