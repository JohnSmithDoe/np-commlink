import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import {
  bySourcePrefix,
  createSaveEffect,
} from '../../../@shared/data/create-save.effect';
import { selectTasksState } from '../tasks.selector';

// Persist the tasks slice on any [Tasks] mutation (lazy-modules Phase E: the
// tasks context owns its own save). Split out of the shell's
// saveGroceryOnChange$ and registered lazily with the tasks slice on the
// /tasks route (see provide-tasks-lazy.ts), so `state.tasks` is always present.
//
// `bySourcePrefix` excludes the `[Tasks] load`/`[Tasks] loaded` hydration
// lifecycle: tasks reuse the `[Tasks]` source for hydration, and the resolver
// dispatches `[Tasks] load` on route entry while the slice is still at empty
// initialState (before TasksLoadEffects reads storage back), so persisting on it
// would clobber the saved tasks. (The exact data-loss bug that bit [Tasks]
// before — see the reload e2e guard.)
@Injectable({ providedIn: 'root' })
export class TasksSaveEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);

  saveOnChange$ = createSaveEffect(
    this.#store,
    this.#database,
    this.#actions$.pipe(filter(bySourcePrefix('[Tasks]'))),
    selectTasksState,
    'tasks'
  );
}
