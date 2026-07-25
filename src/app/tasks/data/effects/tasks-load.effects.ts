import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { ITasksState } from '../../model';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';
import { TasksActions } from '../tasks.actions';

// Own-data load for the tasks context (lazy-modules plan §4). Reads only the
// `tasks` key on route entry and emits `loaded`; the reducer hydrates on it. On
// a storage failure it still emits `loaded(null)` so the resolver unblocks.
@Injectable({ providedIn: 'root' })
export class TasksLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createLoadEffect<ITasksState>(
    this.#actions$,
    this.#database,
    TasksActions.load,
    TasksActions.loaded,
    'tasks'
  );
}
