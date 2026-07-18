import { inject, Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, tap, withLatestFrom } from 'rxjs';
import { DatabaseService } from '../../@shared/util/database.service';
import { selectTasksState } from './tasks.selector';

// Persist the tasks slice on any [Tasks] mutation (lazy-modules Phase E: the
// tasks context owns its own save). Split out of the shell's
// saveGroceryOnChange$ and registered lazily with the tasks slice on the
// /tasks route (see provide-tasks-lazy.ts), so `state.tasks` is always present.
//
// Excludes the `[Tasks] load`/`[Tasks] loaded` hydration lifecycle: tasks reuse
// the `[Tasks]` source for hydration, and the resolver dispatches `[Tasks] load`
// on route entry while the slice is still at empty initialState (before
// TasksLoadEffects reads storage back), so persisting on it would clobber the
// saved tasks. Hydration is not a mutation. (The exact data-loss bug that bit
// [Tasks] before — see the reload e2e guard.)
@Injectable({ providedIn: 'root' })
export class TasksSaveEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  saveOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        filter(
          (action: { type: string }) =>
            /^\[Tasks\]/.test(action.type) &&
            !/\] (load|loaded)$/.test(action.type)
        ),
        withLatestFrom(
          this.#store.select(selectTasksState),
          (_action, tasks) => tasks
        ),
        tap((tasks) => {
          void this.#database.save('tasks', tasks);
        })
      );
    },
    { dispatch: false }
  );
}
